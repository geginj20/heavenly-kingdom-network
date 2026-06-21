import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";

function getSecret(c: { env?: unknown }, key: string): string {
  const env = c.env as Record<string, string> | undefined;
  return env?.[key] || (process.env as Record<string, string>)?.[key] || "";
}

async function generateHmacSha512Hex(text: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(text));
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function paystackPost(path: string, body: unknown, secret: string) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function paystackGet(path: string, secret: string) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  return res.json();
}

async function wiseGet(path: string, token: string) {
  const res = await fetch(`https://api.wise.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export const paymentRoutes = new Hono();

paymentRoutes.post("/initialize", zValidator("json", z.object({
  email: z.string().email(),
  amount: z.number().positive(),
  currency: z.string().default("KES"),
  metadata: z.record(z.unknown()).optional(),
})), async (c) => {
  const secret = getSecret(c, "PAYSTACK_SECRET_KEY");
  if (!secret) return c.json({ error: "Payment gateway not configured" }, 503);

  const { email, amount, currency, metadata } = c.req.valid("json");
  const callbackUrl = `${c.req.header("origin") || "http://localhost:5173"}/give?paystack_callback=1`;

  const result: Record<string, unknown> = await paystackPost("/transaction/initialize", {
    email,
    amount: Math.round(amount * 100),
    currency,
    callback_url: callbackUrl,
    metadata: { ...metadata, email },
  }, secret);

  if (!result.status) return c.json({ error: result.message || "Payment initialization failed" }, 400);
  return c.json(result.data);
});

paymentRoutes.get("/verify/:reference", async (c) => {
  const secret = getSecret(c, "PAYSTACK_SECRET_KEY");
  if (!secret) return c.json({ error: "Payment gateway not configured" }, 503);

  const reference = c.req.param("reference");
  const result: Record<string, unknown> = await paystackGet(`/transaction/verify/${reference}`, secret);

  if (!result.status) return c.json({ error: result.message || "Verification failed" }, 400);

  const data = result.data as Record<string, unknown>;

  if (data.status === "success") {
    const supabase = getSupabase();
    await supabase.from("donations").insert({
      amount: (data.amount as number) / 100,
      currency: data.currency || "KES",
      donor_email: data.customer ? (data.customer as Record<string, unknown>).email : "",
      donor_name: data.metadata ? (data.metadata as Record<string, unknown>).name || "" : "",
      recurring: false,
      payment_provider: "paystack",
      payment_reference: reference,
      status: "completed",
    });
  }

  return c.json({ status: data.status, amount: (data.amount as number) / 100, currency: data.currency });
});

paymentRoutes.post("/webhook", async (c) => {
  const secret = getSecret(c, "PAYSTACK_SECRET_KEY");
  if (!secret) return c.json({ error: "Not configured" }, 503);

  const signature = c.req.header("x-paystack-signature");
  if (!signature) return c.json({ error: "No signature" }, 401);

  const rawBody = await c.req.text();
  const expectedSignature = await generateHmacSha512Hex(rawBody, secret);
  if (signature !== expectedSignature) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const body: Record<string, unknown> = JSON.parse(rawBody);
  const event = body.event as string;
  const data = body.data as Record<string, unknown>;

  if (event === "charge.success" && (data.status as string) === "success") {
    const supabase = getSupabase();
    await supabase.from("donations").insert({
      amount: (data.amount as number) / 100,
      currency: data.currency || "KES",
      donor_email: data.customer ? (data.customer as Record<string, unknown>).email : "",
      donor_name: data.metadata ? (data.metadata as Record<string, unknown>).name || "" : "",
      recurring: false,
      payment_provider: "paystack",
      payment_reference: data.reference as string,
      status: "completed",
    });
  }

  return c.json({ received: true });
});

paymentRoutes.post("/paypal/create", zValidator("json", z.object({
  amount: z.number().positive(),
  currency: z.string().default("USD"),
})), async (c) => {
  const { amount, currency } = c.req.valid("json");
  const res = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: currency, value: amount.toFixed(2) },
        description: "Donation to Kingdom Mission Network",
      }],
    }),
  });
  const data: Record<string, unknown> = await res.json();
  return c.json({ id: data.id as string });
});

paymentRoutes.post("/paypal/capture", zValidator("json", z.object({
  orderId: z.string(),
})), async (c) => {
  const { orderId } = c.req.valid("json");
  const res = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const data: Record<string, unknown> = await res.json();

  if (data.status === "COMPLETED") {
    const supabase = getSupabase();
    const pu = (data.purchase_units as Record<string, unknown>[])?.[0];
    const amount = pu?.amount as Record<string, unknown>;
    const paypalData = data.payer as Record<string, unknown>;
    await supabase.from("donations").insert({
      amount: parseFloat(amount?.value as string) || 0,
      currency: (amount?.currency_code as string) || "USD",
      donor_email: (paypalData?.email_address as string) || "",
      donor_name: (paypalData?.name as Record<string, unknown>)?.given_name as string || "",
      recurring: false,
      payment_provider: "paypal",
      payment_reference: data.id as string,
      status: "completed",
    });
  }

  return c.json({ status: data.status, id: data.id });
});

paymentRoutes.get("/rate", async (c) => {
  const source = c.req.query("from") || "USD";
  const target = c.req.query("to") || "KES";
  const wiseToken = getSecret(c, "WISE_API_TOKEN");

  if (wiseToken) {
    try {
      const rates: Array<{ rate: number; source: string; target: string; time: string }> = await wiseGet(`/v1/rates?source=${source}&target=${target}`, wiseToken);
      if (rates?.length) return c.json({ rate: rates[0].rate, source, target, provider: "wise" });
    } catch { /* fallthrough */ }
  }

  const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${source}`);
  const data: Record<string, unknown> = await res.json();
  const rates = data.rates as Record<string, number>;
  return c.json({ rate: rates?.[target] || 0, source, target, provider: "exchangerate-api" });
});

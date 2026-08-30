import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";
import { computeKesToUsd, fetchExchangeRate } from "../lib/exchangeRate";
import { sendDonationEmail } from "../lib/email";

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
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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
  return res.json() as Promise<Record<string, unknown>>;
}

async function paystackGet(path: string, secret: string) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  return res.json() as Promise<Record<string, unknown>>;
}

async function getPayPalAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const creds = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await res.json()) as Record<string, unknown>;
  return data.access_token as string;
}

export const subscriptionRoutes = new Hono();

// Pricing calculation endpoint
subscriptionRoutes.get("/pricing", async (c) => {
  const wiseToken = getSecret(c, "WISE_API_TOKEN");
  const calculation = await computeKesToUsd(1000, wiseToken);
  return c.json({
    planName: "Kingdom Partner",
    kesAmount: calculation.kesAmount,
    usdAmount: calculation.usdAmount,
    exchangeRate: calculation.rate,
    provider: calculation.provider,
    interval: "monthly",
    description: "Monthly partnership subscription to support Kingdom Mission Network (1,000 KES / month)",
  });
});

// Paystack Subscription Initialize
subscriptionRoutes.post(
  "/initialize",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      name: z.string().min(1).default("Anonymous Partner"),
      interval: z.enum(["monthly", "yearly"]).default("monthly"),
      currency: z.enum(["KES", "USD"]).default("KES"),
      planId: z.string().optional(),
    })
  ),
  async (c) => {
    const secret = getSecret(c, "PAYSTACK_SECRET_KEY");
    if (!secret) return c.json({ error: "Payment gateway not configured" }, 503);

    const { email, name, interval, currency } = c.req.valid("json");
    const wiseToken = getSecret(c, "WISE_API_TOKEN");
    const conversion = await computeKesToUsd(1000, wiseToken);

    const callbackUrl = `${c.req.header("origin") || "http://localhost:3000"}/subscribe?paystack_callback=1`;

    // 1000 KES in cents = 100,000
    const chargeAmount = currency === "KES" ? 1000 * 100 : Math.round(conversion.usdAmount * 100);

    const result = await paystackPost(
      "/transaction/initialize",
      {
        email,
        amount: chargeAmount,
        currency,
        callback_url: callbackUrl,
        metadata: {
          name,
          subscriptionType: "kingdom_partner",
          interval,
          kesAmount: 1000,
          usdAmount: conversion.usdAmount,
          exchangeRate: conversion.rate,
        },
      },
      secret
    );

    if (!result.status) {
      return c.json({ error: (result.message as string) || "Subscription initialization failed" }, 400);
    }

    return c.json({
      ...(result.data as Record<string, unknown>),
      usdAmount: conversion.usdAmount,
      kesAmount: 1000,
      exchangeRate: conversion.rate,
    });
  }
);

// Paystack Subscription Verification
subscriptionRoutes.get("/verify/:reference", async (c) => {
  const secret = getSecret(c, "PAYSTACK_SECRET_KEY");
  if (!secret) return c.json({ error: "Payment gateway not configured" }, 503);

  const reference = c.req.param("reference");
  const result = await paystackGet(`/transaction/verify/${reference}`, secret);

  if (!result.status) {
    return c.json({ error: (result.message as string) || "Verification failed" }, 400);
  }

  const data = result.data as Record<string, unknown>;

  if (data.status === "success") {
    const supabase = getSupabase();
    const customer = (data.customer as Record<string, unknown>) || {};
    const metadata = (data.metadata as Record<string, unknown>) || {};
    const subscriberEmail = (customer.email as string) || (metadata.email as string) || "";
    const subscriberName = (metadata.name as string) || "Kingdom Partner";
    const kesAmount = Number(metadata.kesAmount) || 1000;
    const usdAmount = Number(metadata.usdAmount) || 7.72;
    const exchangeRate = Number(metadata.exchangeRate) || 0.00772;

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabase.from("subscriptions").upsert(
      {
        subscriber_name: subscriberName,
        subscriber_email: subscriberEmail,
        plan_name: "Kingdom Partner",
        amount: kesAmount,
        currency: "KES",
        usd_amount: usdAmount,
        exchange_rate: exchangeRate,
        interval: (metadata.interval as string) || "monthly",
        status: "active",
        payment_provider: "paystack",
        payment_reference: reference,
        customer_code: (customer.customer_code as string) || null,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        metadata,
      },
      { onConflict: "payment_reference", ignoreDuplicates: true }
    );

    // Also record in donations ledger
    await supabase.from("donations").upsert(
      {
        amount: kesAmount,
        currency: "KES",
        donor_email: subscriberEmail,
        donor_name: subscriberName,
        recurring: true,
        payment_provider: "paystack",
        payment_reference: reference,
        status: "completed",
      },
      { onConflict: "payment_reference", ignoreDuplicates: true }
    );

    await sendDonationEmail(c, subscriberEmail, subscriberName, kesAmount, "KES");
  }

  return c.json({
    status: data.status,
    amount: (data.amount as number) / 100,
    currency: data.currency,
    reference,
  });
});

// PayPal Order Create with Live KES->USD computation
subscriptionRoutes.post(
  "/paypal/create",
  zValidator(
    "json",
    z.object({
      name: z.string().default("Kingdom Partner"),
      email: z.string().email().optional(),
    })
  ),
  async (c) => {
    const clientId = getSecret(c, "PAYPAL_CLIENT_ID");
    const clientSecret = getSecret(c, "PAYPAL_CLIENT_SECRET");
    if (!clientId || !clientSecret) return c.json({ error: "PayPal not configured" }, 503);

    const wiseToken = getSecret(c, "WISE_API_TOKEN");
    const conversion = await computeKesToUsd(1000, wiseToken);
    const accessToken = await getPayPalAccessToken(clientId, clientSecret);

    const res = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: conversion.usdAmount.toFixed(2),
            },
            description: `Kingdom Partner Monthly Subscription (1,000 KES ≈ $${conversion.usdAmount.toFixed(2)} USD)`,
          },
        ],
      }),
    });

    const data = (await res.json()) as Record<string, unknown>;
    return c.json({
      id: data.id as string,
      usdAmount: conversion.usdAmount,
      kesAmount: 1000,
      exchangeRate: conversion.rate,
    });
  }
);

// PayPal Order Capture & Subscription Activation
subscriptionRoutes.post(
  "/paypal/capture",
  zValidator(
    "json",
    z.object({
      orderId: z.string(),
      subscriberName: z.string().optional(),
    })
  ),
  async (c) => {
    const clientId = getSecret(c, "PAYPAL_CLIENT_ID");
    const clientSecret = getSecret(c, "PAYPAL_CLIENT_SECRET");
    if (!clientId || !clientSecret) return c.json({ error: "PayPal not configured" }, 503);

    const { orderId, subscriberName } = c.req.valid("json");
    const accessToken = await getPayPalAccessToken(clientId, clientSecret);

    const res = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = (await res.json()) as Record<string, unknown>;

    if (data.status === "COMPLETED") {
      const supabase = getSupabase();
      const payer = (data.payer as Record<string, unknown>) || {};
      const payerName = (payer.name as Record<string, unknown>) || {};
      const fullName =
        subscriberName ||
        `${(payerName.given_name as string) || ""} ${(payerName.surname as string) || ""}`.trim() ||
        "Kingdom Partner";
      const email = (payer.email_address as string) || "";

      const pu = ((data.purchase_units as Record<string, unknown>[]) || [])[0] || {};
      const amountObj = (pu.amount as Record<string, unknown>) || {};
      const usdAmount = parseFloat(amountObj.value as string) || 7.72;

      const wiseToken = getSecret(c, "WISE_API_TOKEN");
      const conversion = await computeKesToUsd(1000, wiseToken);

      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await supabase.from("subscriptions").insert({
        subscriber_name: fullName,
        subscriber_email: email,
        plan_name: "Kingdom Partner",
        amount: 1000,
        currency: "KES",
        usd_amount: usdAmount,
        exchange_rate: conversion.rate,
        interval: "monthly",
        status: "active",
        payment_provider: "paypal",
        payment_reference: orderId,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
      });

      await supabase.from("donations").insert({
        amount: usdAmount,
        currency: "USD",
        donor_email: email,
        donor_name: fullName,
        recurring: true,
        payment_provider: "paypal",
        payment_reference: orderId,
        status: "completed",
      });

      await sendDonationEmail(c, email, fullName, usdAmount, "USD");
    }

    return c.json({ status: data.status, id: data.id });
  }
);

// Webhook Receiver (Paystack HMAC validated)
subscriptionRoutes.post("/webhook", async (c) => {
  const secret = getSecret(c, "PAYSTACK_SECRET_KEY");
  if (!secret) return c.json({ error: "Not configured" }, 503);

  const signature = c.req.header("x-paystack-signature");
  if (!signature) return c.json({ error: "No signature" }, 401);

  const rawBody = await c.req.text();
  const expectedSignature = await generateHmacSha512Hex(rawBody, secret);
  if (signature !== expectedSignature) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const body = JSON.parse(rawBody) as Record<string, unknown>;
  const event = body.event as string;
  const data = (body.data as Record<string, unknown>) || {};
  const supabase = getSupabase();

  if (event === "charge.success" || event === "subscription.create") {
    const customer = (data.customer as Record<string, unknown>) || {};
    const metadata = (data.metadata as Record<string, unknown>) || {};
    const email = (customer.email as string) || (metadata.email as string) || "";
    const name = (metadata.name as string) || "Kingdom Partner";
    const ref = (data.reference as string) || (data.subscription_code as string);

    if (ref) {
      await supabase.from("subscriptions").upsert(
        {
          subscriber_name: name,
          subscriber_email: email,
          plan_name: "Kingdom Partner",
          amount: 1000,
          currency: "KES",
          usd_amount: Number(metadata.usdAmount) || 7.72,
          exchange_rate: Number(metadata.exchangeRate) || 0.00772,
          interval: "monthly",
          status: "active",
          payment_provider: "paystack",
          payment_reference: ref,
          subscription_code: (data.subscription_code as string) || null,
          customer_code: (customer.customer_code as string) || null,
        },
        { onConflict: "payment_reference", ignoreDuplicates: false }
      );
    }
  } else if (event === "subscription.disable") {
    const subCode = data.subscription_code as string;
    if (subCode) {
      await supabase
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("subscription_code", subCode);
    }
  }

  return c.json({ received: true });
});

// Check Subscription Status
subscriptionRoutes.get("/status/:email", async (c) => {
  const email = c.req.param("email");
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("subscriber_email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return c.json({ hasActiveSubscription: false, subscription: null });
    }

    const sub = data[0];
    const isActive = sub.status === "active";
    return c.json({
      hasActiveSubscription: isActive,
      subscription: sub,
    });
  } catch {
    return c.json({ hasActiveSubscription: false, subscription: null });
  }
});

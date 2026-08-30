import { expect, test, describe, beforeAll } from "vitest";
import { Hono } from "hono";
import { subscriptionRoutes } from "./subscriptions";

const app = new Hono();
app.route("/", subscriptionRoutes);

describe("Subscription Routes", () => {
  beforeAll(() => {
    process.env.PAYSTACK_SECRET_KEY = "test_secret";
  });

  test("GET /pricing returns 1000 KES dynamic USD calculation", async () => {
    const res = await app.request("/pricing");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      planName: string;
      kesAmount: number;
      usdAmount: number;
      exchangeRate: number;
      interval: string;
    };
    expect(body.planName).toBe("Kingdom Partner");
    expect(body.kesAmount).toBe(1000);
    expect(typeof body.usdAmount).toBe("number");
    expect(body.usdAmount).toBeGreaterThan(0);
    expect(typeof body.exchangeRate).toBe("number");
    expect(body.exchangeRate).toBeGreaterThan(0);
    expect(body.interval).toBe("monthly");
  });

  test("POST /initialize rejects missing or invalid email", async () => {
    const res1 = await app.request("/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test User" }),
    });
    expect(res1.status).toBe(400);

    const res2 = await app.request("/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid-email" }),
    });
    expect(res2.status).toBe(400);
  });

  test("POST /webhook rejects missing signature", async () => {
    const res = await app.request("/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "subscription.create" }),
    });
    expect(res.status).toBe(401);
  });

  test("POST /webhook rejects invalid signature", async () => {
    const res = await app.request("/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-paystack-signature": "bogus_signature",
      },
      body: JSON.stringify({ event: "subscription.create" }),
    });
    expect(res.status).toBe(401);
  });

  test("POST /paypal/create returns 503 when PayPal credentials missing", async () => {
    const res = await app.request("/paypal/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Kingdom Partner" }),
    });
    expect(res.status).toBe(503);
  });

  test("POST /paypal/capture rejects empty payload", async () => {
    const res = await app.request("/paypal/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  test("GET /status/:email returns subscription check", async () => {
    const res = await app.request("/status/unknown@user.com");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { hasActiveSubscription: boolean };
    expect(body).toHaveProperty("hasActiveSubscription");
  });
});

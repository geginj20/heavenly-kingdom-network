import { expect, test, describe, vi, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { paymentRoutes } from './payments';

const app = new Hono();
app.route('/', paymentRoutes);

describe('Payment Routes', () => {
  beforeAll(() => {
    process.env.PAYSTACK_SECRET_KEY = 'test_secret';
  });

  test('POST /initialize rejects missing email', async () => {
    const res = await app.request('/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100 }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /initialize rejects negative amount', async () => {
    const res = await app.request('/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', amount: -50 }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /initialize rejects invalid email', async () => {
    const res = await app.request('/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bad', amount: 100 }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /webhook rejects missing signature', async () => {
    const res = await app.request('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'charge.success' }),
    });
    expect(res.status).toBe(401);
  });

  test('POST /webhook rejects invalid signature', async () => {
    const res = await app.request('/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': 'invalid_sig',
      },
      body: JSON.stringify({ event: 'charge.success' }),
    });
    expect(res.status).toBe(401);
  });

  test('POST /paypal/create rejects negative amount', async () => {
    const res = await app.request('/paypal/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: -10 }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /paypal/create rejects missing amount', async () => {
    const res = await app.request('/paypal/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  test('POST /paypal/capture rejects missing orderId', async () => {
    const res = await app.request('/paypal/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  test('POST /paypal/capture accepts valid orderId and returns error from PayPal', async () => {
    const res = await app.request('/paypal/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: 'fake-order-id' }),
    });
    expect(res.status).toBe(200);
  });

  test('GET /verify/:reference returns error for missing secret', async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    const res = await app.request('/verify/test-ref');
    expect(res.status).toBe(503);
    process.env.PAYSTACK_SECRET_KEY = 'test_secret';
  });

  test('GET /rate returns exchange rate', async () => {
    const res = await app.request('/rate?from=USD&to=KES');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('rate');
    expect(body).toHaveProperty('source', 'USD');
    expect(body).toHaveProperty('target', 'KES');
  });
});

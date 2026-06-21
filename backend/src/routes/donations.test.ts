import { expect, test, describe } from 'vitest';
import { Hono } from 'hono';
import { donationRoutes } from './donations';

process.env.JWT_SECRET = 'test-secret';

const app = new Hono();
app.route('/', donationRoutes);

describe('Donation Routes', () => {
  test('POST / requires auth (no token)', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100, donor_email: 'test@test.com' }),
    });
    expect(res.status).toBe(401);
  });

  test('POST / rejects with invalid token', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.token.here',
      },
      body: JSON.stringify({ amount: 100 }),
    });
    expect(res.status).toBe(401);
  });

  test('GET /history returns empty without email', async () => {
    const res = await app.request('/history');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  test('GET /history returns 401 without token when email provided', async () => {
    const res = await app.request('/history?email=test@test.com');
    expect(res.status).toBe(401);
  });

  test('GET /history returns 401 with invalid token', async () => {
    const res = await app.request('/history?email=test@test.com', {
      headers: { Authorization: 'Bearer bad.token.here' },
    });
    expect(res.status).toBe(401);
  });
});

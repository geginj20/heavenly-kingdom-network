import { expect, test, describe } from 'vitest';
import { rateLimit, strictRateLimit } from './rateLimiter';
import { Hono } from 'hono';

describe('Rate Limiter', () => {
  test('rateLimit allows up to 20 requests', async () => {
    const app = new Hono();
    app.use('*', rateLimit);
    app.get('/', (c) => c.text('ok'));

    for (let i = 0; i < 20; i++) {
      const res = await app.request('http://localhost/', { headers: { 'cf-connecting-ip': '1.2.3.4' } });
      expect(res.status).toBe(200);
    }
    const res21 = await app.request('http://localhost/', { headers: { 'cf-connecting-ip': '1.2.3.4' } });
    expect(res21.status).toBe(429);
  });

  test('strictRateLimit allows up to 5 requests', async () => {
    const app = new Hono();
    app.use('*', strictRateLimit);
    app.get('/', (c) => c.text('ok'));

    for (let i = 0; i < 5; i++) {
      const res = await app.request('http://localhost/', { headers: { 'cf-connecting-ip': '5.6.7.8' } });
      expect(res.status).toBe(200);
    }
    const res6 = await app.request('http://localhost/', { headers: { 'cf-connecting-ip': '5.6.7.8' } });
    expect(res6.status).toBe(429);
  });
});

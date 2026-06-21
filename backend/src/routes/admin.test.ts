import { expect, test, describe } from 'vitest';
import { Hono } from 'hono';
import { adminRoutes } from './admin';

const app = new Hono();
app.route('/', adminRoutes);

describe('Admin Routes', () => {
  test('GET /stats requires auth', async () => {
    const res = await app.request('/stats');
    expect(res.status).toBe(401);
  });

  test('GET /requires auth', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(401);
  });
});

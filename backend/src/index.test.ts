import { expect, test, describe, beforeAll } from 'vitest';

const env = { SENTRY_DSN: '', SENTRY_ENVIRONMENT: 'test' };

describe('App integration', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  test('GET /api/health returns ok', async () => {
    const app = (await import('./index')).default;
    const res = await app.request('http://localhost/api/health', {}, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('timestamp');
  });

  test('unknown route returns 404', async () => {
    const app = (await import('./index')).default;
    const res = await app.request('http://localhost/api/nonexistent', {}, env);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Not Found');
  });

  test('CORS header is set on cross-origin request', async () => {
    const app = (await import('./index')).default;
    const res = await app.request('http://localhost/api/health', { headers: { Origin: 'http://localhost:3000' } }, env);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
  });
});

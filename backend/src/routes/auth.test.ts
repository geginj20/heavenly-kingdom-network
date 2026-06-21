import type { SupabaseClient } from '@supabase/supabase-js';
import { expect, test, describe, vi, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { authRoutes } from './auth';
import { getSupabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

vi.mock('../lib/rateLimiter', () => ({
  rateLimit: vi.fn((_c, next) => next()),
  strictRateLimit: vi.fn((_c, next) => next()),
}));

process.env.JWT_SECRET = 'test-secret';

const app = new Hono();
app.route('/', authRoutes);

describe('Auth Routes', () => {
  beforeAll(() => {
    vi.mocked(getSupabase).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
        signInWithIdToken: vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }),
        admin: { updateUserById: vi.fn().mockResolvedValue({ error: null }) },
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: '1', name: 'Test', email: 'test@test.com', role: 'member' }, error: null }),
      }),
    } as unknown as SupabaseClient);
  });

  test('POST /login with valid credentials', async () => {
    const res = await app.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
    });
    expect(res.status).toBe(200);
  });

  test('POST /login rejects missing password', async () => {
    const res = await app.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /login rejects invalid email', async () => {
    const res = await app.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'password123' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /forgot-password accepts valid email', async () => {
    const res = await app.request('/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com' }),
    });
    expect(res.status).toBe(200);
  });

  test('POST /forgot-password rejects missing email', async () => {
    const res = await app.request('/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  test('POST /register rejects short name', async () => {
    const res = await app.request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', email: 'test@test.com', password: 'password123' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /register rejects short password', async () => {
    const res = await app.request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John', email: 'test@test.com', password: '12345' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /register rejects invalid email', async () => {
    const res = await app.request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John', email: 'not-email', password: 'password123' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /google rejects empty token', async () => {
    const res = await app.request('/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: '' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /reset-password rejects short password', async () => {
    const res = await app.request('/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: '12345', token: 'some-token' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /reset-password rejects missing token', async () => {
    const res = await app.request('/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'password123' }),
    });
    expect(res.status).toBe(400);
  });

  test('GET /me rejects without token', async () => {
    const res = await app.request('/me');
    expect(res.status).toBe(401);
  });

  test('GET /me rejects invalid token', async () => {
    const res = await app.request('/me', {
      headers: { Authorization: 'Bearer bad.token.here' },
    });
    expect(res.status).toBe(401);
  });
});

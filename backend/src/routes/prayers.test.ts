import { expect, test, describe, vi, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { prayerRoutes } from './prayers';
import { getSupabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

vi.mock('../lib/rateLimiter', () => ({
  rateLimit: vi.fn((_c, next) => next()),
}));

const app = new Hono();
app.route('/', prayerRoutes);

describe('Prayer Routes', () => {
  beforeAll(() => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockInsertSingle = vi.fn().mockResolvedValue({ data: { id: 1 }, error: null });
    const mockInsert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockInsertSingle }) });
    const mockRpcSingle = vi.fn().mockResolvedValue({ data: { prayers: 1 }, error: null });
    const mockRpc = vi.fn().mockReturnValue({ single: mockRpcSingle });
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
        eq: mockEq,
        order: mockOrder,
        single: mockSingle,
      }),
      rpc: mockRpc,
    } as any);
  });

  test('GET / returns prayer list', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
  });

  test('GET / returns empty array when no prayers', async () => {
    const res = await app.request('/');
    const body = await res.json();
    expect(body).toEqual([]);
  });

  test('POST / creates a prayer', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'Healing', text: 'Please pray for my family' }),
    });
    expect(res.status).toBe(201);
  });

  test('POST / rejects short prayer text', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'Healing', text: 'Short' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST / rejects missing category', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Please pray for my family' }),
    });
    expect(res.status).toBe(400);
  });

  test('GET /categories returns categories', async () => {
    const res = await app.request('/categories');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toContain('Healing');
    expect(body).toContain('All Prayers');
  });

  test('GET / with category filter', async () => {
    const res = await app.request('/?category=Healing');
    expect(res.status).toBe(200);
  });

  test('POST /:id/pray increments prayer count', async () => {
    const res = await app.request('/1/pray', { method: 'POST' });
    expect(res.status).toBe(200);
  });

  test('GET /:id/comments returns comments', async () => {
    const res = await app.request('/1/comments');
    expect(res.status).toBe(200);
  });

  test('POST /:id/comments rejects empty text', async () => {
    const res = await app.request('/1/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /:id/comments rejects text over 500 chars', async () => {
    const res = await app.request('/1/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'x'.repeat(501) }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /:id/comments accepts valid comment', async () => {
    const res = await app.request('/1/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Praying for you!' }),
    });
    expect(res.status).toBe(201);
  });

  test('POST / rejects empty category', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: '', text: 'Please pray for my family' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST / rejects text over 500 chars', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'Healing', text: 'x'.repeat(501) }),
    });
    expect(res.status).toBe(400);
  });
});

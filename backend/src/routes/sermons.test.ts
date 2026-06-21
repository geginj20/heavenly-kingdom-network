import type { SupabaseClient } from '@supabase/supabase-js';
import { expect, test, describe, vi, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { sermonRoutes } from './sermons';
import { getSupabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

process.env.JWT_SECRET = 'test-secret';

const app = new Hono();
app.route('/', sermonRoutes);

describe('Sermon Routes', () => {
  beforeAll(() => {
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 1, title: 'Test' }, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }),
    } as unknown as SupabaseClient);
  });

  test('GET / returns sermon list', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
  });

  test('GET /categories returns categories list', async () => {
    const res = await app.request('/categories');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toContain('Faith');
    expect(body).toContain('All');
  });

  test('POST / requires auth and rejects missing title', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speaker: 'Pastor', duration: '30 min', category: 'Faith' }),
    });
    expect(res.status).toBe(401);
  });

  test('POST / requires auth and rejects missing speaker', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Sermon', duration: '30 min', category: 'Faith' }),
    });
    expect(res.status).toBe(401);
  });

  test('PATCH /:id requires auth', async () => {
    const res = await app.request('/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    });
    expect(res.status).toBe(401);
  });

  test('DELETE /:id requires auth', async () => {
    const res = await app.request('/1', { method: 'DELETE' });
    expect(res.status).toBe(401);
  });
});

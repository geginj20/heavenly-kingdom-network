import type { SupabaseClient } from '@supabase/supabase-js';
import { expect, test, describe, vi, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { streamRoutes } from './streams';
import { getSupabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

const app = new Hono();
app.route('/', streamRoutes);

describe('Stream Routes', () => {
  beforeAll(() => {
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    } as unknown as SupabaseClient);
  });

  test('GET /upcoming returns empty array when DB empty', async () => {
    const res = await app.request('/upcoming');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeInstanceOf(Array);
    expect(body.length).toBe(0);
  });

  test('GET /upcoming returns DB streams when available', async () => {
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: '1', title: 'Live Stream', date: '2026-06-22', time: '10:00' }], error: null }),
      }),
    } as unknown as SupabaseClient);

    const res = await app.request('/upcoming');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0].title).toBe('Live Stream');
  });
});

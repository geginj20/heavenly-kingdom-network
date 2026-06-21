import { expect, test, describe, vi, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { bibleRoutes } from './bible';
import { getSupabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

const app = new Hono();
app.route('/', bibleRoutes);

describe('Bible Notes', () => {
  beforeAll(() => {
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 1, text: 'My note' }, error: null }),
          }),
        }),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    } as any);
  });

  test('POST /notes rejects missing book', async () => {
    const res = await app.request('/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verse: 'John 3:16', text: 'Great verse' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /notes rejects missing verse', async () => {
    const res = await app.request('/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book: 'John', text: 'Great verse' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /notes rejects missing text', async () => {
    const res = await app.request('/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book: 'John', verse: 'John 3:16' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /notes accepts valid note', async () => {
    const res = await app.request('/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book: 'John', verse: 'John 3:16', text: 'For God so loved the world' }),
    });
    expect(res.status).toBe(201);
  });

  test('GET /notes returns empty without userId', async () => {
    const res = await app.request('/notes');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

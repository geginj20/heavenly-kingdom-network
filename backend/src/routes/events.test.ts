import { expect, test, describe, vi, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { eventRoutes } from './events';
import { getSupabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

process.env.JWT_SECRET = 'test-secret';

const app = new Hono();
app.route('/', eventRoutes);

describe('Event Routes', () => {
  beforeAll(() => {
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
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
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }),
    } as any);
  });

  test('GET / returns event list', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
  });

  test('POST / requires auth', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Event', date: '2026-07-01', time: '7:00 PM', location: 'Online', description: 'Test' }),
    });
    expect(res.status).toBe(401);
  });

  test('POST / rejects missing title', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-07-01', time: '7:00 PM', location: 'Online', description: 'Test' }),
    });
    expect(res.status).toBe(401);
  });

  test('POST /:id/rsvp rejects missing email', async () => {
    const res = await app.request('/1/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /:id/rsvp rejects missing name', async () => {
    const res = await app.request('/1/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@test.com' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /:id/rsvp rejects invalid email', async () => {
    const res = await app.request('/1/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John', email: 'bad' }),
    });
    expect(res.status).toBe(400);
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

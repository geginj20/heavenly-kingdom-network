import { expect, test, describe, vi, beforeEach } from 'vitest';
import { getSupabase, resetSupabase } from './supabase';
import { getEnv } from './env';

vi.mock('./env', () => ({
  getEnv: vi.fn((key: string) => {
    if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
    if (key === 'SUPABASE_SERVICE_KEY') return 'test-service-key';
    return '';
  }),
}));

describe('Supabase Client', () => {
  beforeEach(() => {
    resetSupabase();
    vi.mocked(getEnv).mockImplementation((key: string) => {
      if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
      if (key === 'SUPABASE_SERVICE_KEY') return 'test-service-key';
      return '';
    });
  });

  test('getSupabase returns a client when env vars are set', () => {
    const client = getSupabase();
    expect(client).toBeDefined();
    expect(client.from).toBeInstanceOf(Function);
  });

  test('getSupabase returns cached instance on second call', () => {
    const a = getSupabase();
    const b = getSupabase();
    expect(a).toBe(b);
  });

  test('getSupabase throws when URL is missing', () => {
    vi.mocked(getEnv).mockImplementation((key: string) => {
      if (key === 'SUPABASE_SERVICE_KEY') return 'test-service-key';
      return '';
    });
    resetSupabase();
    expect(() => getSupabase()).toThrow('SUPABASE_URL');
  });

  test('getSupabase throws when key is missing', () => {
    vi.mocked(getEnv).mockImplementation((key: string) => {
      if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
      return '';
    });
    resetSupabase();
    expect(() => getSupabase()).toThrow('SUPABASE_SERVICE_KEY');
  });
});

import { expect, test, describe, beforeEach } from 'vitest';
import { setEnv, getEnv } from './env';

describe('Env Utility', () => {
  beforeEach(() => {
    setEnv({});
  });

  test('getEnv returns empty string for unset key', () => {
    expect(getEnv('MISSING_KEY')).toBe('');
  });

  test('getEnv returns value after setEnv', () => {
    setEnv({ DATABASE_URL: 'postgres://localhost' });
    expect(getEnv('DATABASE_URL')).toBe('postgres://localhost');
  });

  test('setEnv overwrites previous values', () => {
    setEnv({ KEY: 'first' });
    setEnv({ KEY: 'second' });
    expect(getEnv('KEY')).toBe('second');
  });

  test('getEnv returns empty for different key', () => {
    setEnv({ FOO: 'bar' });
    expect(getEnv('BAR')).toBe('');
  });

  test('setEnv handles multiple keys', () => {
    setEnv({ A: '1', B: '2' });
    expect(getEnv('A')).toBe('1');
    expect(getEnv('B')).toBe('2');
  });
});

import { expect, test, describe } from 'vitest';
import { signToken, verifyToken } from './jwt';

process.env.JWT_SECRET = 'test-secret';

describe('JWT Utility', () => {
  test('should sign and verify a token correctly', async () => {
    const payload = { userId: 'user_123', role: 'admin', name: 'John Doe' };
    const token = await signToken(payload);
    expect(token).toBeDefined();

    const verified = await verifyToken(token);
    expect(verified.userId).toBe('user_123');
    expect(verified.role).toBe('admin');
    expect(verified.name).toBe('John Doe');
  });

  test('should throw on invalid token', async () => {
    await expect(verifyToken('invalid.token.here')).rejects.toThrow();
  });
});

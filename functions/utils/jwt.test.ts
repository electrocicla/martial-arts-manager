import { describe, expect, it, vi } from 'vitest';
import { createTokens, verifyJWT } from './jwt';

describe('tenant-bound JWT', () => {
  it('signs organization and token purpose for both token types', async () => {
    const tokens = await createTokens('member-1', 'member@example.org', 'instructor', 'unit-secret', 'manzur');
    expect(await verifyJWT(tokens.accessToken, 'unit-secret')).toMatchObject({
      sub: 'member-1', role: 'instructor', organization_id: 'manzur', token_use: 'access',
    });
    expect(await verifyJWT(tokens.refreshToken, 'unit-secret')).toMatchObject({
      sub: 'member-1', role: 'instructor', organization_id: 'manzur', token_use: 'refresh',
    });
  });

  it('uses unique signed refresh identities even within one second', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-11-15T18:00:00Z'));
      const one = await createTokens('same-user', 'member@example.org', 'student', 'unit-secret', 'manzur');
      const two = await createTokens('same-user', 'member@example.org', 'student', 'unit-secret', 'manzur');
      expect(one.refreshToken).not.toBe(two.refreshToken);
      const oneClaims = await verifyJWT(one.refreshToken, 'unit-secret');
      const twoClaims = await verifyJWT(two.refreshToken, 'unit-secret');
      expect(oneClaims?.jti).toMatch(/^[a-f0-9-]{36}$/i);
      expect(oneClaims?.jti).not.toBe(twoClaims?.jti);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects missing tenant and signature tampering', async () => {
    await expect(createTokens('u1', 'u@example.org', 'student', 'unit-secret', '')).rejects.toThrow('Organization ID');
    const { accessToken } = await createTokens('u1', 'u@example.org', 'student', 'unit-secret', 'hamarr');
    const parts = accessToken.split('.');
    parts[1] = Buffer.from(JSON.stringify({ role: 'admin', organization_id: 'manzur' })).toString('base64url');
    expect(await verifyJWT(parts.join('.'), 'unit-secret')).toBeNull();
    expect(await verifyJWT(accessToken, 'incorrect-secret')).toBeNull();
  });

  it('rejects expired signed access and refresh tokens', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const tokens = await createTokens('u1', 'u@example.org', 'student', 'unit-secret', 'hamarr');
      vi.setSystemTime(new Date('2026-02-01T00:00:00Z'));
      expect(await verifyJWT(tokens.accessToken, 'unit-secret')).toBeNull();
      expect(await verifyJWT(tokens.refreshToken, 'unit-secret')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

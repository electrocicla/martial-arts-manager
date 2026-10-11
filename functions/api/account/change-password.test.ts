import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from './change-password';
import { authenticateUser, getRefreshTokenFromRequest } from '../../middleware/auth';
import { hashPassword, verifyPassword } from '../../utils/hash';
import type { D1BindValue, D1Database, D1PreparedStatement, D1Result, Env } from '../../types/index';

vi.mock('../../middleware/auth', () => ({
  authenticateUser: vi.fn(),
  getRefreshTokenFromRequest: vi.fn(),
}));
vi.mock('../../utils/hash', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

type SqlCall = { sql: string; values: D1BindValue[] };

function result(changes: number): D1Result {
  return {
    success: true,
    meta: {
      changed_db: changes > 0,
      changes,
      duration: 0,
      rows_read: 0,
      rows_written: changes,
      size_after: 0,
    },
  };
}

function fixture() {
  const calls: SqlCall[] = [];
  const batch = vi.fn<(_: D1PreparedStatement[]) => Promise<D1Result[]>>()
    .mockResolvedValue([result(1), result(3)]);
  const db: D1Database = {
    prepare(sql: string): D1PreparedStatement {
      const call: SqlCall = { sql, values: [] };
      calls.push(call);
      const statement: D1PreparedStatement = {
        bind(...values: D1BindValue[]) { call.values = values; return statement; },
        async first<T>() { return { password_hash: 'previous-hash' } as T; },
        async run() { throw new Error('Expected atomic batch'); },
        async all<T>(): Promise<D1Result<T>> { throw new Error('Unexpected all'); },
      };
      return statement;
    },
    batch,
  };
  const env: Env = { DB: db, JWT_SECRET: 'test', TURNSTILE_SECRET: '', AVATARS: {} as Env['AVATARS'] };
  const request = (body: unknown, headers?: HeadersInit) =>
    new Request('https://hamarr.cl/api/account/change-password', {
      method: 'POST',
      headers: { 'X-Organization-ID': 'manzur', 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  return { calls, batch, env, request };
}

describe('change password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authenticateUser).mockResolvedValue({
      authenticated: true,
      user: {
        id: 'u-manzur', name: 'Admin', email: 'test@example.com',
        role: 'admin', organization_id: 'manzur', platform_admin: false,
      },
    });
    vi.mocked(getRefreshTokenFromRequest).mockReturnValue('session-to-keep');
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(hashPassword).mockResolvedValue('new-hash');
  });

  it('denies unauthorized users without reading or updating credentials', async () => {
    const { env, request, calls, batch } = fixture();
    vi.mocked(authenticateUser).mockResolvedValueOnce({
      authenticated: false, error: 'Membership required', status: 403,
    });
    const response = await onRequestPost({ request: request({
      currentPassword: 'OldPassw0rd!', newPassword: 'N3wPassword!',
    }), env });
    expect(response.status).toBe(403);
    expect(calls).toHaveLength(0);
    expect(batch).not.toHaveBeenCalled();
  });

  it('rejects invalid or weak inputs without changing database data', async () => {
    const { env, request, batch } = fixture();
    for (const body of [
      { currentPassword: { nested: 'value' }, newPassword: 'N3wPassword!' },
      { currentPassword: 'OldPassw0rd!', newPassword: 'weak' },
      { currentPassword: 'OldPassw0rd!', newPassword: 'OldPassw0rd!' },
    ]) {
      const response = await onRequestPost({ request: request(body), env });
      expect(response.status).toBe(400);
    }
    expect(batch).not.toHaveBeenCalled();
  });

  it('rejects an incorrect existing password', async () => {
    const { env, request, batch } = fixture();
    vi.mocked(verifyPassword).mockResolvedValue(false);
    const response = await onRequestPost({ request: request({
      currentPassword: 'WrongPassword!', newPassword: 'N3wPassword!',
    }), env });
    expect(response.status).toBe(401);
    expect(batch).not.toHaveBeenCalled();
  });

  it('atomically updates the identity and revokes all other refresh sessions', async () => {
    const { env, request, batch, calls } = fixture();
    const response = await onRequestPost({ request: request({
      currentPassword: 'OldPassw0rd!', newPassword: 'N3wPassword!',
    }), env });
    expect(response.status).toBe(200);
    expect(batch).toHaveBeenCalledTimes(1);
    expect(calls[2].sql).toContain('WHERE id = ? AND password_hash = ?');
    expect(calls[2].values).toEqual(['new-hash', expect.any(String), 'u-manzur', 'previous-hash']);
    expect(calls[1].sql).toContain('refresh_token != ?');
    expect(calls[1].values).toEqual(['u-manzur', 'session-to-keep']);
  });

  it('revokes all refresh sessions when there is no current refresh cookie', async () => {
    const { env, request, calls } = fixture();
    vi.mocked(getRefreshTokenFromRequest).mockReturnValue(null);
    const response = await onRequestPost({ request: request({
      currentPassword: 'OldPassw0rd!', newPassword: 'N3wPassword!',
    }), env });
    expect(response.status).toBe(200);
    expect(calls[1].sql).not.toContain('refresh_token !=');
    expect(calls[1].values).toEqual(['u-manzur']);
  });

  it('does not return success if the atomic batch fails or changes no user', async () => {
    const { env, request, batch } = fixture();
    batch.mockResolvedValueOnce([result(0), result(1)]);
    const body = { currentPassword: 'OldPassw0rd!', newPassword: 'N3wPassword!' };
    expect((await onRequestPost({ request: request(body), env })).status).toBe(409);
    batch.mockRejectedValueOnce(new Error('DB unavailable'));
    expect((await onRequestPost({ request: request(body), env })).status).toBe(500);
  });
});

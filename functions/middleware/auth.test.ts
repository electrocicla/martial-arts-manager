import { describe, expect, it } from 'vitest';
import { authenticateUser } from './auth';
import { createTokens } from '../utils/jwt';
import type { D1Database, D1PreparedStatement, D1Result, D1BindValue, Env } from '../types/index';

function env(
  membership: { organization_id: string; role: string; status: string } | null,
): Env {
  const db: D1Database = {
    prepare(sql): D1PreparedStatement {
      let args: D1BindValue[] = [];
      const statement: D1PreparedStatement = {
        bind(...values) { args = values; return statement; },
        async first<T>() {
          let value: unknown = null;
          if (sql.includes('FROM users WHERE id = ?')) {
            value = { id: 'u1', name: 'Tester', email: 't@example.org', role: 'admin',
              is_approved: 1, is_active: 1, student_id: 'global-unsafe', avatar_url: null };
          } else if (sql.includes('FROM organizations WHERE id = ?')) {
            value = { id: args[0], is_active: 1 };
          } else if (sql.includes('FROM organization_memberships')) {
            value = membership?.organization_id === args[0]
              ? { ...membership, user_id: 'u1', student_id: 'local-student',
                  is_active: 1, approved_by: null, approved_at: null } : null;
          }
          return value as T | null;
        },
        async all<T>(): Promise<D1Result<T>> { throw new Error('Unexpected all'); },
        async run(): Promise<D1Result> { throw new Error('Unexpected mutation'); },
      };
      return statement;
    },
    async batch<T>(): Promise<D1Result<T>[]> { throw new Error('Unexpected batch'); },
  };
  return { DB: db, JWT_SECRET: 'unit-secret', AVATARS: {} as Env['AVATARS'],
    TURNSTILE_SECRET: '' };
}

async function request(org: string, tokenOrg = org): Promise<Request> {
  const pair = await createTokens('u1', 't@example.org', 'admin', 'unit-secret', tokenOrg);
  return new Request('https://example.org/api/auth/me', {
    headers: { Authorization: 'Bearer ' + pair.accessToken, 'X-Organization-ID': org },
  });
}

describe('tenant authentication', () => {
  it('uses membership role and student_id, never global users columns', async () => {
    const result = await authenticateUser(await request('hamarr'),
      env({ organization_id: 'hamarr', role: 'student', status: 'active' }));
    expect(result.authenticated).toBe(true);
    if (!result.authenticated) return;
    expect(result.user.role).toBe('student');
    expect(result.user.student_id).toBe('local-student');
  });

  it('denies cross-tenant access for a valid global user', async () => {
    const result = await authenticateUser(await request('manzur'),
      env({ organization_id: 'hamarr', role: 'admin', status: 'active' }));
    expect(result).toMatchObject({ authenticated: false, code: 'ORGANIZATION_MEMBERSHIP_REQUIRED' });
  });

  it('denies pending tenants even if global user is approved', async () => {
    const result = await authenticateUser(await request('manzur'),
      env({ organization_id: 'manzur', role: 'student', status: 'pending' }));
    expect(result).toMatchObject({ authenticated: false, code: 'PENDING_APPROVAL' });
  });

  it('denies a token for a different tenant', async () => {
    const result = await authenticateUser(await request('manzur', 'hamarr'),
      env({ organization_id: 'manzur', role: 'admin', status: 'active' }));
    expect(result).toMatchObject({ authenticated: false, code: 'ORGANIZATION_TOKEN_MISMATCH' });
  });
});

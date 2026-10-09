import { describe, expect, it } from 'vitest';
import { createTokens } from '../../utils/jwt';
import { onRequestGet, onRequestPost, onRequestDelete } from './pending-approvals';
import type { Env, D1Database, D1PreparedStatement, D1Result, D1BindValue } from '../../types/index';

function fixture(role: 'admin' | 'instructor', pendingTenant: string): { env: Env; writes: number[] } {
  const writes: number[] = [];
  const db: D1Database = {
    prepare(sql): D1PreparedStatement {
      let params: D1BindValue[] = [];
      const statement: D1PreparedStatement = {
        bind(...args) { params = args; return statement; },
        async first<T>() {
          let result: unknown = null;
          if (sql.includes('FROM users WHERE id = ?')) {
            result = { id: 'staff', email: 'staff@example.org', name: 'Staff',
              is_active: 1, role: 'admin', student_id: null, avatar_url: null };
          } else if (sql.includes('FROM organizations WHERE id = ?')) {
            result = { id: params[0], is_active: 1 };
          } else if (sql.includes('FROM organization_memberships') && !sql.includes('JOIN users')) {
            result = { organization_id: 'hamarr', user_id: 'staff', role, status: 'active',
              is_active: 1, student_id: null, approved_by: null, approved_at: null };
          } else if (sql.includes('JOIN users') && sql.includes("om.status = 'pending'")) {
            if (params[0] === pendingTenant && params[1] === 'target') {
              result = { id: 'target', name: 'Target', email: 'target@example.org', role: 'student', student_id: null };
            }
          }
          return result as T | null;
        },
        async all<T>(): Promise<D1Result<T>> {
          const entries: unknown[] = params[0] === pendingTenant
            ? [{ id: 'target', name: 'Target', email: 'target@example.org', role: 'student' }]
            : [];
          return { results: entries as T[], success: true, meta: {} } as D1Result<T>;
        },
        async run(): Promise<D1Result> { writes.push(1); throw new Error('Unexpected write'); },
      };
      return statement;
    },
    async batch<T>(): Promise<D1Result<T>[]> { writes.push(1); throw new Error('Unexpected batch'); },
  };
  return { env: { DB: db, JWT_SECRET: 'unit-secret', AVATARS: {} as Env['AVATARS'], TURNSTILE_SECRET: '' }, writes };
}

async function request(method: 'GET' | 'POST' | 'DELETE'): Promise<Request> {
  const { accessToken } = await createTokens('staff', 'staff@example.org', 'admin', 'unit-secret', 'hamarr');
  return new Request('https://example.org/api/auth/pending-approvals', {
    method, headers: { Authorization: 'Bearer ' + accessToken, 'X-Organization-ID': 'hamarr', 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify({ user_id: 'target' }),
  });
}

describe('tenant-scoped approval authorization', () => {
  it('denies instructor access to pending approvals and mutations', async () => {
    const state = fixture('instructor', 'hamarr');
    for (const method of ['GET', 'POST', 'DELETE'] as const) {
      const requestValue = await request(method);
      const response = method === 'GET'
        ? await onRequestGet({ request: requestValue, env: state.env })
        : method === 'POST'
          ? await onRequestPost({ request: requestValue, env: state.env })
          : await onRequestDelete({ request: requestValue, env: state.env });
      expect(response.status).toBe(403);
    }
    expect(state.writes).toHaveLength(0);
  });

  it('does not list or approve another organization pending membership', async () => {
    const state = fixture('admin', 'manzur');
    const listing = await onRequestGet({ request: await request('GET'), env: state.env });
    expect(listing.status).toBe(200);
    expect((await listing.json()) as { pending_users: unknown[] }).toEqual({ pending_users: [] });
    const approving = await onRequestPost({ request: await request('POST'), env: state.env });
    const rejecting = await onRequestDelete({ request: await request('DELETE'), env: state.env });
    expect(approving.status).toBe(404);
    expect(rejecting.status).toBe(404);
    expect(state.writes).toHaveLength(0);
  });
});

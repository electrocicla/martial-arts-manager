import { describe, expect, it } from 'vitest';
import { createTokens } from '../../utils/jwt';
import { onRequestGet, onRequestPut, onRequestDelete } from './[id]';
import type { D1Database, D1PreparedStatement, D1BindValue, D1Result, Env } from '../../types/index';

function fixture(): { env: Env; writes: number[] } {
  const writes: number[] = [];
  const db: D1Database = {
    prepare(sql): D1PreparedStatement {
      let args: D1BindValue[] = [];
      const statement: D1PreparedStatement = {
        bind(...values) { args = values; return statement; },
        async first<T>() {
          let found: unknown = null;
          if (sql.includes('FROM users WHERE id = ?')) {
            found = { id: 'staff', email: 'staff@example.org', name: 'Staff',
              is_active: 1, role: 'admin', student_id: null, avatar_url: null };
          } else if (sql.includes('FROM organizations WHERE id = ?')) {
            found = { id: args[0], is_active: 1 };
          } else if (sql.includes('FROM organization_memberships')) {
            found = { organization_id: 'hamarr', user_id: 'staff', role: 'admin',
              status: 'active', is_active: 1, student_id: null };
          } else if (sql.includes('FROM branches WHERE id = ?')) {
            found = { id: 'main', is_active: 1, organization_id: 'hamarr' };
          } else if (sql.includes('FROM students')) {
            // The requested ID only exists in another tenant, not HAMARR.
            expect(args).toContain('hamarr');
            found = null;
          }
          return found as T | null;
        },
        async all<T>(): Promise<D1Result<T>> { throw new Error('Unexpected list query'); },
        async run(): Promise<D1Result> { writes.push(1); throw new Error('Cross-tenant write'); },
      };
      return statement;
    },
    async batch<T>(): Promise<D1Result<T>[]> { writes.push(1); throw new Error('Cross-tenant batch'); },
  };
  return { env: { DB: db, JWT_SECRET: 'unit-secret',
    AVATARS: {} as Env['AVATARS'], TURNSTILE_SECRET: '' }, writes };
}

describe('student ID tenant isolation', () => {
  it('fails closed on cross-tenant GET, PUT, and DELETE', async () => {
    const state = fixture();
    const { accessToken } = await createTokens('staff', 'staff@example.org', 'admin', 'unit-secret', 'hamarr');
    for (const method of ['GET', 'PUT', 'DELETE'] as const) {
      const request = new Request('https://example.org/api/students/manzur-student', {
        method,
        headers: { Authorization: 'Bearer ' + accessToken,
          'X-Organization-ID': 'hamarr', 'X-Branch-ID': 'main' },
        body: method === 'PUT' ? '{}' : undefined,
      });
      const context = { request, env: state.env, params: { id: 'manzur-student' } };
      const response = method === 'GET'
        ? await onRequestGet(context)
        : method === 'PUT'
          ? await onRequestPut(context)
          : await onRequestDelete(context);
      expect(response.status, method).toBe(404);
    }
    expect(state.writes).toHaveLength(0);
  });
});

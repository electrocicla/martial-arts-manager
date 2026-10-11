import { describe, expect, it } from 'vitest';
import { createTokens } from '../utils/jwt';
import type { D1BindValue, D1Database, D1PreparedStatement, D1Result, Env } from '../types/index';
import { onRequestPut } from './branches';

interface CapturedStatement {
  sql: string;
  params: D1BindValue[];
}

const RESULT_META = {
  changed_db: false,
  changes: 0,
  duration: 0,
  rows_read: 0,
  rows_written: 0,
  size_after: 0,
} as const;

function createFixture(): { env: Env; prepared: CapturedStatement[]; batches: number[] } {
  const prepared: CapturedStatement[] = [];
  const batches: number[] = [];

  const db: D1Database = {
    prepare(sql: string): D1PreparedStatement {
      const captured: CapturedStatement = { sql, params: [] };
      prepared.push(captured);
      const statement: D1PreparedStatement = {
        bind(...values: D1BindValue[]): D1PreparedStatement {
          captured.params = values;
          return statement;
        },
        async first<T>(): Promise<T | null> {
          let result: unknown = null;
          if (sql.includes('FROM users WHERE id = ?')) {
            result = { id: 'gaston', email: 'gaston@manzur.cl', name: 'Gastón',
              role: 'admin', is_active: 1, student_id: null, avatar_url: null };
          } else if (sql.includes('FROM organizations WHERE id = ?')) {
            result = { id: 'manzur', is_active: 1 };
          } else if (sql.includes('FROM organization_memberships') &&
                     sql.includes('WHERE organization_id = ? AND user_id = ?')) {
            result = { organization_id: 'manzur', user_id: 'gaston', role: 'admin',
              status: 'active', is_active: 1, student_id: null,
              approved_by: null, approved_at: null };
          } else if (sql.includes('SELECT id, is_main FROM branches')) {
            result = { id: 'manzur-main', is_main: 1 };
          }
          return result as T | null;
        },
        async all<T>(): Promise<D1Result<T>> {
          return { results: [], success: true, meta: RESULT_META };
        },
        async run(): Promise<D1Result> {
          return { success: true, meta: RESULT_META };
        },
      };
      return statement;
    },
    async batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      batches.push(statements.length);
      return statements.map(() => ({ success: true, meta: RESULT_META }));
    },
  };

  return {
    env: { DB: db, JWT_SECRET: 'branch-test-secret', AVATARS: {} as Env['AVATARS'], TURNSTILE_SECRET: '' },
    prepared,
    batches,
  };
}

describe('Manzur branch staff assignment', () => {
  it('permits an academy admin as an instructor without deleting protected admin staff', async () => {
    const { env, prepared, batches } = createFixture();
    const { accessToken } = await createTokens(
      'gaston', 'gaston@manzur.cl', 'admin', env.JWT_SECRET, 'manzur',
    );
    const request = new Request('https://hamarr.cl/api/branches', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Organization-ID': 'manzur',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'manzur-main',
        instructorIds: ['gaston', 'diego', 'diego'],
      }),
    });

    const response = await onRequestPut({ request, env });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(batches).toEqual([3]);

    const inserts = prepared.filter(({ sql }) => sql.includes('INSERT OR IGNORE INTO branch_staff'));
    expect(inserts).toHaveLength(2);
    for (const { sql, params } of inserts) {
      expect(sql).toContain("om.role IN ('admin', 'instructor')");
      expect(sql).toContain("om.status = 'active'");
      expect(sql).toContain('om.is_active = 1');
      expect(sql).toContain('u.is_active = 1');
      expect(params[0]).toBe('manzur-main');
      expect(params[3]).toBe('manzur');
    }
    expect(inserts.map(({ params }) => params[4])).toEqual(['gaston', 'diego']);

    const removal = prepared.find(({ sql }) => sql.includes('DELETE FROM branch_staff'));
    expect(removal?.sql).toContain("role = 'instructor'");
    expect(removal?.sql).not.toContain("role IN ('admin', 'instructor')");
    expect(removal?.params).toEqual(['manzur-main', 'manzur']);
  });
});

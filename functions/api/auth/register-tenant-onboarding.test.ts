import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from './register';
import type { D1BindValue, D1Database, D1PreparedStatement, D1Result, Env } from '../../types/index';

vi.mock('../../utils/hash', () => ({
  hashPassword: vi.fn(async () => 'new-student-hash'),
  verifyPassword: vi.fn(async () => true),
}));
vi.mock('../../utils/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, retryAfterMs: 0 })),
  rateLimitResponse: vi.fn(() => new Response(null, { status: 429 })),
}));

interface RecordedQuery { sql: string; values: D1BindValue[] }

function fixture(activeInstructors: string[] = []): { env: Env; queries: RecordedQuery[]; batches: RecordedQuery[][] } {
  const queries: RecordedQuery[] = [];
  const batches: RecordedQuery[][] = [];
  const db: D1Database = {
    prepare(sql): D1PreparedStatement {
      const query: RecordedQuery = { sql, values: [] };
      queries.push(query);
      const statement: D1PreparedStatement = {
        bind(...values: D1BindValue[]) {
          query.values = values;
          return statement;
        },
        async first<T>(): Promise<T | null> {
          if (sql.includes('FROM organizations WHERE id = ?')) {
            return { id: query.values[0], is_active: 1 } as T;
          }
          if (sql.includes('SELECT om.user_id AS id') && activeInstructors.includes(String(query.values[1]))) {
            return { id: query.values[1] } as T;
          }
          // A new Manzur student must not inherit HAMARR's instructor roster.
          return null;
        },
        async all<T>(): Promise<D1Result<T>> {
          return { success: true, results: [], meta: {} } as D1Result<T>;
        },
        async run(): Promise<D1Result> {
          return { success: true, results: [], meta: {} } as D1Result;
        },
      };
      return statement;
    },
    async batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      batches.push(queries.slice(-statements.length));
      return statements.map(() => ({ success: true, results: [], meta: {} } as D1Result<T>));
    },
  };
  return {
    env: { DB: db, JWT_SECRET: 'unit-test-only', TURNSTILE_SECRET: '', AVATARS: {} as Env['AVATARS'] },
    queries,
    batches,
  };
}

function registration(organizationId: string, instructorId?: string): Request {
  return new Request('https://hamarr.cl/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Organization-ID': organizationId,
      'X-Client-Platform': 'android',
    },
    body: JSON.stringify({
      email: 'newstudent@example.test',
      name: 'New Student',
      password: 'Str0ngPassword!',
      role: 'admin',
      ...(instructorId ? { instructorId } : {}),
    }),
  });
}

describe('organization-scoped student onboarding', () => {
  beforeEach(() => vi.clearAllMocks());

  it('accepts a Manzur student request while its instructor roster is empty', async () => {
    const { env, queries, batches } = fixture();
    const response = await onRequestPost({ request: registration('manzur'), env });
    expect(response.status).toBe(201);
    const data = await response.json() as { user: { role: string; organization_id: string }; pending_approval: boolean };
    expect(data.pending_approval).toBe(true);
    expect(data.user.role).toBe('student');
    expect(data.user.organization_id).toBe('manzur');
    expect(batches).toHaveLength(1);
    expect(queries.some(({ sql }) => sql.includes('SELECT om.user_id AS id'))).toBe(false);
    expect(batches[0].some(({ sql, values }) => sql.includes('INSERT INTO organization_memberships') && values[0] === 'manzur')).toBe(true);
  });

  it('preserves HAMARR instructor selection policy', async () => {
    const { env, batches } = fixture();
    const response = await onRequestPost({ request: registration('hamarr'), env });
    expect(response.status).toBe(400);
    expect(batches).toHaveLength(0);
  });

  it('persists Diego as the selected instructor on a tenant-local pending membership', async () => {
    const { env, batches } = fixture(['diego']);
    const response = await onRequestPost({ request: registration('manzur', 'diego'), env });
    expect(response.status).toBe(201);
    const membership = batches[0].find(({ sql }) => sql.includes('INSERT INTO organization_memberships'));
    expect(membership?.sql).toContain('requested_instructor_id');
    expect(membership?.values).toEqual(expect.arrayContaining(['manzur', 'diego']));
    expect(membership?.values[2]).toBe('diego');
  });

  it('stores NULL for Manzur enrollments without any selected instructor', async () => {
    const { env, batches } = fixture();
    const response = await onRequestPost({ request: registration('manzur'), env });
    expect(response.status).toBe(201);
    const membership = batches[0].find(({ sql }) => sql.includes('INSERT INTO organization_memberships'));
    expect(membership?.values[2]).toBeNull();
  });

  it('rejects an instructor who has no active membership in the requested academy', async () => {
    const { env, queries, batches } = fixture();
    const response = await onRequestPost({ request: registration('manzur', 'hamarr-instructor'), env });
    expect(response.status).toBe(400);
    const lookup = queries.find(({ sql }) => sql.includes('SELECT om.user_id AS id'));
    expect(lookup?.values).toEqual(['manzur', 'hamarr-instructor']);
    expect(batches).toHaveLength(0);
  });
});

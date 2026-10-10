import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  D1BindValue,
  D1Database,
  D1PreparedStatement,
  D1Result,
  Env,
} from '../../types/index';
import { onRequestGet as getProgressionById } from './[id]/progression';
import { onRequestGet as getReadyProgression } from './progression/ready';

vi.mock('../../middleware/auth', () => ({
  authenticateUser: vi.fn(async () => ({
    authenticated: true as const,
    user: {
      id: 'staff',
      email: 'staff@example.org',
      name: 'Staff',
      role: 'admin' as const,
      organization_id: 'hamarr',
      platform_admin: false,
    },
  })),
}));

vi.mock('../../utils/sparringSchema', () => ({
  ensureSparringSchema: vi.fn(async () => undefined),
}));

interface PreparedCall {
  sql: string;
  args: D1BindValue[];
}

function successfulResult<T>(results: T[]): D1Result<T> {
  return {
    success: true,
    results,
    meta: {
      changed_db: false,
      changes: 0,
      duration: 0,
      rows_read: results.length,
      rows_written: 0,
      size_after: 0,
    },
  };
}

function createEnv(options: { includeScopedStudent?: boolean } = {}): { env: Env; calls: PreparedCall[] } {
  const calls: PreparedCall[] = [];
  const { includeScopedStudent = false } = options;

  const db: D1Database = {
    prepare(sql): D1PreparedStatement {
      let args: D1BindValue[] = [];
      const statement: D1PreparedStatement = {
        bind(...values) {
          args = values;
          calls.push({ sql, args: [...values] });
          return statement;
        },
        async first<T>() {
          if (sql.includes('FROM branches WHERE id = ? AND organization_id = ?')) {
            return {
              id: 'main',
              is_active: 1,
              organization_id: 'hamarr',
            } as T;
          }

          if (sql.includes('FROM students WHERE id = ?')) {
            const correctlyScoped =
              sql.includes('branch_id = ?') &&
              sql.includes('organization_id = ?') &&
              args.includes('main') &&
              args.includes('hamarr');

            return (correctlyScoped
              ? null
              : {
                  id: 'manzur-student',
                  name: 'Cross Tenant Student',
                  belt: 'White',
                  discipline: 'Brazilian Jiu-Jitsu',
                  instructor_id: null,
                  organization_id: 'manzur',
                }) as T | null;
          }

          return null;
        },
        async all<T>(): Promise<D1Result<T>> {
          if (sql.includes('FROM students')) {
            const correctlyScoped =
              sql.includes('branch_id = ?') &&
              sql.includes('organization_id = ?') &&
              args.includes('main') &&
              args.includes('hamarr');

            if (!correctlyScoped) {
              return successfulResult([{
                id: 'manzur-student',
                name: 'Cross Tenant Student',
                belt: 'White',
                discipline: 'Brazilian Jiu-Jitsu',
                avatar_url: null,
                instructor_id: null,
              } as T]);
            }

            if (!includeScopedStudent) {
              return successfulResult([]);
            }

            return successfulResult([{
              id: 'hamarr-student',
              name: 'Scoped Student',
              belt: 'White',
              discipline: 'Brazilian Jiu-Jitsu',
              avatar_url: null,
              instructor_id: null,
            } as T]);
          }

          if (
            sql.includes('FROM attendance a') ||
            sql.includes('FROM sparring_sessions') ||
            sql.includes('FROM tournament_participations')
          ) {
            return successfulResult([{
              student_id: 'hamarr-student',
              value: 0,
            } as T]);
          }

          throw new Error(`Unexpected list query: ${sql}`);
        },
        async run(): Promise<D1Result> {
          throw new Error('Unexpected mutation');
        },
      };
      return statement;
    },
    async batch<T>(): Promise<D1Result<T>[]> {
      throw new Error('Unexpected batch');
    },
  };

  return {
    env: {
      DB: db,
      JWT_SECRET: 'unit-secret',
      AVATARS: {} as Env['AVATARS'],
      TURNSTILE_SECRET: '',
    },
    calls,
  };
}

describe('student progression tenant isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails closed when progression-by-id targets a student outside the active tenant and branch', async () => {
    const state = createEnv();
    const request = new Request('https://example.org/api/students/manzur-student/progression', {
      headers: {
        'X-Organization-ID': 'hamarr',
        'X-Branch-ID': 'main',
      },
    });

    const response = await getProgressionById({
      request,
      env: state.env,
      params: { id: 'manzur-student' },
    });

    expect(response.status).toBe(404);
    expect(state.calls.some(({ sql, args }) =>
      sql.includes('FROM students WHERE id = ?') &&
      sql.includes('branch_id = ?') &&
      sql.includes('organization_id = ?') &&
      args.includes('main') &&
      args.includes('hamarr'),
    )).toBe(true);
  });

  it('scopes the ready-for-progression roster to the active tenant and branch', async () => {
    const state = createEnv();
    const request = new Request('https://example.org/api/students/progression/ready', {
      headers: {
        'X-Organization-ID': 'hamarr',
        'X-Branch-ID': 'main',
      },
    });

    const response = await getReadyProgression({ request, env: state.env });
    const body = await response.json() as { students: unknown[] };

    expect(response.status).toBe(200);
    expect(body.students).toEqual([]);
    expect(state.calls.some(({ sql, args }) =>
      sql.includes('FROM students') &&
      sql.includes('branch_id = ?') &&
      sql.includes('organization_id = ?') &&
      args.includes('main') &&
      args.includes('hamarr'),
    )).toBe(true);
  });
  it('scopes every ready-for-progression aggregate query to the authenticated tenant', async () => {
    const state = createEnv({ includeScopedStudent: true });
    const request = new Request('https://example.org/api/students/progression/ready', {
      headers: {
        'X-Organization-ID': 'hamarr',
        'X-Branch-ID': 'main',
      },
    });

    const response = await getReadyProgression({ request, env: state.env });
    expect(response.status).toBe(200);

    const aggregateCalls = state.calls.filter(({ sql }) =>
      sql.includes('FROM attendance a') ||
      sql.includes('FROM sparring_sessions') ||
      sql.includes('FROM tournament_participations'),
    );

    expect(aggregateCalls).toHaveLength(3);
    for (const { sql, args } of aggregateCalls) {
      expect(args).toContain('hamarr-student');
      expect(args).toContain('hamarr');
      expect(sql).toContain('organization_id = ?');
    }
  });

});

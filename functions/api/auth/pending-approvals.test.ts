import { describe, expect, it, vi } from 'vitest';
import { createTokens } from '../../utils/jwt';
import { ensureStudentHasInitialPayment } from '../../utils/payment-provisioning';
import { onRequestGet, onRequestPost, onRequestDelete } from './pending-approvals';
import type { Env, D1Database, D1PreparedStatement, D1Result, D1BindValue } from '../../types/index';

vi.mock('../../utils/payment-provisioning', () => ({
  ensureStudentHasInitialPayment: vi.fn(async () => ({ created: false })),
}));

type Role = 'admin' | 'instructor' | 'student';
interface Pending {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: Role;
  student_id: string | null;
  requested_instructor_id: string | null;
  status: 'pending' | 'active' | 'rejected';
}
interface Query { sql: string; values: D1BindValue[] }
interface Setup {
  actorRole?: Role;
  actorId?: string;
  organizationId?: string;
  platformAdmin?: boolean;
  hasMembership?: boolean;
  zeroChangeOnApprove?: boolean;
  activeInstructors?: string[];
  pending?: Pending[];
  existingStudentId?: string | null;
}
function changeResult(changes = 0): D1Result {
  return { success: true, results: [], meta: {
    changed_db: changes > 0, changes, duration: 0,
    last_row_id: 0, rows_read: 0, rows_written: changes, size_after: 0,
  } };
}
const application = (id: string, organization_id = 'manzur', requested_instructor_id: string | null = 'diego'): Pending => ({
  id, organization_id, requested_instructor_id, name: id, email: id + '@example.org',
  role: 'student', student_id: null, status: 'pending',
});

function fixture(setup: Setup = {}): { env: Env; queries: Query[]; batches: Query[][]; rows: Pending[] } {
  const actorId = setup.actorId ?? 'diego';
  const actorRole = setup.actorRole ?? 'instructor';
  const tenant = setup.organizationId ?? 'manzur';
  const rows = setup.pending ?? [
    application('diego-request'),
    application('gaston-request', 'manzur', 'gaston'),
    application('unassigned-request', 'manzur', null),
    application('hamarr-request', 'hamarr', 'hamarr-coach'),
  ];
  const instructors = setup.activeInstructors ?? ['diego', 'gaston', 'hamarr-coach'];
  const queries: Query[] = [];
  const batches: Query[][] = [];
  const preparedQueries = new WeakMap<D1PreparedStatement, Query>();
  const eligible = (p: Pending): boolean => p.organization_id === tenant
    && p.status === 'pending'
    && (actorRole === 'admin' || (actorRole === 'instructor'
      && p.role === 'student' && p.requested_instructor_id === actorId));
  const db: D1Database = {
    prepare(sql): D1PreparedStatement {
      const q: Query = { sql, values: [] };
      queries.push(q);
      const statement: D1PreparedStatement = {
        bind(...values) { q.values = values; return statement; },
        async first<T>(): Promise<T | null> {
          let result: unknown = null;
          if (sql.includes('FROM users WHERE id = ?')) {
            result = { id: actorId, email: 'staff@example.org', name: 'Staff',
              is_active: 1, role: 'admin', student_id: null, avatar_url: null };
          } else if (sql.includes('FROM organizations WHERE id = ?')) {
            result = { id: q.values[0], is_active: 1 };
          } else if (sql.includes('FROM platform_admins')) {
            result = setup.platformAdmin ? { allowed: 1 } : null;
          } else if (sql.includes('FROM organization_memberships') && !sql.includes('JOIN users')) {
            if (setup.hasMembership !== false && q.values[0] === tenant && q.values[1] === actorId) {
              result = { organization_id: tenant, user_id: actorId, role: actorRole, status: 'active',
                is_active: 1, student_id: null, approved_by: null, approved_at: null };
            }
          } else if (sql.includes('SELECT 1 AS eligible')) {
            result = instructors.includes(String(q.values[1])) ? { eligible: 1 } : null;
          } else if (sql.includes('JOIN users') && sql.includes("om.status = 'pending'")) {
            const row = rows.find(p => p.id === q.values[1] && eligible(p));
            result = row ?? null;
          } else if (sql.includes('FROM branches')) {
            result = { id: 'main-branch' };
          } else if (sql.includes('FROM students WHERE id = ?')) {
            result = setup.existingStudentId === q.values[0] ? { id: q.values[0] } : null;
          } else if (sql.includes('FROM students WHERE email = ?')) {
            result = setup.existingStudentId ? { id: setup.existingStudentId } : null;
          }
          return result as T | null;
        },
        async all<T>(): Promise<D1Result<T>> {
          const result: unknown[] = rows.filter(eligible);
          return { ...changeResult(), results: result as T[] } as D1Result<T>;
        },
        async run(): Promise<D1Result> {
          if (sql.includes("SET status = 'rejected'")) {
            expect(sql).toContain('requested_instructor_id = ?');
            expect(q.values).toEqual(expect.arrayContaining([actorId, tenant]));
            const row = rows.find(p => p.id === q.values[2] && eligible(p));
            if (!row) return changeResult();
            row.status = 'rejected';
            return changeResult(1);
          }
          return changeResult(1);
        },
      };
      preparedQueries.set(statement, q);
      return statement;
    },
    async batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      const selected = statements.map(statement => {
        const query = preparedQueries.get(statement);
        if (!query) throw new Error('Unknown prepared statement');
        return query;
      });
      batches.push(selected);
      const transition = selected[0];
      expect(transition.sql).toContain("status = 'pending'");
      expect(transition.sql).toContain('requested_instructor_id = ?');
      // Simulate an approval race in which the precondition matched at read time but not write time.
      const requested = setup.zeroChangeOnApprove
        ? undefined : rows.find(p => p.id === transition.values[4] && eligible(p));
      if (requested) requested.status = 'active';
      // SQL-gated follow-up operations do not mutate when the approval marker is absent.
      return selected.map(() => changeResult(!requested ? 0 : 1) as D1Result<T>);
    },
  };
  return { env: { DB: db, JWT_SECRET: 'unit-secret', AVATARS: {} as Env['AVATARS'], TURNSTILE_SECRET: '' }, queries, batches, rows };
}

async function request(method: 'GET' | 'POST' | 'DELETE', target = 'diego-request', headerTenant = 'manzur', tokenTenant = headerTenant): Promise<Request> {
  // JWT global role must never confer tenant roles; actor membership decides.
  const { accessToken } = await createTokens('diego', 'staff@example.org', 'admin', 'unit-secret', tokenTenant);
  return new Request('https://example.org/api/auth/pending-approvals', {
    method,
    headers: { Authorization: 'Bearer ' + accessToken, 'X-Organization-ID': headerTenant, 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify({ user_id: target }),
  });
}

describe('tenant-local instructor enrollment approvals', () => {
  it('Diego sees only requests assigning Diego, including no NULL historical or Gaston requests', async () => {
    const state = fixture();
    const response = await onRequestGet({ request: await request('GET'), env: state.env });
    expect(response.status).toBe(200);
    expect((await response.json() as { pending_users: Pending[] }).pending_users.map(p => p.id)).toEqual(['diego-request']);
    const listing = state.queries.find(q => q.sql.includes('ORDER BY om.created_at DESC'));
    expect(listing?.sql).toContain('om.requested_instructor_id = ?');
    expect(listing?.values).toEqual(['manzur', 'instructor', 'diego']);
  });

  it('Gaston as academy admin sees all tenant requests including unassigned historical requests', async () => {
    const state = fixture({ actorRole: 'admin', actorId: 'diego' });
    const response = await onRequestGet({ request: await request('GET'), env: state.env });
    expect(response.status).toBe(200);
    expect((await response.json() as { pending_users: Pending[] }).pending_users.map(p => p.id))
      .toEqual(['diego-request', 'gaston-request', 'unassigned-request']);
  });

  it('an unrelated instructor cannot approve or reject someone else assigned student', async () => {
    const state = fixture();
    for (const method of ['POST', 'DELETE'] as const) {
      const response = method === 'POST'
        ? await onRequestPost({ request: await request(method, 'gaston-request'), env: state.env })
        : await onRequestDelete({ request: await request(method, 'gaston-request'), env: state.env });
      expect(response.status).toBe(404);
    }
    expect(state.batches).toHaveLength(0);
    expect(state.rows.find(p => p.id === 'gaston-request')?.status).toBe('pending');
  });

  it('historical NULL assignment remains admin-only for list, approve and reject', async () => {
    const instructor = fixture();
    for (const method of ['POST', 'DELETE'] as const) {
      const response = method === 'POST'
        ? await onRequestPost({ request: await request(method, 'unassigned-request'), env: instructor.env })
        : await onRequestDelete({ request: await request(method, 'unassigned-request'), env: instructor.env });
      expect(response.status).toBe(404);
    }
    const admin = fixture({ actorRole: 'admin' });
    const approved = await onRequestPost({ request: await request('POST', 'unassigned-request'), env: admin.env });
    expect(approved.status).toBe(200);
    expect(admin.batches[0].some(q => q.sql.includes('INSERT INTO students') && q.values[5] === null)).toBe(true);
  });

  it('student cannot list or mutate approvals despite forged JWT admin role', async () => {
    const state = fixture({ actorRole: 'student' });
    for (const method of ['GET', 'POST', 'DELETE'] as const) {
      const response = method === 'GET'
        ? await onRequestGet({ request: await request(method), env: state.env })
        : method === 'POST'
          ? await onRequestPost({ request: await request(method), env: state.env })
          : await onRequestDelete({ request: await request(method), env: state.env });
      expect(response.status).toBe(403);
    }
    expect(state.batches).toHaveLength(0);
  });

  it('does not allow a platform administrator without tenant staff membership', async () => {
    const state = fixture({ platformAdmin: true, hasMembership: false });
    const response = await onRequestGet({ request: await request('GET'), env: state.env });
    expect(response.status).toBe(403);
  });

  it('blocks cross-tenant access even for academy administrators and rejects mismatched token tenants', async () => {
    const state = fixture({ actorRole: 'admin' });
    const response = await onRequestPost({ request: await request('POST', 'hamarr-request'), env: state.env });
    expect(response.status).toBe(404);
    const otherTenant = await onRequestGet({
      request: await request('GET', 'diego-request', 'manzur', 'hamarr'), env: state.env,
    });
    expect(otherTenant.status).toBe(403);
  });

  it('Diego approves own applicant with requested instructor persisted on student, with SQL authorization', async () => {
    const state = fixture();
    const response = await onRequestPost({ request: await request('POST'), env: state.env });
    expect(response.status).toBe(200);
    const batch = state.batches[0];
    expect(batch[0].sql).toContain('requested_instructor_id = ?');
    const insert = batch.find(q => q.sql.includes('INSERT INTO students ('));
    expect(insert?.values[5]).toBe('diego');
    expect(batch.some(q => q.sql.includes('UPDATE organization_memberships') && q.sql.includes('SET student_id = ?'))).toBe(true);
    expect(state.rows[0].status).toBe('active');
  });

  it('academy admin approval retains Gaston selection instead of assigning acting admin', async () => {
    const state = fixture({ actorRole: 'admin' });
    const response = await onRequestPost({ request: await request('POST', 'gaston-request'), env: state.env });
    expect(response.status).toBe(200);
    const insert = state.batches[0].find(q => q.sql.includes('INSERT INTO students ('));
    expect(insert?.values[5]).toBe('gaston');
  });

  it('updating an existing student assigns only within the same academy', async () => {
    const state = fixture({ existingStudentId: 'student-existing' });
    const response = await onRequestPost({ request: await request('POST'), env: state.env });
    expect(response.status).toBe(200);
    const studentUpdate = state.batches[0].find(q => q.sql.includes('UPDATE students SET instructor_id'));
    expect(studentUpdate?.sql).toContain('organization_id = ?');
    expect(studentUpdate?.values.slice(0, 4)).toEqual(['diego', expect.any(String), 'student-existing', 'manzur']);
  });

  it('Diego can reject only his applicant; rejection uses a guarded SQL predicate', async () => {
    const state = fixture();
    const response = await onRequestDelete({ request: await request('DELETE'), env: state.env });
    expect(response.status).toBe(200);
    expect(state.rows[0].status).toBe('rejected');
    expect(state.rows[1].status).toBe('pending');
  });

  it('does not confirm a replay/racing approval when the SQL transition affects zero rows', async () => {
    vi.clearAllMocks();
    const state = fixture({ zeroChangeOnApprove: true });
    const response = await onRequestPost({ request: await request('POST'), env: state.env });
    expect(response.status).toBe(404);
    expect(state.rows[0].status).toBe('pending');
    expect(state.batches).toHaveLength(1);
    const batch = state.batches[0];
    expect(batch[0].sql).toContain("status = 'pending'");
    expect(batch.find(q => q.sql.includes('INSERT INTO students ('))?.sql)
      .toContain("approval.status = 'active'");
    expect(batch.find(q => q.sql.includes('INSERT INTO student_branch_assignments'))?.sql)
      .toContain("approval.status = 'active'");
    expect(ensureStudentHasInitialPayment).not.toHaveBeenCalled();
  });

  it('prevents approval when selected instructor is no longer active', async () => {
    const state = fixture({ activeInstructors: ['gaston'] });
    const response = await onRequestPost({ request: await request('POST'), env: state.env });
    expect(response.status).toBe(409);
    expect(state.batches).toHaveLength(0);
  });
});

/** Tenant-local membership approvals. Global user state is never mutated by academy staff. */
import type { Env, D1PreparedStatement } from '../../types/index';
import { authenticateUser, type AuthenticatedOrganizationUser } from '../../middleware/auth';
import { getOrganizationMembership, resolveMainBranchId } from '../../utils/organizations';
import { ensureStudentHasInitialPayment } from '../../utils/payment-provisioning';
import { logAuditAction, getClientIP } from '../../utils/db';

interface MembershipTarget {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'instructor' | 'student';
  student_id: string | null;
  requested_instructor_id: string | null;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function authorize(
  request: Request, env: Env,
): Promise<{ user: AuthenticatedOrganizationUser } | { error: Response }> {
  const auth = await authenticateUser(request, env);
  if (!auth.authenticated) {
    return { error: json({ error: auth.error, code: auth.code }, auth.status ?? 401) };
  }
  // Platform-wide privileges cannot substitute for academy staff membership.
  const membership = await getOrganizationMembership(env.DB, auth.user.id, auth.user.organization_id);
  if (!membership || membership.status !== 'active' || membership.is_active !== 1 ||
      !['admin', 'instructor'].includes(membership.role)) {
    return { error: json({ error: 'Access denied' }, 403) };
  }
  return { user: { ...auth.user, role: membership.role } };
}

async function findPending(
  env: Env, organizationId: string, userId: string, actorRole: string, actorId: string,
): Promise<MembershipTarget | null> {
  return env.DB.prepare(`
    SELECT u.id, u.name, u.email, om.role, om.student_id, om.requested_instructor_id
    FROM organization_memberships om
    JOIN users u ON u.id = om.user_id
    WHERE om.organization_id = ? AND om.user_id = ?
      AND om.status = 'pending' AND om.is_active = 1 AND u.is_active = 1
      AND (? = 'admin' OR (om.role = 'student' AND om.requested_instructor_id = ?))
  `).bind(organizationId, userId, actorRole, actorId).first<MembershipTarget>();
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    const result = await authorize(request, env);
    if ('error' in result) return result.error;
    const { user } = result;
    const pending = await env.DB.prepare(`
      SELECT u.id, u.email, u.name, om.role, om.requested_instructor_id, u.created_at, u.registration_notes
      FROM organization_memberships om JOIN users u ON u.id = om.user_id
      WHERE om.organization_id = ? AND om.status = 'pending'
        AND om.is_active = 1 AND u.is_active = 1
        AND (? = 'admin' OR (om.role = 'student' AND om.requested_instructor_id = ?))
      ORDER BY om.created_at DESC
    `).bind(user.organization_id, user.role, user.id).all<MembershipTarget>();
    return json({ pending_users: pending.results ?? [] });
  } catch (error: unknown) {
    console.error('Pending approvals failed:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    const result = await authorize(request, env);
    if ('error' in result) return result.error;
    const { user } = result;
    const body = await request.json() as { user_id?: string; userId?: string };
    const userId = body.user_id ?? body.userId;
    if (!userId || typeof userId !== 'string') return json({ error: 'User ID is required' }, 400);

    const pending = await findPending(env, user.organization_id, userId, user.role, user.id);
    if (!pending) return json({ error: 'Pending membership not found' }, 404);

    if (pending.requested_instructor_id) {
      // An instructor can become inactive between registration and approval.
      const assigned = await env.DB.prepare(`
        SELECT 1 AS eligible FROM organization_memberships staff
        JOIN users u ON u.id = staff.user_id
        WHERE staff.organization_id = ? AND staff.user_id = ?
          AND staff.role IN ('admin', 'instructor') AND staff.status = 'active'
          AND staff.is_active = 1 AND u.is_active = 1
      `).bind(user.organization_id, pending.requested_instructor_id).first<{ eligible: number }>();
      if (!assigned) return json({ error: 'Requested instructor is no longer active' }, 409);
    }

    const now = new Date().toISOString();
    const operations: D1PreparedStatement[] = [];
    let studentId = pending.student_id;
    let branchId: string | undefined;

    if (pending.role === 'student') {
      branchId = await resolveMainBranchId(env, user.organization_id);
      if (studentId) {
        const linked = await env.DB.prepare(`
          SELECT id FROM students WHERE id = ? AND organization_id = ? AND deleted_at IS NULL
        `).bind(studentId, user.organization_id).first<{ id: string }>();
        if (!linked) studentId = null;
      }
      if (!studentId) {
        const candidate = await env.DB.prepare(`
          SELECT id FROM students WHERE email = ? AND organization_id = ? AND deleted_at IS NULL
          LIMIT 1
        `).bind(pending.email, user.organization_id).first<{ id: string }>();
        studentId = candidate?.id ?? crypto.randomUUID();
        if (!candidate) {
          operations.push(env.DB.prepare(`
            INSERT INTO students (
              id, name, email, belt, discipline, join_date, is_active,
              created_by, instructor_id, created_at, updated_at, branch_id, organization_id
            )
            SELECT ?, ?, ?, 'White', 'Brazilian Jiu-Jitsu', ?, 1, ?, ?, ?, ?, ?, ?
            FROM organization_memberships approval
            WHERE approval.organization_id = ? AND approval.user_id = ?
              AND approval.status = 'active' AND approval.approved_by = ?
              AND approval.approved_at = ?
          `).bind(studentId, pending.name, pending.email, now, user.id,
            pending.requested_instructor_id, now, now, branchId, user.organization_id,
            user.organization_id, userId, user.id, now));
        }
      }
      if (pending.requested_instructor_id) {
        // Updating an already existing student is tenant-local; never write a different tenant's row.
        operations.push(env.DB.prepare(`
          UPDATE students SET instructor_id = ?, updated_at = ?
          WHERE id = ? AND organization_id = ? AND deleted_at IS NULL
            AND EXISTS (
              SELECT 1 FROM organization_memberships approval
              WHERE approval.organization_id = ? AND approval.user_id = ?
                AND approval.status = 'active' AND approval.approved_by = ?
                AND approval.approved_at = ?
            )
        `).bind(pending.requested_instructor_id, now, studentId, user.organization_id,
          user.organization_id, userId, user.id, now));
      }
      operations.push(env.DB.prepare(`
        INSERT INTO student_branch_assignments
          (id, student_id, branch_id, started_at, assigned_by, created_at)
        SELECT ?, ?, ?, ?, ?, ?
        WHERE NOT EXISTS (
          SELECT 1 FROM student_branch_assignments
          WHERE student_id = ? AND ended_at IS NULL
        ) AND EXISTS (
          SELECT 1 FROM organization_memberships approval
          WHERE approval.organization_id = ? AND approval.user_id = ?
            AND approval.status = 'active' AND approval.approved_by = ?
            AND approval.approved_at = ?
        ) AND EXISTS (
          SELECT 1 FROM students WHERE id = ? AND organization_id = ?
        )
      `).bind(crypto.randomUUID(), studentId, branchId, now, user.id, now, studentId,
        user.organization_id, userId, user.id, now, studentId, user.organization_id));
    }

    // First statement is an atomic transition with SQL-level ownership checks.
    // D1.batch runs in a transaction; all follow-up writes require its approval marker.
    operations.unshift(env.DB.prepare(`
      UPDATE organization_memberships
      SET status = 'active', student_id = NULL, approved_by = ?,
          approved_at = ?, updated_at = ?
      WHERE organization_id = ? AND user_id = ? AND status = 'pending' AND is_active = 1
        AND (? = 'admin' OR (role = 'student' AND requested_instructor_id = ?))
        AND EXISTS (
          SELECT 1 FROM organization_memberships actor
          WHERE actor.organization_id = ? AND actor.user_id = ?
            AND actor.role = ? AND actor.status = 'active' AND actor.is_active = 1
        )
        AND (requested_instructor_id IS NULL OR EXISTS (
          SELECT 1 FROM organization_memberships assigned
          JOIN users su ON su.id = assigned.user_id
          WHERE assigned.organization_id = organization_memberships.organization_id
            AND assigned.user_id = organization_memberships.requested_instructor_id
            AND assigned.role IN ('admin', 'instructor')
            AND assigned.status = 'active' AND assigned.is_active = 1 AND su.is_active = 1
        ))
    `).bind(user.id, now, now, user.organization_id, userId, user.role, user.id,
      user.organization_id, user.id, user.role));

    operations.push(env.DB.prepare(`
      UPDATE organization_memberships
      SET student_id = ?, updated_at = ?
      WHERE organization_id = ? AND user_id = ? AND status = 'active'
        AND approved_by = ? AND approved_at = ?
    `).bind(studentId, now, user.organization_id, userId, user.id, now));

    const results = await env.DB.batch(operations);
    if (results[0]?.meta?.changes !== 1) {
      return json({ error: 'Pending membership not found' }, 404);
    }
    if (studentId && branchId) {
      await ensureStudentHasInitialPayment(env.DB, {
        studentId, actorUserId: user.id, branchId, reason: 'approval',
      });
    }
    void logAuditAction(env.DB, {
      id: crypto.randomUUID(), user_id: user.id, action: 'approve',
      entity_type: 'organization_membership', entity_id: userId, ip_address: getClientIP(request),
      changes: JSON.stringify({ organization_id: user.organization_id }),
    }).catch(() => {});
    return json({ success: true, message: `Account for ${pending.name} has been approved` });
  } catch (error: unknown) {
    console.error('Approve membership failed:', error);
    return json({ error: 'Could not approve organization membership' }, 500);
  }
}

export async function onRequestDelete({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    const result = await authorize(request, env);
    if ('error' in result) return result.error;
    const { user } = result;
    const url = new URL(request.url);
    const body = url.searchParams.has('user_id')
      ? null : await request.json().catch(() => null) as { user_id?: string; userId?: string } | null;
    const userId = url.searchParams.get('user_id') ?? body?.user_id ?? body?.userId;
    if (!userId) return json({ error: 'User ID is required' }, 400);
    const target = await findPending(env, user.organization_id, userId, user.role, user.id);
    if (!target) return json({ error: 'Pending membership not found' }, 404);

    const rejected = await env.DB.prepare(`
      UPDATE organization_memberships
      SET status = 'rejected', is_active = 0, updated_at = ?
      WHERE organization_id = ? AND user_id = ? AND status = 'pending' AND is_active = 1
        AND (? = 'admin' OR (role = 'student' AND requested_instructor_id = ?))
        AND EXISTS (
          SELECT 1 FROM organization_memberships actor
          WHERE actor.organization_id = ? AND actor.user_id = ?
            AND actor.role = ? AND actor.status = 'active' AND actor.is_active = 1
        )
    `).bind(new Date().toISOString(), user.organization_id, userId, user.role, user.id,
      user.organization_id, user.id, user.role).run();
    if (rejected.meta?.changes !== 1) return json({ error: 'Pending membership not found' }, 404);
    void logAuditAction(env.DB, {
      id: crypto.randomUUID(), user_id: user.id, action: 'reject',
      entity_type: 'organization_membership', entity_id: userId, ip_address: getClientIP(request),
      changes: JSON.stringify({ organization_id: user.organization_id }),
    }).catch(() => {});
    return json({ success: true, message: `Account for ${target.name} has been rejected` });
  } catch (error: unknown) {
    console.error('Reject membership failed:', error);
    return json({ error: 'Could not reject organization membership' }, 500);
  }
}

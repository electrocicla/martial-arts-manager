import type { Env } from '../types/index';
import { resolveMainBranchId } from './organizations';

export const MAIN_BRANCH_ID = 'main';
export const BRANCH_HEADER = 'X-Branch-ID';

export type AuthenticatedUser = {
  id: string;
  role: string;
  student_id?: string;
  organization_id: string;
};

interface BranchRow {
  id: string;
  is_active: number;
  organization_id: string;
}

export class BranchAccessError extends Error {
  public readonly status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = 'BranchAccessError';
    this.status = status;
  }
}

export async function resolveRequestBranchId(
  request: Request,
  env: Env,
  user: AuthenticatedUser,
): Promise<string> {
  if (user.role === 'student') {
    if (!user.student_id) {
      throw new BranchAccessError('No student profile linked to this organization', 404);
    }

    const student = await env.DB.prepare(
      `SELECT s.branch_id
         FROM students s
         INNER JOIN branches b ON b.id = s.branch_id
        WHERE s.id = ?
          AND s.organization_id = ?
          AND b.organization_id = ?
          AND b.is_active = 1
          AND s.deleted_at IS NULL`,
    ).bind(user.student_id, user.organization_id, user.organization_id).first<{ branch_id: string }>();

    if (!student?.branch_id) {
      throw new BranchAccessError('Student branch not found in this organization', 404);
    }

    return student.branch_id;
  }

  const requestedBranchId =
    request.headers.get(BRANCH_HEADER)?.trim() ||
    await resolveMainBranchId(env, user.organization_id);

  const branch = await env.DB.prepare(
    'SELECT id, is_active, organization_id FROM branches WHERE id = ? AND organization_id = ?',
  ).bind(requestedBranchId, user.organization_id).first<BranchRow>();

  if (!branch || !branch.is_active) {
    throw new BranchAccessError('Branch not found or inactive in this organization', 404);
  }

  if (user.role === 'admin') {
    return branch.id;
  }

  const membership = await env.DB.prepare(
    `SELECT 1 AS allowed
       FROM branch_staff bs
       INNER JOIN organization_memberships om
         ON om.user_id = bs.user_id
        AND om.organization_id = ?
        AND om.status = 'active'
        AND om.is_active = 1
      WHERE bs.branch_id = ? AND bs.user_id = ?`,
  ).bind(user.organization_id, branch.id, user.id).first<{ allowed: number }>();

  if (!membership) {
    throw new BranchAccessError('You do not have access to this branch');
  }

  return branch.id;
}

export function branchErrorResponse(error: unknown): Response | null {
  if (!(error instanceof BranchAccessError)) return null;

  return new Response(JSON.stringify({ error: error.message }), {
    status: error.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

import type { Env } from '../types/index';

export const MAIN_BRANCH_ID = 'main';
export const BRANCH_HEADER = 'X-Branch-ID';

export type AuthenticatedUser = {
  id: string;
  role: string;
  student_id?: string;
};

interface BranchRow {
  id: string;
  is_active: number;
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
      throw new BranchAccessError('No student profile linked to this account', 404);
    }

    const student = await env.DB.prepare(
      'SELECT branch_id FROM students WHERE id = ? AND deleted_at IS NULL',
    ).bind(user.student_id).first<{ branch_id: string }>();

    if (!student?.branch_id) {
      throw new BranchAccessError('Student branch not found', 404);
    }

    return student.branch_id;
  }

  const requestedBranchId = request.headers.get(BRANCH_HEADER)?.trim() || MAIN_BRANCH_ID;
  const branch = await env.DB.prepare(
    'SELECT id, is_active FROM branches WHERE id = ?',
  ).bind(requestedBranchId).first<BranchRow>();

  if (!branch || !branch.is_active) {
    throw new BranchAccessError('Branch not found or inactive', 404);
  }

  if (user.role === 'admin') {
    return branch.id;
  }

  const membership = await env.DB.prepare(
    'SELECT 1 AS allowed FROM branch_staff WHERE branch_id = ? AND user_id = ?',
  ).bind(branch.id, user.id).first<{ allowed: number }>();

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

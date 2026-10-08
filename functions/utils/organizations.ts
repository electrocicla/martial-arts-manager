import type { D1Database, Env } from '../types/index';

export const DEFAULT_ORGANIZATION_ID = 'hamarr';
export const MANZUR_ORGANIZATION_ID = 'manzur';
export const ORGANIZATION_HEADER = 'X-Organization-ID';

export type OrganizationRole = 'admin' | 'instructor' | 'student';
export type OrganizationMembershipStatus = 'pending' | 'active' | 'rejected';

export interface OrganizationMembership {
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  status: OrganizationMembershipStatus;
  is_active: number;
  student_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

export interface OrganizationAccess {
  organizationId: string;
  role: OrganizationRole;
  studentId: string | null;
  platformAdmin: boolean;
}

interface OrganizationRow {
  id: string;
  is_active: number;
}

export class OrganizationAccessError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status = 403, code = 'ORGANIZATION_ACCESS_DENIED') {
    super(message);
    this.name = 'OrganizationAccessError';
    this.status = status;
    this.code = code;
  }
}

export function getRequestedOrganizationId(request: Request): string {
  const organizationId = request.headers.get(ORGANIZATION_HEADER)?.trim();
  if (request.headers.has(ORGANIZATION_HEADER) && !organizationId) {
    throw new OrganizationAccessError('Organization header cannot be empty', 400, 'ORGANIZATION_REQUIRED');
  }
  return organizationId || DEFAULT_ORGANIZATION_ID;
}

export async function requireActiveOrganization(
  env: Env,
  organizationId: string,
): Promise<void> {
  const organization = await env.DB.prepare(
    'SELECT id, is_active FROM organizations WHERE id = ?',
  ).bind(organizationId).first<OrganizationRow>();

  if (!organization || organization.is_active !== 1) {
    throw new OrganizationAccessError('Organization not found or inactive', 404, 'ORGANIZATION_NOT_FOUND');
  }
}

export async function getOrganizationMembership(
  db: D1Database,
  userId: string,
  organizationId: string,
): Promise<OrganizationMembership | null> {
  return db.prepare(
    `SELECT organization_id, user_id, role, status, is_active, student_id, approved_by, approved_at
       FROM organization_memberships
      WHERE organization_id = ? AND user_id = ?`,
  ).bind(organizationId, userId).first<OrganizationMembership>();
}

export async function isPlatformAdmin(db: D1Database, userId: string): Promise<boolean> {
  const row = await db.prepare(
    'SELECT 1 AS allowed FROM platform_admins WHERE user_id = ?',
  ).bind(userId).first<{ allowed: number }>();
  return row?.allowed === 1;
}

export async function resolveAuthenticatedOrganization(
  request: Request,
  env: Env,
  userId: string,
): Promise<OrganizationAccess> {
  const organizationId = getRequestedOrganizationId(request);
  await requireActiveOrganization(env, organizationId);

  const [membership, platformAdmin] = await Promise.all([
    getOrganizationMembership(env.DB, userId, organizationId),
    isPlatformAdmin(env.DB, userId),
  ]);

  if (platformAdmin && (!membership || membership.is_active !== 1 || membership.status !== 'active')) {
    return {
      organizationId,
      role: 'admin',
      studentId: null,
      platformAdmin: true,
    };
  }

  if (!membership || membership.is_active !== 1) {
    throw new OrganizationAccessError(
      'You do not belong to this organization',
      403,
      'ORGANIZATION_MEMBERSHIP_REQUIRED',
    );
  }

  if (membership.status === 'pending') {
    throw new OrganizationAccessError(
      'Your account is pending approval for this organization',
      403,
      'PENDING_APPROVAL',
    );
  }

  if (membership.status !== 'active') {
    throw new OrganizationAccessError(
      'Your organization membership is not active',
      403,
      'ORGANIZATION_MEMBERSHIP_INACTIVE',
    );
  }

  return {
    organizationId,
    role: membership.role,
    studentId: membership.student_id,
    platformAdmin,
  };
}

export async function resolveMainBranchId(
  env: Env,
  organizationId: string,
): Promise<string> {
  const branch = await env.DB.prepare(
    `SELECT id
       FROM branches
      WHERE organization_id = ? AND is_main = 1 AND is_active = 1
      LIMIT 1`,
  ).bind(organizationId).first<{ id: string }>();

  if (!branch?.id) {
    throw new OrganizationAccessError(
      'Organization main branch is unavailable',
      404,
      'ORGANIZATION_MAIN_BRANCH_NOT_FOUND',
    );
  }

  return branch.id;
}

export function organizationErrorResponse(error: unknown): Response | null {
  if (!(error instanceof OrganizationAccessError)) return null;

  return new Response(JSON.stringify({ error: error.message, code: error.code }), {
    status: error.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

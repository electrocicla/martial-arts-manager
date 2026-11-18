import type { Env } from '../types/index';
import { authenticateUser, getRefreshTokenFromCookies, isNativeAuthRequest } from '../middleware/auth';
import type { AuthenticatedOrganizationUser } from '../middleware/auth';
import { findSessionByRefreshToken, findUserById } from '../utils/db';
import { verifyJWT } from '../utils/jwt';
import { resolveAuthenticatedOrganization } from '../utils/organizations';
import { readNativeAvatarGrant } from '../utils/native-avatar-grants';

type AcademyId = 'hamarr' | 'manzur';

function trustedOrganization(request: Request, env: Env): AcademyId | null {
  const host = new URL(request.url).hostname.toLowerCase();
  // Native traffic may retain hamarr.cl as its API origin, but must authenticate
  // with a tenant-bound access token. Header alone never grants access.
  const id = isNativeAuthRequest(request)
    ? request.headers.get('X-Organization-ID')
    : env.SITE_ORGANIZATION_ID ?? (host === 'hamarr.cl' || host === 'www.hamarr.cl' ? 'hamarr' : null);
  return id === 'hamarr' || id === 'manzur' ? id : null;
}

function scopedRequest(request: Request, organizationId: AcademyId): Request {
  const headers = new Headers(request.headers);
  headers.set('X-Organization-ID', organizationId);
  return new Request(request, { headers });
}

async function authorizedUser(
  request: Request,
  env: Env,
  organizationId: AcademyId,
): Promise<AuthenticatedOrganizationUser | null> {
  const scoped = scopedRequest(request, organizationId);
  if (request.headers.get('Authorization')?.startsWith('Bearer ')) {
    const auth = await authenticateUser(scoped, env);
    return auth.authenticated ? auth.user : null;
  }

  // Browser <img> loads cannot inject Authorization headers. The HttpOnly,
  // same-origin refresh cookie is verified against DB and organization here.
  const refreshToken = getRefreshTokenFromCookies(request);
  if (!refreshToken) return null;
  const claims = await verifyJWT(refreshToken, env.JWT_SECRET);
  if (!claims || claims.token_use !== 'refresh' || claims.organization_id !== organizationId) return null;
  const [session, user] = await Promise.all([
    findSessionByRefreshToken(env.DB, refreshToken),
    findUserById(env.DB, claims.sub),
  ]);
  if (!session || session.user_id !== claims.sub || !user || user.is_active !== 1) return null;
  return resolveCurrentUser(scoped, env, user);
}

async function resolveCurrentUser(scoped: Request, env: Env, user: NonNullable<Awaited<ReturnType<typeof findUserById>>>): Promise<AuthenticatedOrganizationUser | null> {
  if (user.is_active !== 1) return null;
  try {
    const organization = await resolveAuthenticatedOrganization(scoped, env, user.id);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: organization.role,
      student_id: organization.studentId ?? undefined,
      organization_id: organization.organizationId,
      platform_admin: organization.platformAdmin,
    };
  } catch {
    return null;
  }
}

function avatarKey(request: Request): string | null {
  const key = new URL(request.url).searchParams.get('key');
  if (!key || !/^avatars\/[a-zA-Z0-9_-]+\//.test(key) || key.includes('..') || key.includes('\\')) return null;
  return key;
}

function storedAvatarKey(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith('avatars/')) return value;
  try {
    const url = new URL(value, 'https://academy.invalid');
    if (url.pathname === '/api/avatars') return url.searchParams.get('key');
  } catch {
    return null;
  }
  return null;
}

interface AvatarStudentRow {
  avatar_url: string | null;
  branch_id: string;
  instructor_id: string | null;
  created_by: string | null;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    const key = avatarKey(request);
    if (!key) return new Response('Not found', { status: 404 });
    const grant = await readNativeAvatarGrant(request, env, key);
    const organizationId = grant?.organization ?? trustedOrganization(request, env);
    if (!organizationId) return new Response('Forbidden', { status: 403 });
    const grantUser = grant ? await findUserById(env.DB, grant.sub) : null;
    const user = grant
      ? (grantUser ? await resolveCurrentUser(scopedRequest(request, organizationId), env, grantUser) : null)
      : await authorizedUser(request, env, organizationId);
    if (!user || user.organization_id !== organizationId) return new Response('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } });

    const object = await env.AVATARS.get(key);
    if (!object) return new Response('Not found', { status: 404 });
    const studentId = object.customMetadata?.studentId;
    if (!studentId) return new Response('Not found', { status: 404 });

    const student = await env.DB.prepare(
      `SELECT avatar_url, branch_id, instructor_id, created_by FROM students
         WHERE id = ? AND organization_id = ? AND deleted_at IS NULL LIMIT 1`,
    ).bind(studentId, organizationId).first<AvatarStudentRow>();
    if (!student || storedAvatarKey(student.avatar_url) !== key ||
      (object.customMetadata?.organizationId &&
        object.customMetadata.organizationId !== organizationId) ||
      (object.customMetadata?.branchId &&
        object.customMetadata.branchId !== student.branch_id)) {
      return new Response('Not found', { status: 404 });
    }

    const canRead = user.role === 'admin'
      || (user.role === 'student' && user.student_id === studentId)
      || (user.role === 'instructor' && (
        student.instructor_id === user.id || student.created_by === user.id || student.instructor_id === null
      ));
    if (!canRead) return new Response('Not found', { status: 404 });

    // Avatar URLs may be loaded by <img> without X-Branch-ID. Validate the
    // student's actual branch against the instructor's active staff assignment,
    // not a caller-selected header or the student's instructor_id alone.
    if (user.role === 'instructor') {
      const branchAccess = await env.DB.prepare(
        `SELECT 1 AS allowed
           FROM branch_staff bs
           JOIN branches b ON b.id = bs.branch_id
           JOIN organization_memberships om
             ON om.organization_id = b.organization_id AND om.user_id = bs.user_id
          WHERE bs.branch_id = ? AND bs.user_id = ?
            AND b.organization_id = ? AND b.is_active = 1
            AND om.status = 'active' AND om.is_active = 1
          LIMIT 1`,
      ).bind(student.branch_id, user.id, organizationId).first<{ allowed: number }>();
      if (branchAccess?.allowed !== 1) return new Response('Not found', { status: 404 });
    }

    return new Response(object.body ?? (await object.arrayBuffer()), {
      status: 200,
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': grant ? 'private, no-store' : 'private, max-age=120',
        'Referrer-Policy': 'no-referrer',
        'Vary': 'Cookie, Authorization, X-Organization-ID',
        'ETag': object.httpEtag,
      },
    });
  } catch (error: unknown) {
    console.error('[Avatar read] Could not serve authorized image', error);
    return new Response('Internal server error', { status: 500 });
  }
}

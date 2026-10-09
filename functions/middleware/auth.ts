/**
 * Authentication middleware for Cloudflare Workers
 */

import { verifyJWT } from '../utils/jwt';
import { findUserById } from '../utils/db';
import { normalizeAvatarUrl } from '../utils/avatar';
import {
  resolveAuthenticatedOrganization,
  OrganizationAccessError,
  type OrganizationRole,
} from '../utils/organizations';

import { Env } from '../types/index';

/**
 * Middleware to authenticate JWT tokens
 */
export interface AuthenticatedOrganizationUser {
  id: string;
  email: string;
  name: string;
  role: OrganizationRole;
  student_id?: string;
  avatar_url?: string;
  organization_id: string;
  platform_admin: boolean;
}

export type AuthenticationResult =
  | { authenticated: true; user: AuthenticatedOrganizationUser }
  | { authenticated: false; error: string; status?: number; code?: string };

export async function authenticateUser(
  request: Request,
  env: Env,
): Promise<AuthenticationResult> {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return { authenticated: false, error: 'Missing or invalid authorization header' };
    }

    const payload = await verifyJWT(authorization.slice(7), env.JWT_SECRET);
    if (!payload || payload.token_use !== 'access') {
      return { authenticated: false, error: 'Invalid or expired access token' };
    }

    const user = await findUserById(env.DB, payload.sub);
    if (!user || user.is_active !== 1) {
      return { authenticated: false, error: 'User not found or inactive' };
    }

    // Never derive tenant permissions or student linkage from global users or JWT roles.
    const organization = await resolveAuthenticatedOrganization(request, env, user.id);
    if (payload.organization_id !== organization.organizationId) {
      return {
        authenticated: false,
        error: 'Token belongs to another organization',
        status: 403,
        code: 'ORGANIZATION_TOKEN_MISMATCH',
      };
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: organization.role,
        student_id: organization.studentId ?? undefined,
        avatar_url: normalizeAvatarUrl(user.avatar_url),
        organization_id: organization.organizationId,
        platform_admin: organization.platformAdmin,
      },
    };
  } catch (error: unknown) {
    if (error instanceof OrganizationAccessError) {
      return {
        authenticated: false,
        error: error.message,
        status: error.status,
        code: error.code,
      };
    }
    console.error('[Backend Auth] Authentication error:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
}

/**
 * Middleware to check user roles
 */
export function requireRole(allowedRoles: string[]) {
  return (user: { role: string }): boolean => {
    return allowedRoles.includes(user.role);
  };
}

/**
 * Create authentication response for unauthorized access
 */
export function createUnauthorizedResponse(message = 'Unauthorized'): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer',
      },
    }
  );
}

/**
 * Create forbidden response for insufficient permissions
 */
export function createForbiddenResponse(message = 'Forbidden'): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Extract token from cookies (for refresh tokens)
 */
export function getRefreshTokenFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies.refreshToken || null;
}

/**
 * Detect explicit native mobile auth requests.
 * Browsers cannot set or suppress Fetch Metadata headers, so requiring them to
 * be absent prevents web code from opting into JSON refresh tokens while
 * allowing React Native HTTPS clients to use SecureStore.
 */
export function isNativeAuthRequest(request: Request): boolean {
  return (
    request.headers.get('X-Client-Platform') === 'native' &&
    !request.headers.get('Origin') &&
    !request.headers.get('Sec-Fetch-Site')
  );
}

/**
 * Extract refresh token from the native-only header transport.
 */
export function getRefreshTokenFromNativeHeader(request: Request): string | null {
  if (!isNativeAuthRequest(request)) return null;

  const refreshToken = request.headers.get('X-Refresh-Token');
  return refreshToken && refreshToken.trim().length > 0 ? refreshToken : null;
}

/**
 * Extract refresh token from cookie first, then native secure-store transport.
 */
export function getRefreshTokenFromRequest(request: Request): string | null {
  return getRefreshTokenFromCookies(request) ?? getRefreshTokenFromNativeHeader(request);
}

/**
 * Create secure cookie string for refresh token
 */
export function createRefreshTokenCookie(refreshToken: string, maxAge: number): string {
  const secure = true; // Always use secure in production
  const httpOnly = true;
  const sameSite = 'strict';
  
  return `refreshToken=${refreshToken}; Max-Age=${maxAge}; Path=/; ${secure ? 'Secure; ' : ''}${httpOnly ? 'HttpOnly; ' : ''}SameSite=${sameSite}`;
}

/**
 * Create cookie to clear refresh token
 */
export function createClearRefreshTokenCookie(): string {
  return 'refreshToken=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=strict';
}

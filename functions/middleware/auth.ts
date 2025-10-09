/**
 * Authentication middleware for Cloudflare Workers
 */

import { verifyJWT } from '../utils/jwt';
import { findUserById } from '../utils/db';

import { Env, User } from '../types/index';

interface AuthenticatedRequest extends Request {
  user?: Pick<User, 'id' | 'email' | 'name' | 'role'>;
}

/**
 * Middleware to authenticate JWT tokens
 */
export async function authenticateUser(
  request: Request,
  env: Env
): Promise<{ authenticated: true; user: { id: string; email: string; name: string; role: string } } | { authenticated: false; error: string }> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (!payload) {
      return { authenticated: false, error: 'Invalid or expired token' };
    }

    // Check if user still exists and is active
    const user = await findUserById(env.DB, payload.sub);
    if (!user || !user.is_active) {
      return { authenticated: false, error: 'User not found or inactive' };
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch (error) {
    console.error('Authentication error:', error);
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
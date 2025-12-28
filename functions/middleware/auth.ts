/**
 * Authentication middleware for Cloudflare Workers
 */

import { verifyJWT } from '../utils/jwt';
import { findUserById } from '../utils/db';

import { Env } from '../types/index';

/**
 * Middleware to authenticate JWT tokens
 */
export async function authenticateUser(
  request: Request,
  env: Env
): Promise<{ authenticated: true; user: { id: string; email: string; name: string; role: string; student_id?: string; avatar_url?: string } } | { authenticated: false; error: string }> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('[Backend Auth] Authorization header:', authHeader ? `Bearer ${authHeader.substring(7, 27)}...` : 'MISSING');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Backend Auth] Missing or invalid authorization header');
      return { authenticated: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('[Backend Auth] Token extracted, length:', token.length);
    
    // Verify JWT token
    console.log('[Backend Auth] Verifying JWT...');
    const payload = await verifyJWT(token, env.JWT_SECRET);
    console.log('[Backend Auth] JWT verification result:', payload ? 'VALID' : 'INVALID');
    
    if (!payload) {
      console.error('[Backend Auth] Invalid or expired token');
      return { authenticated: false, error: 'Invalid or expired token' };
    }

    console.log('[Backend Auth] Token payload sub (user ID):', payload.sub);

    // Check if user still exists and is active
    const user = await findUserById(env.DB, payload.sub);
    console.log('[Backend Auth] User found in DB:', user ? 'YES' : 'NO');
    console.log('[Backend Auth] User active:', user?.is_active ? 'YES' : 'NO');
    
    if (!user || !user.is_active) {
      console.error('[Backend Auth] User not found or inactive');
      return { authenticated: false, error: 'User not found or inactive' };
    }

    // Auto-link student profile if user is a student without student_id
    let studentId = user.student_id ?? undefined;
    if (user.role === 'student' && !studentId) {
      const studentMatch = await env.DB.prepare(
        'SELECT id FROM students WHERE email = ? AND deleted_at IS NULL'
      )
        .bind(user.email)
        .first<{ id: string }>();

      if (studentMatch?.id) {
        studentId = studentMatch.id;
        const now = new Date().toISOString();
        await env.DB.prepare('UPDATE users SET student_id = ?, updated_at = ? WHERE id = ?')
          .bind(studentId, now, user.id)
          .run();
      }
    }

    console.log('[Backend Auth] Authentication successful for user:', user.email);
    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        student_id: studentId,
        avatar_url: user.avatar_url,
      },
    };
  } catch (error) {
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
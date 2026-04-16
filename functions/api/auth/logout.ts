/**
 * Logout endpoint - invalidate refresh token and clear cookies
 */

import { deleteSession, logAuditAction, getClientIP } from '../../utils/db';
import { getRefreshTokenFromCookies, createClearRefreshTokenCookie } from '../../middleware/auth';

// Cloudflare Workers D1 types
import { Env } from '../../types/index';

/**
 * POST /api/auth/logout
 */
export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    // Get refresh token from cookies
    const refreshToken = getRefreshTokenFromCookies(request);
    
    if (refreshToken) {
      // Get user_id from session before deleting
      const session = await env.DB
        .prepare('SELECT user_id FROM sessions WHERE refresh_token = ?')
        .bind(refreshToken)
        .first<{ user_id: string }>();

      // Delete session from database
      await deleteSession(env.DB, refreshToken);

      // Non-blocking audit log
      if (session?.user_id) {
        logAuditAction(env.DB, {
          id: crypto.randomUUID(),
          user_id: session.user_id,
          action: 'logout',
          entity_type: 'session',
          entity_id: session.user_id,
          ip_address: getClientIP(request),
        }).catch(err => console.error('Audit log error:', err));
      }
    }

    // Create response that clears the refresh token cookie
    const response = new Response(
      JSON.stringify({ success: true, message: 'Logged out successfully' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Clear refresh token cookie
    response.headers.set('Set-Cookie', createClearRefreshTokenCookie());

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, we should still clear the cookie
    const response = new Response(
      JSON.stringify({ success: true, message: 'Logged out successfully' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    response.headers.set('Set-Cookie', createClearRefreshTokenCookie());
    return response;
  }
}
/**
 * Logout endpoint - invalidate refresh token and clear cookies
 */

import { deleteSession } from '../../utils/db';
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
      // Delete session from database
      await deleteSession(env.DB, refreshToken);

      // TODO: Log audit action (would need user ID from token)
      // For now, we'll skip audit logging since we'd need to decode the token
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
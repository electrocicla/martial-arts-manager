/**
 * Refresh token endpoint - get new access token using refresh token
 */

import { verifyJWT, createTokens } from '../../utils/jwt';
import { findSessionByRefreshToken, findUserById, updateUserLastLogin, createSession, deleteSession } from '../../utils/db';
import { getRefreshTokenFromCookies, createRefreshTokenCookie, createClearRefreshTokenCookie } from '../../middleware/auth';
import { generateUserId } from '../../utils/hash';

import { Env } from '../../types/index';

interface RefreshResponse {
  success: true;
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * POST /api/auth/refresh
 */
export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    // Get refresh token from cookies
    const refreshToken = getRefreshTokenFromCookies(request);
    
    if (!refreshToken) {
      const response = new Response(
        JSON.stringify({ error: 'Refresh token not found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
      // Clear invalid cookie
      response.headers.append('Set-Cookie', createClearRefreshTokenCookie());
      return response;
    }

    // Verify refresh token
    const payload = await verifyJWT(refreshToken, env.JWT_SECRET);
    if (!payload) {
      const response = new Response(
        JSON.stringify({ error: 'Invalid or expired refresh token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
      // Clear invalid cookie
      response.headers.append('Set-Cookie', createClearRefreshTokenCookie());
      return response;
    }

    // Find session in database
    const session = await findSessionByRefreshToken(env.DB, refreshToken);
    if (!session) {
      const response = new Response(
        JSON.stringify({ error: 'Session not found or expired' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
      // Clear invalid cookie
      response.headers.append('Set-Cookie', createClearRefreshTokenCookie());
      return response;
    }

    // Find user
    const user = await findUserById(env.DB, session.user_id);
    if (!user || !user.is_active) {
      const response = new Response(
        JSON.stringify({ error: 'User not found or inactive' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
      // Clear invalid cookie and delete session
      await deleteSession(env.DB, refreshToken);
      response.headers.append('Set-Cookie', createClearRefreshTokenCookie());
      return response;
    }

    // Create new tokens
    const { accessToken, refreshToken: newRefreshToken } = await createTokens(
      user.id,
      user.email,
      user.role,
      env.JWT_SECRET
    );

    // Delete old session
    await deleteSession(env.DB, refreshToken);

    // Create new session
    const sessionId = generateUserId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await createSession(env.DB, {
      id: sessionId,
      user_id: user.id,
      refresh_token: newRefreshToken,
      expires_at: expiresAt,
      ip_address: session.ip_address,
      user_agent: session.user_agent,
    });

    // Update user's last login
    await updateUserLastLogin(env.DB, user.id);

    // Prepare response
    const responseData: RefreshResponse = {
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };

    // Create response with new refresh token cookie
    const response = new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Set new refresh token as HTTP-only cookie
    const cookieMaxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    response.headers.set('Set-Cookie', createRefreshTokenCookie(newRefreshToken, cookieMaxAge));

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
/**
 * Refresh token endpoint - get new access token using refresh token
 */

import { verifyJWT, createTokens } from '../../utils/jwt';
import { findSessionByRefreshToken, findUserById, updateUserLastLogin, createSession, deleteSession } from '../../utils/db';
import { getRefreshTokenFromRequest, createRefreshTokenCookie, createClearRefreshTokenCookie, isNativeAuthRequest } from '../../middleware/auth';

import { normalizeAvatarUrl } from '../../utils/avatar';

import { Env } from '../../types/index';
import { resolveAuthenticatedOrganization, organizationErrorResponse, getRequestedOrganizationId } from '../../utils/organizations';

interface RefreshResponse {
  success: true;
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    student_id?: string;
    avatar_url?: string;
    organization_id: string;
    platform_admin: boolean;
  };
  refreshToken?: string;
}

/**
 * POST /api/auth/refresh
 */
export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    // Get refresh token from HttpOnly cookie first, then native secure-store header.
    const refreshToken = getRefreshTokenFromRequest(request);
    
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
    if (!payload || payload.token_use !== 'refresh') {
      const response = new Response(
        JSON.stringify({ error: 'Invalid or expired refresh token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
      // Clear invalid cookie
      response.headers.append('Set-Cookie', createClearRefreshTokenCookie());
      return response;
    }

    // A refresh token is bound to its original tenant even when the user has
    // memberships in multiple organizations. Never switch tenants on refresh.
    if (payload.organization_id !== getRequestedOrganizationId(request)) {
      return new Response(
        JSON.stringify({ error: 'Refresh token belongs to another organization', code: 'ORGANIZATION_TOKEN_MISMATCH' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Find session in database
    const session = await findSessionByRefreshToken(env.DB, refreshToken);
    if (!session || session.user_id !== payload.sub) {
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

    const organization = await resolveAuthenticatedOrganization(request, env, user.id);
    if (payload.organization_id !== organization.organizationId) {
      return new Response(JSON.stringify({ error: 'Refresh token belongs to another organization', code: 'ORGANIZATION_TOKEN_MISMATCH' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Create new tokens
    const { accessToken, refreshToken: newRefreshToken } = await createTokens(
      user.id,
      user.email,
      organization.role,
      env.JWT_SECRET,
      organization.organizationId
    );

    // Delete old session
    await deleteSession(env.DB, refreshToken);

    // Create new session
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

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
        role: organization.role,
        student_id: organization.studentId ?? undefined,
        organization_id: organization.organizationId,
        platform_admin: organization.platformAdmin,
        avatar_url: normalizeAvatarUrl(user.avatar_url),
      },
    };

    if (isNativeAuthRequest(request)) {
      responseData.refreshToken = newRefreshToken;
    }

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
    const cookieMaxAge = 30 * 24 * 60 * 60; // 30 days in seconds
    response.headers.set('Set-Cookie', createRefreshTokenCookie(newRefreshToken, cookieMaxAge));

    return response;

  } catch (error: unknown) {
    const organizationError = organizationErrorResponse(error);
    if (organizationError) return organizationError;
    console.error('Token refresh error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

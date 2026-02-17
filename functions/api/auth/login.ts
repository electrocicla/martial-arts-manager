/**
 * Login endpoint - authenticate user and return tokens
 */

import { verifyPassword, generateUserId } from '../../utils/hash';
import { createTokens } from '../../utils/jwt';
import { findUserByEmail, createSession, updateUserLastLogin, logAuditAction, getClientIP, getUserAgent } from '../../utils/db';
import { createRefreshTokenCookie } from '../../middleware/auth';
import { normalizeAvatarUrl } from '../../utils/avatar';

import { Env } from '../../types/index';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: true;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    student_id?: string;
    avatar_url?: string;
  };
  accessToken: string;
}

/**
 * POST /api/auth/login
 */
export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    // Parse request body
    const body = await request.json() as LoginRequest;
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find user by email
    const user = await findUserByEmail(env.DB, email.toLowerCase());
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return new Response(
        JSON.stringify({ error: 'Account is deactivated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user account is approved
    if (!user.is_approved) {
      return new Response(
        JSON.stringify({ 
          error: 'Your account is pending approval by an administrator',
          code: 'PENDING_APPROVAL'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Auto-link student_id if missing (legacy users)
    let studentId = user.student_id;
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

    // Create JWT tokens
    const { accessToken, refreshToken } = await createTokens(
      user.id,
      user.email,
      user.role,
      env.JWT_SECRET
    );

    // Create session record
    const sessionId = generateUserId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await createSession(env.DB, {
      id: sessionId,
      user_id: user.id,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      ip_address: getClientIP(request),
      user_agent: getUserAgent(request),
    });

    // Update user's last login
    await updateUserLastLogin(env.DB, user.id);

    // Log audit action
    await logAuditAction(env.DB, {
      id: generateUserId(),
      user_id: user.id,
      action: 'LOGIN',
      entity_type: 'USER',
      entity_id: user.id,
      ip_address: getClientIP(request),
    });

    // Prepare response
    const responseData: LoginResponse = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        student_id: studentId || undefined,
        avatar_url: normalizeAvatarUrl(user.avatar_url),
      },
      accessToken,
    };

    // Create response with refresh token cookie
    const response = new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Set refresh token as HTTP-only cookie
    const cookieMaxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    response.headers.set('Set-Cookie', createRefreshTokenCookie(refreshToken, cookieMaxAge));

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
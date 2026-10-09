/**
 * Register endpoint - create new user account
 */

import { hashPassword, verifyPassword } from '../../utils/hash';
import { findUserByEmail } from '../../utils/db';
import { isNativeAuthRequest } from '../../middleware/auth';
import { checkRateLimit, rateLimitResponse } from '../../utils/rate-limit';
import { isTurnstileConfigured, verifyTurnstileToken } from '../../utils/turnstile';

import { Env } from '../../types/index';
import { getRequestedOrganizationId, requireActiveOrganization, getOrganizationMembership, organizationErrorResponse } from '../../utils/organizations';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'instructor' | 'student';
  instructorId?: string;
  turnstileToken?: string;
}

/**
 * POST /api/auth/register
 */
export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    // Rate limit: 5 registrations per minute per IP
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const { allowed, retryAfterMs } = checkRateLimit(`register:${ip}`, 5, 60_000);
    if (!allowed) return rateLimitResponse(retryAfterMs);

    // Parse request body
    const body = await request.json() as RegisterRequest;
    // Force role to 'student' for public registration to prevent privilege escalation
    // even if the request contains another role
    const { email, password, name, instructorId, turnstileToken } = body;
    const role = 'student';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    // Verify Turnstile challenge (skip for native app requests)
    if (!isNativeAuthRequest(request) && isTurnstileConfigured(env.TURNSTILE_SECRET)) {
      const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || undefined;
      const valid = turnstileToken
        ? await verifyTurnstileToken(turnstileToken, env.TURNSTILE_SECRET, ip)
        : false;
      if (!valid) {
        return new Response(
          JSON.stringify({ error: 'CAPTCHA verification failed. Please try again.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate input
    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and name are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate instructor for students
    if (role === 'student' && !instructorId) {
      return new Response(
        JSON.stringify({ error: 'Please select an instructor' }),
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

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate name
    if (name.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Name must be at least 2 characters long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    const validRoles = ['admin', 'instructor', 'student'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be admin, instructor, or student' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const organizationId = getRequestedOrganizationId(request);
    await requireActiveOrganization(env, organizationId);

    const instructor = await env.DB.prepare(`
      SELECT om.user_id AS id FROM organization_memberships om
      JOIN users u ON u.id = om.user_id
      WHERE om.organization_id = ? AND om.user_id = ?
        AND om.role IN ('admin', 'instructor') AND om.status = 'active'
        AND om.is_active = 1 AND u.is_active = 1
    `).bind(organizationId, instructorId).first<{ id: string }>();
    if (!instructor) {
      return new Response(JSON.stringify({ error: 'Selected instructor is invalid or unavailable' }), { status: 400 });
    }

    const existingUser = await findUserByEmail(env.DB, normalizedEmail);
    if (existingUser && !(await verifyPassword(password, existingUser.password_hash))) {
      return new Response(JSON.stringify({ error: 'Invalid registration credentials' }), { status: 401 });
    }
    const userId = existingUser?.id ?? crypto.randomUUID();
    if (existingUser && await getOrganizationMembership(env.DB, userId, organizationId)) {
      return new Response(JSON.stringify({ error: 'Membership request already exists' }), { status: 409 });
    }

    const now = new Date().toISOString();
    const membershipInsert = env.DB.prepare(`
      INSERT INTO organization_memberships
      (organization_id, user_id, role, status, is_active, student_id, created_at, updated_at)
      VALUES (?, ?, 'student', 'pending', 1, NULL, ?, ?)
    `).bind(organizationId, userId, now, now);

    if (existingUser) {
      await membershipInsert.run();
    } else {
      const passwordHash = await hashPassword(password);
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO users
          (id, email, password_hash, name, role, student_id, is_active, is_approved, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'student', NULL, 1, 0, ?, ?)`)
          .bind(userId, normalizedEmail, passwordHash, name.trim(), now, now),
        membershipInsert,
      ]);
    }
    return new Response(JSON.stringify({
      success: true,
      pending_approval: true,
      message: 'Your account request has been submitted and is pending approval',
      user: {
        id: userId,
        email: normalizedEmail,
        name: existingUser?.name ?? name.trim(),
        role: 'student',
        organization_id: organizationId,
      },
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    const organizationError = organizationErrorResponse(error);
    if (organizationError) return organizationError;
    console.error('Registration error:', error);
    
    // Handle specific database errors
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return new Response(
        JSON.stringify({ error: 'An account with this email already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

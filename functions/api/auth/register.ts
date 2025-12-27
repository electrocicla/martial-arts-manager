/**
 * Register endpoint - create new user account
 */

import { hashPassword, generateUserId } from '../../utils/hash';
import { createTokens } from '../../utils/jwt';
import { createUser, emailExists, createSession, logAuditAction, getClientIP, getUserAgent } from '../../utils/db';
import { createRefreshTokenCookie } from '../../middleware/auth';

import { Env } from '../../types/index';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'instructor' | 'student';
  instructorId?: string;
}

interface RegisterResponse {
  success: true;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    studentId?: string;
  };
  accessToken: string;
}

/**
 * POST /api/auth/register
 */
export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    // Parse request body
    const body = await request.json() as RegisterRequest;
    const { email, password, name, role = 'student', instructorId } = body;

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

    // Check if email already exists in users
    const emailAlreadyExists = await emailExists(env.DB, email.toLowerCase());
    if (emailAlreadyExists) {
      return new Response(
        JSON.stringify({ error: 'An account with this email already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists in students (if registering as student)
    if (role === 'student') {
      const studentExists = await env.DB.prepare('SELECT id FROM students WHERE email = ?')
        .bind(email.toLowerCase())
        .first();
      
      if (studentExists) {
        return new Response(
          JSON.stringify({ error: 'A student profile with this email already exists. Please ask your instructor to invite you.' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = generateUserId();
    const user = await createUser(env.DB, {
      id: userId,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name: name.trim(),
      role,
    });

    let studentId: string | undefined;

    // If registering as a student, create student record and link to instructor
    if (role === 'student' && instructorId) {
      studentId = generateUserId();
      const now = new Date().toISOString();
      
      // Create student record
      await env.DB.prepare(`
        INSERT INTO students (
          id, name, email, belt, discipline, join_date, 
          is_active, created_by, instructor_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
      `).bind(
        studentId, 
        name.trim(), 
        email.toLowerCase(), 
        'White', 
        'Brazilian Jiu-Jitsu', 
        now,
        userId, // Created by themselves
        instructorId, 
        now, 
        now
      ).run();

      // Link student to user
      await env.DB.prepare('UPDATE users SET student_id = ? WHERE id = ?')
        .bind(studentId, userId)
        .run();
      
      // Update local user object for response (if needed, though user object here is likely just the DB result)
      // We'll include it in the response below
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

    // Log audit action
    await logAuditAction(env.DB, {
      id: generateUserId(),
      user_id: user.id,
      action: 'REGISTER',
      entity_type: 'USER',
      entity_id: user.id,
      ip_address: getClientIP(request),
    });

    // Prepare response
    const responseData: RegisterResponse = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: studentId
      },
      accessToken,
    };

    // Create response with refresh token cookie
    const response = new Response(
      JSON.stringify(responseData),
      {
        status: 201,
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
    console.error('Registration error:', error);
    
    // Handle specific database errors
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return new Response(
        JSON.stringify({ error: 'An account with this email already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
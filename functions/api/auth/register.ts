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
  pending_approval?: boolean;
  message?: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    student_id?: string;
  };
  accessToken?: string;
}

/**
 * POST /api/auth/register
 */
export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    // Parse request body
    const body = await request.json() as RegisterRequest;
    // Force role to 'student' for public registration to prevent privilege escalation
    // even if the request contains another role
    const { email, password, name, instructorId } = body;
    const role = 'student';
    const normalizedEmail = email?.toLowerCase();

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
    const emailAlreadyExists = await emailExists(env.DB, normalizedEmail);
    if (emailAlreadyExists) {
      return new Response(
        JSON.stringify({ error: 'An account with this email already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate selected instructor exists and can receive students
    if (role === 'student' && instructorId) {
      const instructor = await env.DB.prepare(
        "SELECT id FROM users WHERE id = ? AND role IN ('instructor', 'admin') AND is_active = 1 AND is_approved = 1"
      )
        .bind(instructorId)
        .first<{ id: string }>();

      if (!instructor?.id) {
        return new Response(
          JSON.stringify({ error: 'Selected instructor is invalid or unavailable' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // If registering as student, attempt to claim an existing student profile by email
    let studentId: string | undefined;
    if (role === 'student') {
      const existingStudent = await env.DB.prepare(
        'SELECT id FROM students WHERE email = ? AND deleted_at IS NULL'
      )
        .bind(normalizedEmail)
        .first<{ id: string }>();

      if (existingStudent?.id) {
        studentId = existingStudent.id;
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = generateUserId();
    const user = await createUser(env.DB, {
      id: userId,
      email: normalizedEmail,
      password_hash: passwordHash,
      name: name.trim(),
      role,
      student_id: studentId,
    });

    // If registering as a student, either link existing student or create a new student record
    if (role === 'student' && instructorId) {
      try {
        const now = new Date().toISOString();

        if (!studentId) {
          const existingStudentByEmail = await env.DB.prepare(
            `SELECT id, deleted_at FROM students
             WHERE email = ?
             ORDER BY CASE WHEN deleted_at IS NULL THEN 0 ELSE 1 END, created_at DESC
             LIMIT 1`
          )
            .bind(normalizedEmail)
            .first<{ id: string; deleted_at?: string | null }>();

          if (existingStudentByEmail?.id) {
            studentId = existingStudentByEmail.id;

            if (existingStudentByEmail.deleted_at) {
              await env.DB.prepare(
                `UPDATE students
                 SET name = ?, is_active = 1, deleted_at = NULL, instructor_id = ?, updated_at = ?, updated_by = ?
                 WHERE id = ?`
              )
                .bind(name.trim(), instructorId, now, instructorId, studentId)
                .run();
            } else {
              await env.DB.prepare(
                "UPDATE students SET instructor_id = ?, updated_at = ? WHERE id = ? AND (instructor_id IS NULL OR instructor_id = '')"
              )
                .bind(instructorId, now, studentId)
                .run();
            }
          } else {
            studentId = generateUserId();

            await env.DB.prepare(`
              INSERT INTO students (
                id, name, email, belt, discipline, join_date,
                is_active, created_by, instructor_id, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
            `)
              .bind(
                studentId,
                name.trim(),
                normalizedEmail,
                'White',
                'Brazilian Jiu-Jitsu',
                now,
                instructorId,
                instructorId,
                now,
                now
              )
              .run();
          }

          await env.DB.prepare('UPDATE users SET student_id = ?, updated_at = ? WHERE id = ?')
            .bind(studentId, now, userId)
            .run();
        } else {
          // Best-effort: attach instructor_id if missing
          await env.DB.prepare(
            "UPDATE students SET instructor_id = ?, updated_at = ? WHERE id = ? AND (instructor_id IS NULL OR instructor_id = '')"
          )
            .bind(instructorId, now, studentId)
            .run();
        }
      } catch (studentProvisionError) {
        // Roll back created auth user when student provisioning fails to avoid orphan pending accounts
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run().catch((cleanupError: unknown) => {
          console.error('Failed to rollback user after student provisioning error:', cleanupError);
        });
        throw studentProvisionError;
      }
    }

    // Students must wait for admin/instructor approval before they can authenticate
    if (user.role === 'student' && !user.is_approved) {
      const pendingResponse: RegisterResponse = {
        success: true,
        pending_approval: true,
        message: 'Your account request has been submitted and is pending approval',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          student_id: studentId,
        },
      };

      return new Response(JSON.stringify(pendingResponse), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      });
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
        student_id: studentId,
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
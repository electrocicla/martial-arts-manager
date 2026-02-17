/**
 * Account Approval API Endpoints
 * 
 * GET /api/auth/pending-approvals - List pending account approvals (admin/instructor)
 * POST /api/auth/pending-approvals - Approve a user account
 * DELETE /api/auth/pending-approvals?user_id=xxx - Reject a user account
 */

import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';
import { generateUserId } from '../../utils/hash';

interface PendingUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  registration_notes: string | null;
}

// GET - List pending approvals
export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only admins and instructors can view pending approvals
    if (auth.user.role === 'student') {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all pending approval accounts
    const { results } = await env.DB.prepare(`
      SELECT 
        id, 
        email, 
        name, 
        role, 
        created_at,
        registration_notes
      FROM users
      WHERE is_approved = 0 AND is_active = 1
      ORDER BY created_at DESC
    `).all<PendingUser>();

    return new Response(JSON.stringify({ 
      pending_users: results || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Pending approvals error:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST - Approve account
export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only admins and instructors can approve accounts
    if (auth.user.role === 'student') {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as { user_id?: string; userId?: string };
    const user_id = body.user_id || body.userId;

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the user exists
    const user = await env.DB.prepare(`
      SELECT id, email, name, role, student_id, is_approved FROM users WHERE id = ?
    `).bind(user_id).first<{ id: string; email: string; name: string; role: string; student_id?: string | null; is_approved: number }>();

    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'User not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    const wasPending = !user.is_approved;

    // Ensure student accounts always have a linked, active student profile
    let linkedStudentId = user.student_id || null;

    if (user.role === 'student') {
      // Validate existing linked student profile
      if (linkedStudentId) {
        const existingLinked = await env.DB.prepare(
          'SELECT id FROM students WHERE id = ? AND deleted_at IS NULL'
        )
          .bind(linkedStudentId)
          .first<{ id: string }>();

        if (!existingLinked?.id) {
          linkedStudentId = null;
        }
      }

      if (!linkedStudentId) {
        const studentByEmail = await env.DB.prepare(
          `SELECT id, deleted_at FROM students
           WHERE email = ?
           ORDER BY CASE WHEN deleted_at IS NULL THEN 0 ELSE 1 END, created_at DESC
           LIMIT 1`
        )
          .bind(user.email)
          .first<{ id: string; deleted_at?: string | null }>();

        if (studentByEmail?.id) {
          linkedStudentId = studentByEmail.id;

          if (studentByEmail.deleted_at) {
            await env.DB.prepare(
              `UPDATE students
               SET name = ?, is_active = 1, deleted_at = NULL,
                   instructor_id = COALESCE(NULLIF(instructor_id, ''), ?),
                   updated_at = ?, updated_by = ?
               WHERE id = ?`
            )
              .bind(
                user.name,
                auth.user.role === 'instructor' ? auth.user.id : null,
                now,
                auth.user.id,
                linkedStudentId
              )
              .run();
          }
        } else {
          linkedStudentId = generateUserId();

          await env.DB.prepare(`
            INSERT INTO students (
              id, name, email, belt, discipline, join_date,
              is_active, created_by, instructor_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
          `)
            .bind(
              linkedStudentId,
              user.name,
              user.email,
              'White',
              'Brazilian Jiu-Jitsu',
              now,
              auth.user.id,
              auth.user.role === 'instructor' ? auth.user.id : null,
              now,
              now
            )
            .run();
        }
      }

      if (linkedStudentId) {
        // Keep instructor ownership when approver is instructor and assignment is missing
        if (auth.user.role === 'instructor') {
          await env.DB.prepare(
            "UPDATE students SET instructor_id = ?, updated_at = ?, updated_by = ? WHERE id = ? AND (instructor_id IS NULL OR instructor_id = '')"
          )
            .bind(auth.user.id, now, auth.user.id, linkedStudentId)
            .run();
        }

        await env.DB.prepare(
          'UPDATE users SET student_id = ?, updated_at = ? WHERE id = ?'
        )
          .bind(linkedStudentId, now, user_id)
          .run();
      }
    }

    // Approve the account (idempotent if already approved)
    if (wasPending) {
      await env.DB.prepare(`
        UPDATE users 
        SET is_approved = 1, approved_by = ?, approved_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(auth.user.id, now, now, user_id).run();
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: wasPending
        ? `Account for ${user.name} (${user.email}) has been approved`
        : `Account for ${user.name} (${user.email}) is already approved and profile has been synchronized`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Approve account error:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE - Reject account
export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only admins and instructors can reject accounts
    if (auth.user.role === 'student') {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    let userId = url.searchParams.get('user_id');

    if (!userId) {
      const body = await request.json().catch(() => ({} as { user_id?: string; userId?: string }));
      userId = body.user_id || body.userId || null;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the user exists and is pending approval
    const user = await env.DB.prepare(`
      SELECT id, email, name FROM users WHERE id = ? AND is_approved = 0
    `).bind(userId).first<{ id: string; email: string; name: string }>();

    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'User not found or already processed' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mark account as inactive (soft delete)
    await env.DB.prepare(`
      UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), userId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: `Account for ${user.name} (${user.email}) has been rejected`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Reject account error:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

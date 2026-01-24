/**
 * Account Approval API Endpoints
 * 
 * GET /api/auth/pending-approvals - List pending account approvals (admin/instructor)
 * POST /api/auth/pending-approvals - Approve a user account
 * DELETE /api/auth/pending-approvals?user_id=xxx - Reject a user account
 */

import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';

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

    // Verify the user exists and is pending approval
    const user = await env.DB.prepare(`
      SELECT id, email, name, role FROM users WHERE id = ? AND is_approved = 0
    `).bind(user_id).first<{ id: string; email: string; name: string; role: string }>();

    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'User not found or already approved' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Approve the account
    const now = new Date().toISOString();
    await env.DB.prepare(`
      UPDATE users 
      SET is_approved = 1, approved_by = ?, approved_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(auth.user.id, now, now, user_id).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: `Account for ${user.name} (${user.email}) has been approved`
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

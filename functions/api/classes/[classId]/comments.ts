import { Env } from '../../../types/index';
import { authenticateUser } from '../../../middleware/auth';

interface CommentRecord {
  id: string;
  class_id: string;
  comment: string;
  author_id: string;
  created_at: string;
  updated_at?: string;
}

export async function onRequestGet({ request, env, params }: { request: Request; env: Env; params: { classId?: string } }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const classId = params?.classId;
    if (!classId) {
      return new Response(JSON.stringify({ error: 'Missing classId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Students cannot access class comments
    if (auth.user.role === 'student') {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify class access (admin sees all, instructor only own classes)
    const classCheck = await env.DB.prepare(
      auth.user.role === 'admin'
        ? "SELECT id FROM classes WHERE id = ? AND deleted_at IS NULL"
        : "SELECT id FROM classes WHERE id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL"
    ).bind(...(auth.user.role === 'admin' ? [classId] : [classId, auth.user.id, auth.user.id])).first();

    if (!classCheck) {
      return new Response(JSON.stringify({ error: 'Class not found or access denied' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const { results } = await env.DB.prepare(
      `SELECT id, class_id, comment, author_id, created_at, updated_at FROM class_comments WHERE class_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`
    ).bind(classId).all<CommentRecord>();

    return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPost({ request, env, params }: { request: Request; env: Env; params: { classId?: string } }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const classId = params?.classId;
    if (!classId) return new Response(JSON.stringify({ error: 'Missing classId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    // Students cannot create class comments
    if (auth.user.role === 'student') {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify class access
    const classCheck = await env.DB.prepare(
      auth.user.role === 'admin'
        ? "SELECT id FROM classes WHERE id = ? AND deleted_at IS NULL"
        : "SELECT id FROM classes WHERE id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL"
    ).bind(...(auth.user.role === 'admin' ? [classId] : [classId, auth.user.id, auth.user.id])).first();

    if (!classCheck) {
      return new Response(JSON.stringify({ error: 'Class not found or access denied' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json() as { comment?: string };
    if (!body.comment) return new Response(JSON.stringify({ error: 'Missing comment body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    try {
      await env.DB.prepare(
        `INSERT INTO class_comments (id, class_id, comment, author_id, created_at) VALUES (?, ?, ?, ?, ?)`
      ).bind(id, classId, body.comment, auth.user.id, now).run();
    } catch (dbError) {
      // If FK constraint or other DB error, return a clearer message instead of a generic 500
      console.error('[Add Comment DB Error]', dbError);
      return new Response(JSON.stringify({ error: 'Database error adding comment' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Return created comment
    const { results } = await env.DB.prepare(`SELECT id, class_id, comment, author_id, created_at FROM class_comments WHERE id = ?`).bind(id).all<CommentRecord>();
    const created = results?.[0];
    return new Response(JSON.stringify(created), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestDelete({ request, env }: { request: Request; env: Env; params: { classId?: string } }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    if (auth.user.role === 'student') {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const url = new URL(request.url);
    const commentId = url.searchParams.get('commentId');
    if (!commentId) {
      return new Response(JSON.stringify({ error: 'Missing commentId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify ownership: only the author or an admin can delete
    const comment = await env.DB.prepare(
      'SELECT author_id FROM class_comments WHERE id = ? AND deleted_at IS NULL'
    ).bind(commentId).first<{ author_id: string }>();

    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    if (auth.user.role !== 'admin' && comment.author_id !== auth.user.id) {
      return new Response(JSON.stringify({ error: 'You can only delete your own comments' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const now = new Date().toISOString();
    await env.DB.prepare(
      'UPDATE class_comments SET deleted_at = ? WHERE id = ?'
    ).bind(now, commentId).run();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

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

    const { results } = await env.DB.prepare(
      `SELECT id, class_id, comment, author_id, created_at, updated_at FROM class_comments WHERE class_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`
    ).bind(classId).all<CommentRecord>();

    return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
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

    const body = await request.json() as { comment?: string };
    if (!body.comment) return new Response(JSON.stringify({ error: 'Missing comment body' }), { status: 400 });

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
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}

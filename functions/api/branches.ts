import type { Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';
import { MAIN_BRANCH_ID } from '../utils/branches';

interface BranchSummaryRow {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_main: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  student_count: number;
  active_student_count: number;
  total_revenue: number;
  monthly_revenue: number;
  pending_revenue: number;
  active_class_count: number;
  upcoming_class_count: number;
  attendance_count: number;
}
interface BranchWriteBody {
  id?: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  isActive?: boolean;
  instructorIds?: string[];
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

async function replaceBranchStaff(
  env: Env,
  branchId: string,
  instructorIds: string[],
  actorId: string,
): Promise<void> {
  const uniqueIds = Array.from(new Set(instructorIds));
  const now = new Date().toISOString();
  const statements = [
    env.DB.prepare(
      `DELETE FROM branch_staff
       WHERE branch_id = ?
         AND user_id IN (SELECT id FROM users WHERE role = 'instructor')`,
    ).bind(branchId),
    ...uniqueIds.map((userId) => env.DB.prepare(
      `INSERT OR IGNORE INTO branch_staff (branch_id, user_id, created_by, created_at)
       SELECT ?, id, ?, ?
       FROM users
       WHERE id = ? AND role = 'instructor' AND is_active = 1`,
    ).bind(branchId, actorId, now, userId)),
  ];

  await env.DB.batch(statements);
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return jsonResponse({ error: auth.error }, 401);

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthStart = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
    const today = now.toISOString().slice(0, 10);

    let accessClause = '';
    const params: string[] = [monthStart, nextMonthStart, today];

    if (auth.user.role === 'instructor') {
      accessClause = 'AND EXISTS (SELECT 1 FROM branch_staff bs WHERE bs.branch_id = b.id AND bs.user_id = ?)';
      params.push(auth.user.id);
    } else if (auth.user.role === 'student') {
      accessClause = 'AND b.id = (SELECT branch_id FROM students WHERE id = ?)';
      params.push(auth.user.student_id ?? '');
    }

    const { results } = await env.DB.prepare(`
      SELECT
        b.*,
        (SELECT COUNT(*) FROM students s WHERE s.branch_id = b.id AND s.deleted_at IS NULL) AS student_count,
        (SELECT COUNT(*) FROM students s WHERE s.branch_id = b.id AND s.deleted_at IS NULL AND s.is_active = 1) AS active_student_count,
        (SELECT COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount WHEN p.status = 'refunded' THEN -p.amount ELSE 0 END), 0)
          FROM payments p WHERE p.branch_id = b.id AND p.deleted_at IS NULL) AS total_revenue,
        (SELECT COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount WHEN p.status = 'refunded' THEN -p.amount ELSE 0 END), 0)
          FROM payments p
          WHERE p.branch_id = b.id AND p.deleted_at IS NULL AND p.date >= ? AND p.date < ?) AS monthly_revenue,
        (SELECT COALESCE(SUM(p.amount), 0)
          FROM payments p WHERE p.branch_id = b.id AND p.deleted_at IS NULL AND p.status = 'pending') AS pending_revenue,
        (SELECT COUNT(*) FROM classes c WHERE c.branch_id = b.id AND c.deleted_at IS NULL AND c.is_active = 1) AS active_class_count,
        (SELECT COUNT(*) FROM classes c WHERE c.branch_id = b.id AND c.deleted_at IS NULL AND c.date >= ?) AS upcoming_class_count,
        (SELECT COUNT(*)
          FROM attendance a
          INNER JOIN classes c ON c.id = a.class_id
          WHERE c.branch_id = b.id AND a.attended = 1) AS attendance_count
      FROM branches b
      WHERE b.is_active = 1 ${accessClause}
      ORDER BY b.is_main DESC, b.name ASC
    `).bind(...params).all<BranchSummaryRow>();

    return jsonResponse({ branches: results ?? [] });
  } catch (error) {
    console.error('[Branches GET]', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to load branches' }, 500);
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return jsonResponse({ error: auth.error }, 401);
    if (auth.user.role !== 'admin') return jsonResponse({ error: 'Admins only' }, 403);

    const body = await request.json() as BranchWriteBody;
    const name = body.name?.trim();
    if (!name) return jsonResponse({ error: 'Branch name is required' }, 400);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO branches (
          id, name, address, phone, email, notes, is_main, is_active,
          created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?)
      `).bind(
        id,
        name,
        body.address?.trim() || null,
        body.phone?.trim() || null,
        body.email?.trim() || null,
        body.notes?.trim() || null,
        auth.user.id,
        now,
        now,
      ),
      env.DB.prepare(
        `INSERT INTO branch_staff (branch_id, user_id, created_by, created_at)
         VALUES (?, ?, ?, ?)`,
      ).bind(id, auth.user.id, auth.user.id, now),
    ]);

    await replaceBranchStaff(env, id, body.instructorIds ?? [], auth.user.id);

    return jsonResponse({ success: true, branchId: id }, 201);
  } catch (error) {
    console.error('[Branches POST]', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to create branch' }, 500);
  }
}

export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return jsonResponse({ error: auth.error }, 401);
    if (auth.user.role !== 'admin') return jsonResponse({ error: 'Admins only' }, 403);

    const body = await request.json() as BranchWriteBody;
    if (!body.id) return jsonResponse({ error: 'Branch id is required' }, 400);

    const branch = await env.DB.prepare(
      'SELECT id, is_main FROM branches WHERE id = ?',
    ).bind(body.id).first<{ id: string; is_main: number }>();
    if (!branch) return jsonResponse({ error: 'Branch not found' }, 404);

    const sets: string[] = [];
    const values: Array<string | number | null> = [];
    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) return jsonResponse({ error: 'Branch name cannot be empty' }, 400);
      sets.push('name = ?');
      values.push(name);
    }
    if (body.address !== undefined) { sets.push('address = ?'); values.push(body.address.trim() || null); }
    if (body.phone !== undefined) { sets.push('phone = ?'); values.push(body.phone.trim() || null); }
    if (body.email !== undefined) { sets.push('email = ?'); values.push(body.email.trim() || null); }
    if (body.notes !== undefined) { sets.push('notes = ?'); values.push(body.notes.trim() || null); }
    if (body.isActive !== undefined) {
      if (branch.id === MAIN_BRANCH_ID && !body.isActive) {
        return jsonResponse({ error: 'The main branch cannot be deactivated' }, 400);
      }
      sets.push('is_active = ?');
      values.push(body.isActive ? 1 : 0);
    }

    if (sets.length > 0) {
      sets.push('updated_at = ?');
      values.push(new Date().toISOString(), body.id);
      await env.DB.prepare(`UPDATE branches SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
    }

    if (body.instructorIds) {
      await replaceBranchStaff(env, body.id, body.instructorIds, auth.user.id);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('[Branches PUT]', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to update branch' }, 500);
  }
}

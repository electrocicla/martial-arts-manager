import type { D1PreparedStatement, Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';
import {
  branchErrorResponse,
  resolveRequestBranchId,
} from '../utils/branches';

type QueryValue = string | number;

function bind(db: Env['DB'], sql: string, values: QueryValue[]): D1PreparedStatement {
  return db.prepare(sql).bind(...values);
}
export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (auth.user.role === 'student') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const branchId = await resolveRequestBranchId(request, env, auth.user);
    const isAdmin = auth.user.role === 'admin';
    const userId = auth.user.id;
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthStart = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);

    const studentScope = isAdmin
      ? 's.branch_id = ?'
      : 's.branch_id = ? AND (s.created_by = ? OR s.instructor_id = ? OR s.instructor_id IS NULL)';
    const studentParams: QueryValue[] = isAdmin ? [branchId] : [branchId, userId, userId];
    const classScope = isAdmin
      ? 'c.branch_id = ?'
      : 'c.branch_id = ? AND (c.created_by = ? OR c.instructor_id = ?)';
    const classParams: QueryValue[] = isAdmin ? [branchId] : [branchId, userId, userId];
    const paymentScope = isAdmin
      ? 'p.branch_id = ?'
      : 'p.branch_id = ? AND p.created_by = ?';
    const paymentParams: QueryValue[] = isAdmin ? [branchId] : [branchId, userId];

    const queries: D1PreparedStatement[] = [
      bind(env.DB, `SELECT COUNT(*) AS count FROM students s WHERE s.deleted_at IS NULL AND ${studentScope}`, studentParams),
      bind(env.DB, `SELECT COUNT(*) AS count FROM students s WHERE s.deleted_at IS NULL AND s.is_active = 1 AND ${studentScope}`, studentParams),
      bind(env.DB, `SELECT COUNT(*) AS count FROM students s WHERE s.deleted_at IS NULL AND ${studentScope} AND s.join_date >= ? AND s.join_date < ?`, [...studentParams, monthStart, nextMonthStart]),
      bind(env.DB, `SELECT s.belt, COUNT(*) AS count FROM students s WHERE s.deleted_at IS NULL AND ${studentScope} GROUP BY s.belt`, studentParams),
      bind(env.DB, `SELECT s.discipline, COUNT(*) AS count FROM students s WHERE s.deleted_at IS NULL AND ${studentScope} GROUP BY s.discipline`, studentParams),
      bind(env.DB, `SELECT COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount WHEN p.status = 'refunded' THEN -p.amount ELSE 0 END), 0) AS total FROM payments p WHERE p.deleted_at IS NULL AND ${paymentScope}`, paymentParams),
      bind(env.DB, `SELECT COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount WHEN p.status = 'refunded' THEN -p.amount ELSE 0 END), 0) AS total FROM payments p WHERE p.deleted_at IS NULL AND ${paymentScope} AND p.date >= ? AND p.date < ?`, [...paymentParams, monthStart, nextMonthStart]),
      bind(env.DB, `SELECT COUNT(*) AS count FROM payments p WHERE p.deleted_at IS NULL AND ${paymentScope} AND p.date >= ? AND p.date < ?`, [...paymentParams, monthStart, nextMonthStart]),
      bind(env.DB, `SELECT p.type, COUNT(*) AS count FROM payments p WHERE p.deleted_at IS NULL AND ${paymentScope} GROUP BY p.type`, paymentParams),
      bind(env.DB, `SELECT COUNT(*) AS count FROM classes c WHERE c.deleted_at IS NULL AND ${classScope}`, classParams),
      bind(env.DB, `SELECT COUNT(*) AS count FROM classes c WHERE c.deleted_at IS NULL AND c.is_active = 1 AND ${classScope}`, classParams),
      bind(env.DB, `SELECT COUNT(*) AS count FROM classes c WHERE c.deleted_at IS NULL AND ${classScope} AND c.date >= ? AND c.date <= ?`, [...classParams, weekStartStr, today]),
      bind(env.DB, `SELECT c.* FROM classes c WHERE c.deleted_at IS NULL AND ${classScope} AND c.date = ? ORDER BY c.time ASC LIMIT 5`, [...classParams, today]),
      bind(env.DB, `SELECT COUNT(*) AS count FROM classes c WHERE c.deleted_at IS NULL AND ${classScope} AND c.date > ?`, [...classParams, today]),
      bind(env.DB, `SELECT COUNT(*) AS count FROM attendance a INNER JOIN classes c ON a.class_id = c.id WHERE a.attended = 1 AND ${classScope} AND c.date >= ? AND c.date < ?`, [...classParams, monthStart, nextMonthStart]),
      bind(env.DB, `SELECT COALESCE(AVG(cnt), 0) AS avg_attendance FROM (SELECT COUNT(*) AS cnt FROM attendance a INNER JOIN classes c ON a.class_id = c.id WHERE a.attended = 1 AND ${classScope} AND c.date >= ? AND c.date < ? GROUP BY a.class_id)`, [...classParams, monthStart, nextMonthStart]),
      bind(env.DB, `SELECT s.* FROM students s WHERE s.deleted_at IS NULL AND ${studentScope} ORDER BY s.created_at DESC LIMIT 5`, studentParams),
      bind(env.DB, `SELECT p.*, s.name AS student_name FROM payments p LEFT JOIN students s ON p.student_id = s.id WHERE p.deleted_at IS NULL AND ${paymentScope} ORDER BY p.created_at DESC LIMIT 5`, paymentParams),
    ];

    const results = await env.DB.batch(queries);
    const scalar = (index: number, field = 'count'): number =>
      Number((results[index].results?.[0] as Record<string, unknown> | undefined)?.[field] ?? 0);
    const grouped = (index: number, keyField: string): Record<string, number> => {
      const output: Record<string, number> = {};
      for (const row of (results[index].results ?? []) as Record<string, unknown>[]) {
        output[String(row[keyField] ?? 'unknown')] = Number(row.count ?? 0);
      }
      return output;
    };

    return new Response(JSON.stringify({
      students: {
        total: scalar(0),
        active: scalar(1),
        newThisMonth: scalar(2),
        byBelt: grouped(3, 'belt'),
        byDiscipline: grouped(4, 'discipline'),
      },
      payments: {
        totalRevenue: scalar(5, 'total'),
        thisMonthRevenue: scalar(6, 'total'),
        recentPayments: scalar(7),
        byType: grouped(8, 'type'),
      },
      classes: {
        total: scalar(9),
        active: scalar(10),
        thisWeek: scalar(11),
        todayClasses: results[12].results ?? [],
        upcomingClasses: scalar(13),
      },
      attendance: {
        totalThisMonth: scalar(14),
        averagePerClass: Math.round(scalar(15, 'avg_attendance') * 10) / 10,
      },
      recentStudents: results[16].results ?? [],
      recentPayments: results[17].results ?? [],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;
    console.error('[Analytics] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch analytics' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

import { Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';

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

    const isAdmin = auth.user.role === 'admin';
    const userId = auth.user.id;

    // Date boundaries
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthStart = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Scope filter fragments
    const studentScope = isAdmin
      ? ''
      : 'AND (created_by = ?1 OR instructor_id = ?1 OR instructor_id IS NULL)';
    const classScope = isAdmin
      ? ''
      : 'AND (created_by = ?1 OR instructor_id = ?1)';
    const paymentScope = isAdmin
      ? ''
      : 'AND (created_by = ?1)';

    // Build all queries
    const queries: D1PreparedStatement[] = [];

    // 0: total students
    queries.push(
      bindScope(env.DB.prepare(
        `SELECT COUNT(*) as count FROM students WHERE deleted_at IS NULL ${studentScope}`
      ), isAdmin, userId)
    );

    // 1: active students
    queries.push(
      bindScope(env.DB.prepare(
        `SELECT COUNT(*) as count FROM students WHERE deleted_at IS NULL AND is_active = 1 ${studentScope}`
      ), isAdmin, userId)
    );

    // 2: new students this month
    queries.push(
      bindScope(env.DB.prepare(
        isAdmin
          ? `SELECT COUNT(*) as count FROM students WHERE deleted_at IS NULL AND join_date >= ?1 AND join_date < ?2`
          : `SELECT COUNT(*) as count FROM students WHERE deleted_at IS NULL AND join_date >= ?2 AND join_date < ?3 AND (created_by = ?1 OR instructor_id = ?1 OR instructor_id IS NULL)`
      ), isAdmin, userId, monthStart, nextMonthStart)
    );

    // 3: students by belt
    queries.push(
      bindScope(env.DB.prepare(
        `SELECT belt, COUNT(*) as count FROM students WHERE deleted_at IS NULL ${studentScope} GROUP BY belt`
      ), isAdmin, userId)
    );

    // 4: students by discipline
    queries.push(
      bindScope(env.DB.prepare(
        `SELECT discipline, COUNT(*) as count FROM students WHERE deleted_at IS NULL ${studentScope} GROUP BY discipline`
      ), isAdmin, userId)
    );

    // 5: total revenue (completed - refunded)
    queries.push(
      bindScope(env.DB.prepare(
        `SELECT COALESCE(SUM(CASE WHEN status = 'completed' THEN amount WHEN status = 'refunded' THEN -amount ELSE 0 END), 0) as total FROM payments WHERE deleted_at IS NULL ${paymentScope}`
      ), isAdmin, userId)
    );

    // 6: this month revenue
    queries.push(
      bindScope(env.DB.prepare(
        isAdmin
          ? `SELECT COALESCE(SUM(CASE WHEN status = 'completed' THEN amount WHEN status = 'refunded' THEN -amount ELSE 0 END), 0) as total FROM payments WHERE deleted_at IS NULL AND date >= ?1 AND date < ?2`
          : `SELECT COALESCE(SUM(CASE WHEN status = 'completed' THEN amount WHEN status = 'refunded' THEN -amount ELSE 0 END), 0) as total FROM payments WHERE deleted_at IS NULL AND date >= ?2 AND date < ?3 AND (created_by = ?1)`
      ), isAdmin, userId, monthStart, nextMonthStart)
    );

    // 7: payments count this month
    queries.push(
      bindScope(env.DB.prepare(
        isAdmin
          ? `SELECT COUNT(*) as count FROM payments WHERE deleted_at IS NULL AND date >= ?1 AND date < ?2`
          : `SELECT COUNT(*) as count FROM payments WHERE deleted_at IS NULL AND date >= ?2 AND date < ?3 AND (created_by = ?1)`
      ), isAdmin, userId, monthStart, nextMonthStart)
    );

    // 8: payments by type
    queries.push(
      bindScope(env.DB.prepare(
        `SELECT type, COUNT(*) as count FROM payments WHERE deleted_at IS NULL ${paymentScope} GROUP BY type`
      ), isAdmin, userId)
    );

    // 9: total classes
    queries.push(
      bindScope(env.DB.prepare(
        `SELECT COUNT(*) as count FROM classes WHERE deleted_at IS NULL ${classScope}`
      ), isAdmin, userId)
    );

    // 10: active classes
    queries.push(
      bindScope(env.DB.prepare(
        `SELECT COUNT(*) as count FROM classes WHERE deleted_at IS NULL AND is_active = 1 ${classScope}`
      ), isAdmin, userId)
    );

    // 11: classes this week
    queries.push(
      bindScope(env.DB.prepare(
        isAdmin
          ? `SELECT COUNT(*) as count FROM classes WHERE deleted_at IS NULL AND date >= ?1 AND date <= ?2`
          : `SELECT COUNT(*) as count FROM classes WHERE deleted_at IS NULL AND date >= ?2 AND date <= ?3 AND (created_by = ?1 OR instructor_id = ?1)`
      ), isAdmin, userId, weekStartStr, todayStr)
    );

    // 12: today classes (full records for dashboard)
    queries.push(
      bindScope(env.DB.prepare(
        isAdmin
          ? `SELECT * FROM classes WHERE deleted_at IS NULL AND date = ?1 ORDER BY time ASC LIMIT 5`
          : `SELECT * FROM classes WHERE deleted_at IS NULL AND date = ?2 AND (created_by = ?1 OR instructor_id = ?1) ORDER BY time ASC LIMIT 5`
      ), isAdmin, userId, todayStr)
    );

    // 13: upcoming classes count
    queries.push(
      bindScope(env.DB.prepare(
        isAdmin
          ? `SELECT COUNT(*) as count FROM classes WHERE deleted_at IS NULL AND date > ?1`
          : `SELECT COUNT(*) as count FROM classes WHERE deleted_at IS NULL AND date > ?2 AND (created_by = ?1 OR instructor_id = ?1)`
      ), isAdmin, userId, todayStr)
    );

    // 14: attendance this month
    queries.push(
      env.DB.prepare(
        isAdmin
          ? `SELECT COUNT(*) as count FROM attendance a JOIN classes c ON a.class_id = c.id WHERE a.attended = 1 AND c.date >= ? AND c.date < ?`
          : `SELECT COUNT(*) as count FROM attendance a JOIN classes c ON a.class_id = c.id WHERE a.attended = 1 AND c.date >= ? AND c.date < ? AND (c.created_by = ? OR c.instructor_id = ?)`
      ).bind(...(isAdmin ? [monthStart, nextMonthStart] : [monthStart, nextMonthStart, userId, userId]))
    );

    // 15: average attendance per class this month
    queries.push(
      env.DB.prepare(
        isAdmin
          ? `SELECT COALESCE(AVG(cnt), 0) as avg_attendance FROM (SELECT COUNT(*) as cnt FROM attendance a JOIN classes c ON a.class_id = c.id WHERE a.attended = 1 AND c.date >= ? AND c.date < ? GROUP BY a.class_id)`
          : `SELECT COALESCE(AVG(cnt), 0) as avg_attendance FROM (SELECT COUNT(*) as cnt FROM attendance a JOIN classes c ON a.class_id = c.id WHERE a.attended = 1 AND c.date >= ? AND c.date < ? AND (c.created_by = ? OR c.instructor_id = ?) GROUP BY a.class_id)`
      ).bind(...(isAdmin ? [monthStart, nextMonthStart] : [monthStart, nextMonthStart, userId, userId]))
    );

    // 16: recent students (last 5)
    queries.push(
      bindScope(env.DB.prepare(
        `SELECT * FROM students WHERE deleted_at IS NULL ${studentScope} ORDER BY created_at DESC LIMIT 5`
      ), isAdmin, userId)
    );

    // 17: recent payments (last 5)
    queries.push(
      bindScope(env.DB.prepare(
        `SELECT p.*, s.name as student_name FROM payments p LEFT JOIN students s ON p.student_id = s.id WHERE p.deleted_at IS NULL ${paymentScope} ORDER BY p.created_at DESC LIMIT 5`
      ), isAdmin, userId)
    );

    const results = await env.DB.batch(queries);

    const scalar = (idx: number, field = 'count') =>
      (results[idx].results?.[0] as Record<string, number>)?.[field] ?? 0;

    const grouped = (idx: number, keyField: string) => {
      const map: Record<string, number> = {};
      for (const row of (results[idx].results ?? []) as Record<string, unknown>[]) {
        const key = String(row[keyField] ?? 'unknown');
        map[key] = Number(row['count'] ?? 0);
      }
      return map;
    };

    const response = {
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
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch analytics' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Helper: D1 doesn't have a typed interface exported at module level, redeclare locally
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<unknown>;
  all<T = unknown>(): Promise<{ results?: T[]; success: boolean }>;
}

function bindScope(
  stmt: D1PreparedStatement,
  isAdmin: boolean,
  userId: string,
  ...extra: string[]
): D1PreparedStatement {
  if (isAdmin) {
    return extra.length ? stmt.bind(...extra) : stmt;
  }
  return extra.length ? stmt.bind(userId, ...extra) : stmt.bind(userId);
}

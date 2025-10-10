import { Env } from '../types/index';

interface AttendanceRecord {
  id: string;
  class_id: string;
  student_id: string;
  attended: number;
  check_in_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function onRequestGet({ env, request }: { env: Env; request: Request }) {
  const url = new URL(request.url);
  const classId = url.searchParams.get('classId');
  if (!classId) {
    return new Response(JSON.stringify({ error: 'classId required' }), { status: 400 });
  }
  try {
    const { results } = await env.DB.prepare("SELECT * FROM attendance WHERE class_id = ? ORDER BY created_at DESC").bind(classId).all<AttendanceRecord>();
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const body = await request.json() as { classId: string; studentId: string; attended: boolean; notes?: string };

    const now = new Date().toISOString();
    const { classId, studentId, attended, notes } = body;

    await env.DB.prepare(`
      INSERT OR REPLACE INTO attendance (
        id, class_id, student_id, attended, check_in_time, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      `${classId}-${studentId}`, classId, studentId, attended ? 1 : 0,
      attended ? now : null, notes || null, now, now
    ).run();

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
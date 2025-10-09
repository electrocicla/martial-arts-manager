import { Env } from '../types/index';

interface AttendanceRecord {
  id: string;
  class_id: string;
  student_id: string;
  attended: number;
}

export async function onRequestGet({ env, request }: { env: Env; request: Request }) {
  const url = new URL(request.url);
  const classId = url.searchParams.get('classId');
  if (!classId) {
    return new Response(JSON.stringify({ error: 'classId required' }), { status: 400 });
  }
  try {
    const { results } = await env.DB.prepare("SELECT * FROM attendance WHERE class_id = ?").bind(classId).all<AttendanceRecord>();
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const body = await request.json() as { classId: string; studentId: string; attended: boolean };
    const { classId, studentId, attended } = body;
    await env.DB.prepare("INSERT OR REPLACE INTO attendance (id, class_id, student_id, attended) VALUES (?, ?, ?, ?)")
      .bind(`${classId}-${studentId}`, classId, studentId, attended ? 1 : 0).run();
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
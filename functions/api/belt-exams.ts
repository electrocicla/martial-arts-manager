/**
 * Belt Exams API
 * Manages belt examination scheduling, assignment, and results
 */

import { Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';

// GET /api/belt-exams - List all belt exams (filtered by role)
export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const studentId = url.searchParams.get('student_id');

    let query = `
      SELECT 
        be.*,
        u.name as examiner_name,
        COUNT(DISTINCT ea.id) as assigned_count,
        COUNT(DISTINCT CASE WHEN ea.status = 'passed' THEN ea.id END) as passed_count
      FROM belt_exams be
      LEFT JOIN users u ON be.examiner_id = u.id
      LEFT JOIN exam_assignments ea ON be.id = ea.exam_id
    `;

    const conditions: string[] = [];
    const bindValues: string[] = [];

    // Students can only see exams they are assigned to
    if (auth.user.role === 'student') {
      conditions.push(`ea.student_id = ?`);
      bindValues.push(auth.user.student_id || '');
    }

    // Instructors can see exams they're conducting or their students' exams
    if (auth.user.role === 'instructor') {
      conditions.push(`(be.examiner_id = ? OR be.created_by = ?)`);
      bindValues.push(auth.user.id, auth.user.id);
    }

    if (status) {
      conditions.push(`be.status = ?`);
      bindValues.push(status);
    }

    if (studentId && (auth.user.role === 'admin' || auth.user.role === 'instructor')) {
      conditions.push(`ea.student_id = ?`);
      bindValues.push(studentId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY be.id ORDER BY be.exam_date DESC, be.exam_time DESC`;

    const result = await env.DB.prepare(query).bind(...bindValues).all();

    return new Response(JSON.stringify(result.results || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Get Belt Exams Error]', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/belt-exams - Create new belt exam
export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only admin and instructors can create exams
    if (auth.user.role === 'student') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as {
      belt_level: string;
      exam_date: string;
      exam_time: string;
      location: string;
      examiner_id: string;
      discipline: string;
      max_candidates?: number;
      notes?: string;
    };

    const { belt_level, exam_date, exam_time, location, examiner_id, discipline, max_candidates, notes } = body;

    if (!belt_level || !exam_date || !exam_time || !location || !examiner_id || !discipline) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO belt_exams (
        id, belt_level, exam_date, exam_time, location, examiner_id, 
        discipline, status, max_candidates, notes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, belt_level, exam_date, exam_time, location, examiner_id,
      discipline, 'scheduled', max_candidates || 20, notes || '', 
      auth.user.id, now, now
    ).run();

    const exam = await env.DB.prepare(
      'SELECT * FROM belt_exams WHERE id = ?'
    ).bind(id).first();

    return new Response(JSON.stringify(exam), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Create Belt Exam Error]', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/belt-exams - Update belt exam
export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (auth.user.role === 'student') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as {
      id: string;
      belt_level?: string;
      exam_date?: string;
      exam_time?: string;
      location?: string;
      examiner_id?: string;
      status?: string;
      max_candidates?: number;
      notes?: string;
    };

    const { id, ...updates } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Exam ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if exam exists and user has permission
    const exam = await env.DB.prepare(
      'SELECT * FROM belt_exams WHERE id = ?'
    ).bind(id).first<{ created_by: string; examiner_id: string }>();

    if (!exam) {
      return new Response(
        JSON.stringify({ error: 'Exam not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Instructors can only update their own exams
    if (auth.user.role === 'instructor' && exam.created_by !== auth.user.id && exam.examiner_id !== auth.user.id) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updateFields: string[] = [];
    const bindValues: (string | number)[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        bindValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    updateFields.push('updated_at = ?');
    bindValues.push(new Date().toISOString());
    bindValues.push(id);

    await env.DB.prepare(
      `UPDATE belt_exams SET ${updateFields.join(', ')} WHERE id = ?`
    ).bind(...bindValues).run();

    const updatedExam = await env.DB.prepare(
      'SELECT * FROM belt_exams WHERE id = ?'
    ).bind(id).first();

    return new Response(JSON.stringify(updatedExam), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Update Belt Exam Error]', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE /api/belt-exams - Delete belt exam
export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (auth.user.role === 'student') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Exam ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if exam exists and user has permission
    const exam = await env.DB.prepare(
      'SELECT * FROM belt_exams WHERE id = ?'
    ).bind(id).first<{ created_by: string }>();

    if (!exam) {
      return new Response(
        JSON.stringify({ error: 'Exam not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Instructors can only delete their own exams
    if (auth.user.role === 'instructor' && exam.created_by !== auth.user.id) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await env.DB.prepare('DELETE FROM belt_exams WHERE id = ?').bind(id).run();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Delete Belt Exam Error]', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

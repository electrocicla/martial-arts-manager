/**
 * Exam Assignments API
 * Manages student assignments to belt exams
 */

import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';

// GET /api/belt-exams/assignments - Get exam assignments
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
    const examId = url.searchParams.get('exam_id');
    const studentId = url.searchParams.get('student_id');

    let query = `
      SELECT 
        ea.*,
        s.name as student_name,
        s.email as student_email,
        s.belt as current_belt,
        s.discipline as student_discipline,
        be.belt_level as target_belt,
        be.exam_date,
        be.exam_time,
        be.location
      FROM exam_assignments ea
      JOIN students s ON ea.student_id = s.id
      JOIN belt_exams be ON ea.exam_id = be.id
      WHERE 1=1
    `;

    const bindValues: string[] = [];

    // Students can only see their own assignments
    if (auth.user.role === 'student') {
      query += ` AND ea.student_id = ?`;
      bindValues.push(auth.user.student_id || '');
    }

    if (examId) {
      query += ` AND ea.exam_id = ?`;
      bindValues.push(examId);
    }

    if (studentId && (auth.user.role === 'admin' || auth.user.role === 'instructor')) {
      query += ` AND ea.student_id = ?`;
      bindValues.push(studentId);
    }

    query += ` ORDER BY ea.assigned_at DESC`;

    const result = await env.DB.prepare(query).bind(...bindValues).all();

    return new Response(JSON.stringify(result.results || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Get Exam Assignments Error]', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/belt-exams/assignments - Assign student to exam
export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
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
      exam_id: string;
      student_id: string;
    };

    const { exam_id, student_id } = body;

    if (!exam_id || !student_id) {
      return new Response(
        JSON.stringify({ error: 'Exam ID and Student ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if exam exists
    const exam = await env.DB.prepare(
      'SELECT * FROM belt_exams WHERE id = ? AND status = ?'
    ).bind(exam_id, 'scheduled').first();

    if (!exam) {
      return new Response(
        JSON.stringify({ error: 'Exam not found or not available' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if student exists
    const student = await env.DB.prepare(
      'SELECT * FROM students WHERE id = ? AND deleted_at IS NULL'
    ).bind(student_id).first();

    if (!student) {
      return new Response(
        JSON.stringify({ error: 'Student not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if already assigned
    const existing = await env.DB.prepare(
      'SELECT id FROM exam_assignments WHERE exam_id = ? AND student_id = ?'
    ).bind(exam_id, student_id).first();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Student already assigned to this exam' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO exam_assignments (
        id, exam_id, student_id, status, assigned_at
      ) VALUES (?, ?, ?, ?, ?)`
    ).bind(id, exam_id, student_id, 'assigned', now).run();

    const assignment = await env.DB.prepare(
      'SELECT * FROM exam_assignments WHERE id = ?'
    ).bind(id).first();

    return new Response(JSON.stringify(assignment), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Create Exam Assignment Error]', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/belt-exams/assignments - Update assignment (record results)
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
      status?: string;
      result?: string;
      score?: number;
      feedback?: string;
    };

    const { id, status, result, score, feedback } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Assignment ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const assignment = await env.DB.prepare(
      `SELECT ea.*, be.belt_level, s.belt as current_belt
       FROM exam_assignments ea
       JOIN belt_exams be ON ea.exam_id = be.id
       JOIN students s ON ea.student_id = s.id
       WHERE ea.id = ?`
    ).bind(id).first<{
      student_id: string;
      exam_id: string;
      belt_level: string;
      current_belt: string;
    }>();

    if (!assignment) {
      return new Response(
        JSON.stringify({ error: 'Assignment not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updateFields: string[] = [];
    const bindValues: (string | number)[] = [];

    if (status) {
      updateFields.push('status = ?');
      bindValues.push(status);
    }

    if (result) {
      updateFields.push('result = ?');
      bindValues.push(result);
    }

    if (score !== undefined) {
      updateFields.push('score = ?');
      bindValues.push(score);
    }

    if (feedback) {
      updateFields.push('feedback = ?');
      bindValues.push(feedback);
    }

    if (status === 'completed' || result === 'pass') {
      updateFields.push('completed_at = ?');
      bindValues.push(new Date().toISOString());
    }

    bindValues.push(id);

    if (updateFields.length > 0) {
      await env.DB.prepare(
        `UPDATE exam_assignments SET ${updateFields.join(', ')} WHERE id = ?`
      ).bind(...bindValues).run();
    }

    // If student passed, update their belt and create history record
    if (result === 'pass') {
      const now = new Date().toISOString();
      
      // Update student's belt
      await env.DB.prepare(
        'UPDATE students SET belt = ?, updated_at = ? WHERE id = ?'
      ).bind(assignment.belt_level, now, assignment.student_id).run();

      // Create belt history record
      const historyId = crypto.randomUUID();
      await env.DB.prepare(
        `INSERT INTO student_belt_history (
          id, student_id, from_belt, to_belt, exam_id, promotion_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        historyId,
        assignment.student_id,
        assignment.current_belt,
        assignment.belt_level,
        assignment.exam_id,
        now,
        now
      ).run();
    }

    const updatedAssignment = await env.DB.prepare(
      'SELECT * FROM exam_assignments WHERE id = ?'
    ).bind(id).first();

    return new Response(JSON.stringify(updatedAssignment), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Update Exam Assignment Error]', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE /api/belt-exams/assignments - Remove student from exam
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
        JSON.stringify({ error: 'Assignment ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await env.DB.prepare('DELETE FROM exam_assignments WHERE id = ?').bind(id).run();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Delete Exam Assignment Error]', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

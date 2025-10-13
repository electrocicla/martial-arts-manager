import { Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';

interface PaymentRecord {
  id: string;
  student_id: string;
  amount: number;
  date: string;
  type: string;
  notes?: string;
  status: string;
  payment_method?: string;
  receipt_url?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get only payments created by this user
    const { results } = await env.DB.prepare(
      "SELECT * FROM payments WHERE deleted_at IS NULL AND created_by = ? ORDER BY date DESC"
    ).bind(auth.user.id).all<PaymentRecord>();
    
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as {
      id: string;
      studentId: string;
      amount: number;
      date: string;
      type: string;
      notes?: string;
      status?: string;
      paymentMethod?: string;
    };

    const now = new Date().toISOString();
    const { id, studentId, amount, date, type, notes, status = 'completed', paymentMethod } = body;

    // Verify that the student belongs to this user
    const studentCheck = await env.DB.prepare(
      "SELECT id FROM students WHERE id = ? AND created_by = ? AND deleted_at IS NULL"
    ).bind(studentId, auth.user.id).first();

    if (!studentCheck) {
      return new Response(JSON.stringify({ error: 'Student not found or access denied' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert payment with created_by
    await env.DB.prepare(`
      INSERT INTO payments (
        id, student_id, amount, date, type, notes, status, payment_method,
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, studentId, amount, date, type, notes || null, status, paymentMethod || null, 
      auth.user.id, now, now
    ).run();

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
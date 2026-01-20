import { Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';

interface PaymentRecord {
  id: string;
  student_id: string;
  student_name?: string;
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

    // Get payments for students the user has access to
    let query = `
      SELECT p.*, s.name as student_name FROM payments p
      INNER JOIN students s ON p.student_id = s.id
      WHERE p.deleted_at IS NULL AND s.deleted_at IS NULL
    `;
    const params: string[] = [];

    if (auth.user.role !== 'admin') {
      query += " AND (s.created_by = ? OR s.instructor_id = ? OR (s.instructor_id IS NULL AND s.created_by IS NOT NULL))";
      params.push(auth.user.id, auth.user.id);
    }

    query += " ORDER BY p.date DESC";

    const { results } = await env.DB.prepare(query).bind(...params).all<PaymentRecord>();
    
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

    const raw = await request.json() as Record<string, unknown>;

    // Accept both camelCase and snake_case request payloads
    const id = (raw['id'] ?? raw['payment_id'] ?? raw['paymentId']) as string | undefined;
    const studentId = (raw['studentId'] ?? raw['student_id']) as string | undefined;
    const amountRaw = raw['amount'] ?? raw['amt'];
    const date = (raw['date'] ?? raw['payment_date']) as string | undefined;
    const type = (raw['type'] ?? raw['payment_type']) as string | undefined;
    const notes = (raw['notes'] ?? raw['note']) as string | undefined;
    const status = (raw['status'] ?? 'completed') as string;
    const paymentMethod = (raw['paymentMethod'] ?? raw['payment_method']) as string | undefined;

    // Basic validation with clear messages
    if (!studentId) {
      return new Response(JSON.stringify({ error: 'studentId is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!amountRaw) {
      return new Response(JSON.stringify({ error: 'amount is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const amount = typeof amountRaw === 'number' ? amountRaw : Number(amountRaw);
    if (Number.isNaN(amount) || amount < 0) {
      return new Response(JSON.stringify({ error: 'amount must be a valid non-negative number' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!date || typeof date !== 'string') {
      return new Response(JSON.stringify({ error: 'date is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!type || typeof type !== 'string') {
      return new Response(JSON.stringify({ error: 'type is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const now = new Date().toISOString();

    // Verify that the student exists and user has access
    let studentCheckQuery = "SELECT id, instructor_id FROM students WHERE id = ? AND deleted_at IS NULL";
    const studentCheckParams: string[] = [studentId];

    if (auth.user.role !== 'admin') {
      // If not admin, check if user is the instructor assigned to the student, or if no instructor is assigned
      studentCheckQuery += " AND (instructor_id = ? OR instructor_id IS NULL OR created_by = ?)";
      studentCheckParams.push(auth.user.id, auth.user.id);
    }

    const studentCheck = await env.DB.prepare(studentCheckQuery).bind(...studentCheckParams).first();

    if (!studentCheck) {
      return new Response(JSON.stringify({ error: 'Student not found or access denied' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ensure we have an id
    const paymentId = id ?? `${studentId}-${Date.now()}`;

    // Insert payment with created_by
    await env.DB.prepare(`
      INSERT INTO payments (
        id, student_id, amount, date, type, notes, status, payment_method,
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      paymentId, studentId, amount, date, type, notes || null, status, paymentMethod || null, 
      auth.user.id, now, now
    ).run();

    // Return the full payment record so the client can immediately use it
    const payment = await env.DB.prepare(`
      SELECT p.*, s.name as student_name FROM payments p
      INNER JOIN students s ON p.student_id = s.id
      WHERE p.id = ?
    `).bind(paymentId).first<PaymentRecord>();
    return new Response(JSON.stringify(payment), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
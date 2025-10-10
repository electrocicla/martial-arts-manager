import { Env } from '../types/index';

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

export async function onRequestGet({ env }: { env: Env }) {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM payments WHERE deleted_at IS NULL ORDER BY date DESC").all<PaymentRecord>();
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
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

    await env.DB.prepare(`
      INSERT INTO payments (
        id, student_id, amount, date, type, notes, status, payment_method,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, studentId, amount, date, type, notes || null, status, paymentMethod || null, now, now
    ).run();

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
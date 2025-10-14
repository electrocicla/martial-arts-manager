import { Env } from '../../../types';
import { authenticateUser } from '../../../middleware/auth';

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
  created_at: string;
  updated_at: string;
}

interface PaymentStats {
  total: number;
  completed: number;
  pending: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  lastPaymentDate: string | null;
  nextPaymentDue: string | null;
}

// GET /api/students/:id/payments - Get all payments for a student
export async function onRequestGet({ request, env, params }: { request: Request; env: Env; params: any }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const studentId = params.id as string;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // optional filter by status

    if (!studentId) {
      return new Response(JSON.stringify({ error: 'Student ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify student exists and belongs to user
    const student = await env.DB.prepare(
      'SELECT id FROM students WHERE id = ? AND created_by = ? AND deleted_at IS NULL'
    )
      .bind(studentId, auth.user.id)
      .first();

    if (!student) {
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build query based on filters
    let query = `
      SELECT 
        id,
        student_id,
        amount,
        date,
        type,
        notes,
        status,
        payment_method,
        receipt_url,
        created_at,
        updated_at
      FROM payments 
      WHERE student_id = ? 
        AND deleted_at IS NULL
    `;

    const queryParams: any[] = [studentId];

    if (status) {
      query += ' AND status = ?';
      queryParams.push(status);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const { results: payments } = await env.DB.prepare(query)
      .bind(...queryParams)
      .all();

    // Calculate payment statistics
    const stats: PaymentStats = {
      total: 0,
      completed: 0,
      pending: 0,
      totalAmount: 0,
      completedAmount: 0,
      pendingAmount: 0,
      lastPaymentDate: null,
      nextPaymentDue: null,
    };

    if (payments && payments.length > 0) {
      stats.total = payments.length;
      
      payments.forEach((payment: any) => {
        const amount = parseFloat(payment.amount) || 0;
        
        if (payment.status === 'completed') {
          stats.completed++;
          stats.completedAmount += amount;
          if (!stats.lastPaymentDate || payment.date > stats.lastPaymentDate) {
            stats.lastPaymentDate = payment.date;
          }
        } else if (payment.status === 'pending') {
          stats.pending++;
          stats.pendingAmount += amount;
          if (!stats.nextPaymentDue || payment.date < stats.nextPaymentDue) {
            stats.nextPaymentDue = payment.date;
          }
        }
        
        stats.totalAmount += amount;
      });
    }

    return new Response(
      JSON.stringify({ 
        payments,
        stats,
        studentId 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching student payments:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch student payments' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

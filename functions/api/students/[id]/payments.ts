import { Env } from '../../../types';
import { authenticateUser } from '../../../middleware/auth';

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
export async function onRequestGet({ request, env, params }: { request: Request; env: Env; params: { id: string } }) {
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

    // Verify student exists and user has access (admin sees all, instructors see their students)
    let studentQuery = 'SELECT id FROM students WHERE id = ? AND deleted_at IS NULL';
    const studentParams: string[] = [studentId];

    if (auth.user.role !== 'admin') {
      // Instructors can see students they created or are assigned to
      studentQuery += ' AND (created_by = ? OR instructor_id = ?)';
      studentParams.push(auth.user.id, auth.user.id);
    }

    const student = await env.DB.prepare(studentQuery)
      .bind(...studentParams)
      .first();

    if (!student) {
      return new Response(JSON.stringify({ error: 'Student not found or access denied' }), {
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

    const queryParams: (string | null)[] = [studentId];

    if (status) {
      query += ' AND status = ?';
      queryParams.push(status);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const { results: payments } = await env.DB.prepare(query)
      .bind(...queryParams)
      .all() as { results: { amount: string; status: string; date: string }[] | null };

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
      
      payments.forEach((payment: { amount: string; status: string; date: string }) => {
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

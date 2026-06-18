import { Env } from '../../../types/index';
import { authenticateUser } from '../../../middleware/auth';
import { errorResponse, jsonResponse } from '../../../utils/response';
import {
  type MercadoPagoConfigStored,
  type MercadoPagoPreferencePayload,
  MercadoPagoApiError,
  createPreference,
  isMercadoPagoActive,
} from '../../../utils/mercadopago';
import {
  branchErrorResponse,
  resolveRequestBranchId,
} from '../../../utils/branches';

const SETTINGS_SECTION = 'mercadopago';
const PAYMENT_TYPES = new Set(['monthly', 'drop-in', 'private', 'equipment', 'other']);

interface StudentRow { id: string; name: string; email: string }

interface PreferenceBody {
  studentId?: string;
  amount?: number;
  type?: string;
  notes?: string;
  successUrl?: string;
  failureUrl?: string;
  pendingUrl?: string;
}

async function loadActiveConfig(env: Env, branchId: string): Promise<{ ownerId: string; config: MercadoPagoConfigStored } | null> {
  const row = await env.DB.prepare(
    `SELECT s.owner_id as ownerId, s.value as value
     FROM settings s
     INNER JOIN users u ON u.id = s.owner_id
     WHERE s.section = ?
       AND s.branch_id = ?
       AND u.role = 'admin'
       AND u.is_active = 1
     ORDER BY s.updated_at DESC
     LIMIT 1`,
  ).bind(SETTINGS_SECTION, branchId).first<{ ownerId: string; value: string }>();
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value) as MercadoPagoConfigStored;
    if (!isMercadoPagoActive(parsed)) return null;
    return { ownerId: row.ownerId, config: parsed };
  } catch {
    return null;
  }
}

/**
 * POST /api/payments/mercadopago/preference
 * Creates a MercadoPago Checkout Pro preference for a given student and
 * inserts a `pending` payment row tied to the preference's external_reference
 * so the webhook can reconcile it later.
 *
 * Auth: any authenticated user. Admins/instructors can pay for any of their
 * students; students can only pay for themselves.
 */
export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);
    const branchId = await resolveRequestBranchId(request, env, auth.user);

    const body = (await request.json()) as PreferenceBody;
    const studentId = (body.studentId ?? '').trim();
    if (!studentId) return errorResponse('studentId is required', 400);

    const active = await loadActiveConfig(env, branchId);
    if (!active) return errorResponse('MercadoPago is not active', 409);
    const { config } = active;

    // Resolve student & permissions.
    let studentQuery = 'SELECT id, name, email FROM students WHERE id = ? AND branch_id = ? AND deleted_at IS NULL';
    const studentParams: string[] = [studentId, branchId];
    if (auth.user.role === 'student') {
      if (auth.user.student_id !== studentId) return errorResponse('Forbidden', 403);
    } else if (auth.user.role === 'instructor') {
      studentQuery += ' AND (instructor_id = ? OR created_by = ? OR instructor_id IS NULL)';
      studentParams.push(auth.user.id, auth.user.id);
    }
    const student = await env.DB.prepare(studentQuery).bind(...studentParams).first<StudentRow>();
    if (!student) return errorResponse('Student not found or access denied', 404);

    const amount = typeof body.amount === 'number' && body.amount > 0
      ? body.amount
      : config.defaultAmount;
    if (!(amount > 0)) return errorResponse('amount must be greater than zero', 400);

    const type = body.type && PAYMENT_TYPES.has(body.type) ? body.type : 'monthly';
    const notes = typeof body.notes === 'string' ? body.notes.slice(0, 500) : '';

    const externalReference = `mp_${student.id}_${Date.now()}_${crypto.randomUUID()}`;
    const paymentId = crypto.randomUUID();
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    const baseUrl = new URL(request.url);
    const origin = `${baseUrl.protocol}//${baseUrl.host}`;
    const successUrl = body.successUrl || config.successUrl || `${origin}/payments?mp=success`;
    const failureUrl = body.failureUrl || config.failureUrl || `${origin}/payments?mp=failure`;
    const pendingUrl = body.pendingUrl || config.pendingUrl || `${origin}/payments?mp=pending`;
    const notificationUrl = config.notificationUrl
      || `${origin}/api/payments/mercadopago/webhook`;

    const preferencePayload: MercadoPagoPreferencePayload = {
      items: [
        {
          id: type,
          title: `Hamarr ${type} payment - ${student.name}`,
          description: notes || `Membership payment for ${student.name}`,
          quantity: 1,
          unit_price: Number(amount.toFixed(2)),
          currency_id: config.currency,
        },
      ],
      payer: { name: student.name, email: student.email },
      external_reference: externalReference,
      back_urls: { success: successUrl, failure: failureUrl, pending: pendingUrl },
      auto_return: 'approved',
      notification_url: notificationUrl,
      statement_descriptor: 'HAMARR',
      metadata: {
        student_id: student.id,
        payment_id: paymentId,
        type,
        created_by: auth.user.id,
        branch_id: branchId,
      },
    };

    let preference;
    try {
      preference = await createPreference(config.accessToken, preferencePayload);
    } catch (error) {
      if (error instanceof MercadoPagoApiError) {
        console.error('[MercadoPago Preference] API error', error.status, error.body);
        return errorResponse('Could not create MercadoPago checkout', 502);
      }
      throw error;
    }

    await env.DB.prepare(
      `INSERT INTO payments (
        id, student_id, branch_id, amount, date, type, notes, status, payment_method,
        payment_source, external_id, external_reference, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'mercadopago', 'mercadopago', NULL, ?, ?, ?, ?)`,
    ).bind(
      paymentId,
      student.id,
      branchId,
      Number(amount.toFixed(2)),
      today,
      type,
      notes ? `MercadoPago checkout: ${notes}` : 'MercadoPago checkout pending',
      externalReference,
      auth.user.id,
      now,
      now,
    ).run();

    return jsonResponse({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      externalReference,
      paymentId,
    }, 201);
  } catch (error) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;
    console.error('[MercadoPago Preference]', error);
    return errorResponse((error as Error).message, 500);
  }
}

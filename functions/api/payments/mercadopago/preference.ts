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
interface OrganizationRow { name: string }

interface PreferenceBody {
  studentId?: string;
  amount?: number;
  type?: string;
  notes?: string;
  successUrl?: string;
  failureUrl?: string;
  pendingUrl?: string;
}

async function loadActiveConfig(
  env: Env,
  organizationId: string,
  branchId: string,
): Promise<MercadoPagoConfigStored | null> {
  const row = await env.DB.prepare(
    `SELECT s.value
     FROM settings s
     WHERE s.organization_id = ?
       AND s.section = ?
       AND s.branch_id = ?
       AND (
         EXISTS (
           SELECT 1
           FROM organization_memberships om
           WHERE om.organization_id = s.organization_id
             AND om.user_id = s.owner_id
             AND om.role = 'admin'
             AND om.status = 'active'
             AND om.is_active = 1
         )
         OR EXISTS (
           SELECT 1 FROM platform_admins pa WHERE pa.user_id = s.owner_id
         )
       )
     ORDER BY s.updated_at DESC
     LIMIT 1`,
  ).bind(organizationId, SETTINGS_SECTION, branchId).first<{ value: string }>();

  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value) as MercadoPagoConfigStored;
    return isMercadoPagoActive(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, auth.status ?? 401);
    const branchId = await resolveRequestBranchId(request, env, auth.user);

    const body = (await request.json()) as PreferenceBody;
    const studentId = (body.studentId ?? '').trim();
    if (!studentId) return errorResponse('studentId is required', 400);

    const [config, organization] = await Promise.all([
      loadActiveConfig(env, auth.user.organization_id, branchId),
      env.DB.prepare('SELECT name FROM organizations WHERE id = ?')
        .bind(auth.user.organization_id)
        .first<OrganizationRow>(),
    ]);
    if (!config) return errorResponse('MercadoPago is not active', 409);

    let studentQuery =
      'SELECT id, name, email FROM students WHERE id = ? AND organization_id = ? AND branch_id = ? AND deleted_at IS NULL';
    const studentParams: string[] = [studentId, auth.user.organization_id, branchId];
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
    const organizationName = organization?.name ?? 'Academy';
    const statementDescriptor = auth.user.organization_id === 'manzur' ? 'MANZUR' : 'HAMARR';

    const preferencePayload: MercadoPagoPreferencePayload = {
      items: [
        {
          id: type,
          title: `${organizationName} ${type} payment - ${student.name}`,
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
      statement_descriptor: statementDescriptor,
      metadata: {
        student_id: student.id,
        payment_id: paymentId,
        type,
        created_by: auth.user.id,
        branch_id: branchId,
        organization_id: auth.user.organization_id,
      },
    };

    let preference;
    try {
      preference = await createPreference(config.accessToken, preferencePayload);
    } catch (error: unknown) {
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
  } catch (error: unknown) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;
    console.error('[MercadoPago Preference]', error);
    return errorResponse('Internal server error', 500);
  }
}

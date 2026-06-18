import { Env } from '../../../types/index';
import { errorResponse, jsonResponse } from '../../../utils/response';
import {
  type MercadoPagoConfigStored,
  type MercadoPagoPaymentResponse,
  MercadoPagoApiError,
  getPayment,
  isMercadoPagoActive,
  verifyWebhookSignature,
} from '../../../utils/mercadopago';

const SETTINGS_SECTION = 'mercadopago';

interface ConfigRow { value: string; branch_id: string }
interface PaymentRow {
  id: string;
  student_id: string;
  amount: number;
  status: string;
  external_reference: string | null;
  external_id: string | null;
}

async function loadActiveConfigs(
  env: Env,
): Promise<Array<{ branchId: string; config: MercadoPagoConfigStored }>> {
  const { results } = await env.DB.prepare(
    `SELECT s.value as value, s.branch_id as branch_id
     FROM settings s
     INNER JOIN users u ON u.id = s.owner_id
     WHERE s.section = ?
       AND s.branch_id IS NOT NULL
       AND u.role = 'admin'
       AND u.is_active = 1
     ORDER BY s.updated_at DESC`,
  ).bind(SETTINGS_SECTION).all<ConfigRow>();

  const configs: Array<{ branchId: string; config: MercadoPagoConfigStored }> = [];
  for (const row of results ?? []) {
    try {
      const parsed = JSON.parse(row.value) as MercadoPagoConfigStored;
      if (isMercadoPagoActive(parsed)) {
        configs.push({ branchId: row.branch_id, config: parsed });
      }
    } catch {
      // Ignore malformed configuration rows.
    }
  }
  return configs;
}

function statusFromMercadoPago(mpStatus: string): 'completed' | 'pending' | 'failed' | 'refunded' {
  switch (mpStatus) {
    case 'approved':
    case 'authorized':
      return 'completed';
    case 'in_process':
    case 'pending':
      return 'pending';
    case 'rejected':
    case 'cancelled':
      return 'failed';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    default:
      return 'pending';
  }
}

async function reconcilePayment(
  env: Env,
  mpPayment: MercadoPagoPaymentResponse,
  branchId: string,
): Promise<void> {
  const externalReference = mpPayment.external_reference ?? null;
  const externalId = String(mpPayment.id);
  const newStatus = statusFromMercadoPago(mpPayment.status);
  const paymentDate = (mpPayment.date_approved ?? mpPayment.date_created ?? new Date().toISOString()).slice(0, 10);
  const now = new Date().toISOString();
  const noteLine = `MercadoPago ${mpPayment.status}${mpPayment.payment_method_id ? ` via ${mpPayment.payment_method_id}` : ''}`;

  // 1) Try to update an existing pending payment by external_reference.
  if (externalReference) {
    const existing = await env.DB.prepare(
      `SELECT id, student_id, amount, status, external_reference, external_id
       FROM payments
       WHERE external_reference = ? AND branch_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
    ).bind(externalReference, branchId).first<PaymentRow>();

    if (existing) {
      await env.DB.prepare(
        `UPDATE payments SET
          status = ?,
          external_id = ?,
          payment_method = COALESCE(?, payment_method),
          notes = ?,
          date = ?,
          updated_at = ?
         WHERE id = ?`,
      ).bind(
        newStatus,
        externalId,
        mpPayment.payment_method_id ?? null,
        noteLine,
        paymentDate,
        now,
        existing.id,
      ).run();
      return;
    }
  }

  // 2) Idempotency by external_id (re-delivery before reference exists).
  const dup = await env.DB.prepare(
    'SELECT id FROM payments WHERE external_id = ? AND branch_id = ? AND deleted_at IS NULL LIMIT 1',
  ).bind(externalId, branchId).first<{ id: string }>();
  if (dup) {
    await env.DB.prepare(
      `UPDATE payments SET status = ?, notes = ?, date = ?, updated_at = ? WHERE id = ?`,
    ).bind(newStatus, noteLine, paymentDate, now, dup.id).run();
    return;
  }

  // 3) Otherwise, try to attach to a student via metadata.student_id.
  const metadata = (mpPayment.metadata ?? {}) as Record<string, unknown>;
  const metaStudentId = typeof metadata.student_id === 'string' ? metadata.student_id : null;
  const type = typeof metadata.type === 'string' ? metadata.type : 'monthly';
  const createdBy = typeof metadata.created_by === 'string' ? metadata.created_by : null;
  if (!metaStudentId) {
    console.error('[MercadoPago Webhook] Cannot reconcile payment without student_id', externalId);
    return;
  }
  const student = await env.DB.prepare(
    'SELECT id FROM students WHERE id = ? AND deleted_at IS NULL',
  ).bind(metaStudentId).first<{ id: string }>();
  if (!student) {
    console.error('[MercadoPago Webhook] Student missing for payment', externalId);
    return;
  }
  const newId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO payments (
      id, student_id, branch_id, amount, date, type, notes, status, payment_method,
      payment_source, external_id, external_reference, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'mercadopago', ?, ?, ?, ?, ?)`,
  ).bind(
    newId,
    student.id,
    branchId,
    Number(mpPayment.transaction_amount.toFixed(2)),
    paymentDate,
    type,
    noteLine,
    newStatus,
    mpPayment.payment_method_id ?? null,
    externalId,
    externalReference,
    createdBy,
    now,
    now,
  ).run();
}

/**
 * POST /api/payments/mercadopago/webhook
 * MercadoPago IPN v2 receiver. Validates `x-signature`, fetches the payment
 * server-to-server, and reconciles it with our `payments` table.
 *
 * Always responds 200 to avoid retries when we cannot recover; logs errors.
 */
export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const url = new URL(request.url);
    const queryDataId = url.searchParams.get('data.id') ?? url.searchParams.get('id');
    const queryType = url.searchParams.get('type') ?? url.searchParams.get('topic');

    let bodyText = '';
    try { bodyText = await request.text(); } catch { bodyText = ''; }
    let parsed: { type?: string; action?: string; data?: { id?: string | number }; topic?: string } = {};
    if (bodyText) {
      try { parsed = JSON.parse(bodyText); } catch { parsed = {}; }
    }

    const eventType = parsed.type ?? parsed.topic ?? queryType ?? '';
    const dataId = parsed.data?.id ? String(parsed.data.id) : queryDataId;

    if (!dataId) return jsonResponse({ ok: true, ignored: 'missing data id' });
    if (eventType && !eventType.includes('payment')) {
      return jsonResponse({ ok: true, ignored: `event ${eventType}` });
    }

    const signatureHeader = request.headers.get('x-signature');
    const requestId = request.headers.get('x-request-id');
    const activeConfigs = await loadActiveConfigs(env);
    if (activeConfigs.length === 0) return errorResponse('MercadoPago not active', 409);

    let matchedSignature = false;
    let matchedBranchId: string | null = null;
    let mpPayment: MercadoPagoPaymentResponse | null = null;

    for (const entry of activeConfigs) {
      const validSignature = await verifyWebhookSignature(
        entry.config.webhookSecret,
        signatureHeader,
        requestId,
        dataId,
      );
      if (!validSignature) continue;
      matchedSignature = true;

      try {
        mpPayment = await getPayment(entry.config.accessToken, dataId);
        matchedBranchId = entry.branchId;
        break;
      } catch (error) {
        if (error instanceof MercadoPagoApiError && error.status === 404) {
          continue;
        }
        throw error;
      }
    }

    if (!matchedSignature) {
      console.error('[MercadoPago Webhook] Invalid signature for', dataId);
      return errorResponse('Invalid signature', 401);
    }
    if (!mpPayment || !matchedBranchId) {
      return jsonResponse({ ok: true, ignored: 'payment not found yet' });
    }

    await reconcilePayment(env, mpPayment, matchedBranchId);
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error('[MercadoPago Webhook]', error);
    return errorResponse((error as Error).message, 500);
  }
}

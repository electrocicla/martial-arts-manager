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

interface ConfigRow {
  value: string;
  branch_id: string;
  organization_id: string;
}

interface ActiveConfig {
  branchId: string;
  organizationId: string;
  config: MercadoPagoConfigStored;
}

async function loadActiveConfigs(env: Env): Promise<ActiveConfig[]> {
  const { results } = await env.DB.prepare(
    `SELECT s.value, s.branch_id, s.organization_id
       FROM settings s
       INNER JOIN branches b
         ON b.id = s.branch_id
        AND b.organization_id = s.organization_id
      WHERE s.section = ?
        AND s.branch_id IS NOT NULL
        AND b.is_active = 1
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
      ORDER BY s.updated_at DESC`,
  ).bind(SETTINGS_SECTION).all<ConfigRow>();

  const configs: ActiveConfig[] = [];
  for (const row of results ?? []) {
    try {
      const parsed = JSON.parse(row.value) as MercadoPagoConfigStored;
      if (isMercadoPagoActive(parsed)) {
        configs.push({
          branchId: row.branch_id,
          organizationId: row.organization_id,
          config: parsed,
        });
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

/**
 * Commit only a locally issued checkout, using one atomic UPDATE rather than
 * SELECT-then-INSERT. Existing unique idx_payments_external_id prevents the
 * same provider payment ID from settling two local records concurrently.
 */
async function reconcilePayment(
  env: Env,
  mpPayment: MercadoPagoPaymentResponse,
  branchId: string,
  organizationId: string,
  currency: string,
): Promise<void> {
  const meta = mpPayment.metadata ?? {};
  const metaOrg = typeof meta.organization_id === 'string' ? meta.organization_id : '';
  const metaBranch = typeof meta.branch_id === 'string' ? meta.branch_id : '';
  const studentId = typeof meta.student_id === 'string' ? meta.student_id : '';
  const localPaymentId = typeof meta.payment_id === 'string' ? meta.payment_id : '';
  const type = typeof meta.type === 'string' ? meta.type : '';
  const externalReference = mpPayment.external_reference;

  if (!metaOrg || metaOrg !== organizationId || !metaBranch || metaBranch !== branchId
    || !studentId || !localPaymentId || !type || !externalReference) {
    throw new PaymentBindingError('Missing or mismatched payment ownership metadata');
  }
  const amount = mpPayment.transaction_amount;
  if (mpPayment.currency_id !== currency || !Number.isFinite(amount) || amount <= 0
    || !Number.isSafeInteger(mpPayment.id) || mpPayment.id <= 0) {
    throw new PaymentBindingError('Payment currency, amount, or identity is invalid');
  }

  const externalId = String(mpPayment.id);
  const newStatus = statusFromMercadoPago(mpPayment.status);
  const paymentDate = (
    mpPayment.date_approved ?? mpPayment.date_created ?? new Date().toISOString()
  ).slice(0, 10);
  const now = new Date().toISOString();
  const noteLine = `MercadoPago ${mpPayment.status}${mpPayment.payment_method_id ? ` via ${mpPayment.payment_method_id}` : ''}`;

  // D1 SQLite UPDATE is atomic. Require the exact pending payment ID, provider
  // reference, student, tenant, branch, payment type and server-recorded amount.
  // A replay updates the same row only; refunded/completed cannot be demoted by
  // a late pending/failed notification.
  const updated = await env.DB.prepare(
    `UPDATE payments SET
       status = CASE
         WHEN status = 'refunded' THEN status
         WHEN status = 'completed' AND ? IN ('pending', 'failed') THEN status
         ELSE ?
       END,
       external_id = ?,
       payment_method = COALESCE(?, payment_method),
       notes = ?,
       date = ?,
       updated_at = ?
     WHERE id = ?
       AND external_reference = ?
       AND student_id = ?
       AND branch_id = ?
       AND payment_source = 'mercadopago'
       AND type = ?
       AND ROUND(amount, 2) = ?
       AND (external_id IS NULL OR external_id = ?)
       AND deleted_at IS NULL
       AND EXISTS (
         SELECT 1 FROM students s
          WHERE s.id = payments.student_id
            AND s.organization_id = ?
            AND s.branch_id = ?
            AND s.deleted_at IS NULL
       )
     RETURNING id`,
  ).bind(
    newStatus, newStatus, externalId,
    mpPayment.payment_method_id ?? null,
    noteLine, paymentDate, now,
    localPaymentId, externalReference, studentId, branchId,
    type, Number(amount.toFixed(2)), externalId, organizationId, branchId,
  ).first<{ id: string }>();

  if (!updated || updated.id !== localPaymentId) {
    throw new PaymentBindingError('Payment did not match a locally issued checkout');
  }
}

class PaymentBindingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentBindingError';
  }
}

/**
 * POST /api/payments/mercadopago/webhook
 * Tenant identity is derived from trusted stored config + branch ownership,
 * never from caller headers.
 */
export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    const url = new URL(request.url);
    const queryDataId = url.searchParams.get('data.id') ?? url.searchParams.get('id');
    const queryType = url.searchParams.get('type') ?? url.searchParams.get('topic');

    let bodyText = '';
    try {
      bodyText = await request.text();
    } catch {
      bodyText = '';
    }

    let parsed: {
      type?: string;
      action?: string;
      data?: { id?: string | number };
      topic?: string;
    } = {};
    if (bodyText) {
      try {
        parsed = JSON.parse(bodyText) as typeof parsed;
      } catch {
        parsed = {};
      }
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

    let signedCount = 0;
    let fetchedCount = 0;
    const eligible: Array<{ entry: ActiveConfig; payment: MercadoPagoPaymentResponse }> = [];

    // A merchant credential and signature can be shared by multiple academy
    // branches. Fetching the payment is not sufficient to select a tenant:
    // compare trusted MercadoPago metadata to every signed active config.
    for (const entry of activeConfigs) {
      if (!await verifyWebhookSignature(
        entry.config.webhookSecret, signatureHeader, requestId, dataId,
      )) continue;
      signedCount += 1;

      try {
        const payment = await getPayment(entry.config.accessToken, dataId);
        fetchedCount += 1;
        if (String(payment.id) !== dataId) {
          return errorResponse('Payment identity mismatch', 409);
        }
        if (payment.metadata?.organization_id === entry.organizationId
          && payment.metadata?.branch_id === entry.branchId) {
          eligible.push({ entry, payment });
        }
      } catch (error: unknown) {
        if (error instanceof MercadoPagoApiError && error.status === 404) continue;
        throw error;
      }
    }

    if (signedCount === 0) {
      return errorResponse('Invalid signature', 401);
    }
    if (fetchedCount === 0) {
      return jsonResponse({ ok: true, ignored: 'payment not found yet' });
    }
    if (eligible.length !== 1) {
      // Missing/mismatched metadata or multiple matching branch configs must
      // never be resolved by first-match ordering or caller-supplied headers.
      return errorResponse('Ambiguous or mismatched payment tenant', 409);
    }

    const { entry, payment } = eligible[0];
    try {
      await reconcilePayment(env, payment, entry.branchId, entry.organizationId, entry.config.currency);
    } catch (error: unknown) {
      if (error instanceof PaymentBindingError) return errorResponse(error.message, 409);
      throw error;
    }
    return jsonResponse({ ok: true });
  } catch (error: unknown) {
    console.error('[MercadoPago Webhook]', error);
    return errorResponse('Internal server error', 500);
  }
}

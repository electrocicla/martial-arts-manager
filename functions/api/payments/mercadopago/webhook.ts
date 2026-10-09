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
interface PaymentRow {
  id: string;
  student_id: string;
  amount: number;
  status: string;
  external_reference: string | null;
  external_id: string | null;
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

async function reconcilePayment(
  env: Env,
  mpPayment: MercadoPagoPaymentResponse,
  branchId: string,
  organizationId: string,
): Promise<void> {
  const externalReference = mpPayment.external_reference ?? null;
  const externalId = String(mpPayment.id);
  const newStatus = statusFromMercadoPago(mpPayment.status);
  const paymentDate = (
    mpPayment.date_approved
    ?? mpPayment.date_created
    ?? new Date().toISOString()
  ).slice(0, 10);
  const now = new Date().toISOString();
  const noteLine = `MercadoPago ${mpPayment.status}${mpPayment.payment_method_id ? ` via ${mpPayment.payment_method_id}` : ''}`;
  const metadata = (mpPayment.metadata ?? {}) as Record<string, unknown>;
  const metadataOrganizationId =
    typeof metadata.organization_id === 'string' ? metadata.organization_id : null;

  if (metadataOrganizationId && metadataOrganizationId !== organizationId) {
    throw new Error('MercadoPago payment tenant mismatch');
  }

  if (externalReference) {
    const existing = await env.DB.prepare(
      `SELECT p.id, p.student_id, p.amount, p.status, p.external_reference, p.external_id
         FROM payments p
         INNER JOIN students s ON s.id = p.student_id
        WHERE p.external_reference = ?
          AND p.branch_id = ?
          AND s.organization_id = ?
          AND p.deleted_at IS NULL
        ORDER BY p.created_at DESC
        LIMIT 1`,
    ).bind(externalReference, branchId, organizationId).first<PaymentRow>();

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

  const duplicate = await env.DB.prepare(
    `SELECT p.id
       FROM payments p
       INNER JOIN students s ON s.id = p.student_id
      WHERE p.external_id = ?
        AND p.branch_id = ?
        AND s.organization_id = ?
        AND p.deleted_at IS NULL
      LIMIT 1`,
  ).bind(externalId, branchId, organizationId).first<{ id: string }>();

  if (duplicate) {
    await env.DB.prepare(
      'UPDATE payments SET status = ?, notes = ?, date = ?, updated_at = ? WHERE id = ?',
    ).bind(newStatus, noteLine, paymentDate, now, duplicate.id).run();
    return;
  }

  const metaStudentId = typeof metadata.student_id === 'string' ? metadata.student_id : null;
  const type = typeof metadata.type === 'string' ? metadata.type : 'monthly';
  const createdBy = typeof metadata.created_by === 'string' ? metadata.created_by : null;
  if (!metaStudentId) {
    console.error('[MercadoPago Webhook] Cannot reconcile payment without student_id', externalId);
    return;
  }

  const student = await env.DB.prepare(
    `SELECT id
       FROM students
      WHERE id = ?
        AND organization_id = ?
        AND branch_id = ?
        AND deleted_at IS NULL`,
  ).bind(metaStudentId, organizationId, branchId).first<{ id: string }>();
  if (!student) {
    console.error('[MercadoPago Webhook] Student missing for payment', externalId);
    return;
  }

  await env.DB.prepare(
    `INSERT INTO payments (
      id, student_id, branch_id, amount, date, type, notes, status, payment_method,
      payment_source, external_id, external_reference, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'mercadopago', ?, ?, ?, ?, ?)`,
  ).bind(
    crypto.randomUUID(),
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

    let matchedSignature = false;
    let matchedConfig: ActiveConfig | null = null;
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
        matchedConfig = entry;
        break;
      } catch (error: unknown) {
        if (error instanceof MercadoPagoApiError && error.status === 404) continue;
        throw error;
      }
    }

    if (!matchedSignature) {
      console.error('[MercadoPago Webhook] Invalid signature for', dataId);
      return errorResponse('Invalid signature', 401);
    }
    if (!mpPayment || !matchedConfig) {
      return jsonResponse({ ok: true, ignored: 'payment not found yet' });
    }

    await reconcilePayment(
      env,
      mpPayment,
      matchedConfig.branchId,
      matchedConfig.organizationId,
    );
    return jsonResponse({ ok: true });
  } catch (error: unknown) {
    console.error('[MercadoPago Webhook]', error);
    return errorResponse('Internal server error', 500);
  }
}

import { Env } from '../../../types/index';
import { authenticateUser } from '../../../middleware/auth';
import { errorResponse, jsonResponse } from '../../../utils/response';
import {
  type MercadoPagoConfigStored,
  isMercadoPagoActive,
  isMercadoPagoConfigComplete,
  maskSecret,
} from '../../../utils/mercadopago';
import {
  branchErrorResponse,
  MAIN_BRANCH_ID,
  resolveRequestBranchId,
} from '../../../utils/branches';

const SETTINGS_SECTION = 'mercadopago';

const DEFAULT_CONFIG: MercadoPagoConfigStored = {
  enabled: false,
  accessToken: '',
  publicKey: '',
  webhookSecret: '',
  accountEmail: '',
  currency: 'CLP',
  defaultAmount: 0,
  successUrl: '',
  failureUrl: '',
  pendingUrl: '',
  notificationUrl: '',
};

interface SettingsRow { value: string }

async function loadConfig(env: Env, ownerId: string, branchId: string): Promise<MercadoPagoConfigStored> {
  const row = await env.DB.prepare(
    'SELECT value FROM settings WHERE owner_id = ? AND section = ? AND branch_id = ?',
  ).bind(ownerId, SETTINGS_SECTION, branchId).first<SettingsRow>();
  if (!row) return { ...DEFAULT_CONFIG };
  try {
    const parsed = JSON.parse(row.value) as Partial<MercadoPagoConfigStored>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function publicView(config: MercadoPagoConfigStored, reveal: boolean) {
  return {
    enabled: config.enabled,
    accessToken: reveal ? config.accessToken : maskSecret(config.accessToken),
    publicKey: config.publicKey,
    webhookSecret: reveal ? config.webhookSecret : maskSecret(config.webhookSecret),
    accountEmail: config.accountEmail,
    currency: config.currency,
    defaultAmount: config.defaultAmount,
    successUrl: config.successUrl ?? '',
    failureUrl: config.failureUrl ?? '',
    pendingUrl: config.pendingUrl ?? '',
    notificationUrl: config.notificationUrl ?? '',
    isComplete: isMercadoPagoConfigComplete(config),
    isActive: isMercadoPagoActive(config),
  };
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);
    if (auth.user.role !== 'admin') return errorResponse('Admins only', 403);

    const url = new URL(request.url);
    const reveal = url.searchParams.get('reveal') === '1';
    const branchId = await resolveRequestBranchId(request, env, auth.user);
    const config = await loadConfig(env, auth.user.id, branchId);
    return jsonResponse(publicView(config, reveal));
  } catch (error) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;
    console.error('[MercadoPago Config GET]', error);
    return errorResponse((error as Error).message, 500);
  }
}

export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);
    if (auth.user.role !== 'admin') return errorResponse('Admins only', 403);

    const branchId = await resolveRequestBranchId(request, env, auth.user);
    const body = (await request.json()) as Partial<MercadoPagoConfigStored>;
    const current = await loadConfig(env, auth.user.id, branchId);

    // Treat masked values (received as bullets) as "no change".
    const looksMasked = (v: string | undefined): boolean => !!v && /^\*+/.test(v);

    const next: MercadoPagoConfigStored = {
      enabled: typeof body.enabled === 'boolean' ? body.enabled : current.enabled,
      accessToken: typeof body.accessToken === 'string' && !looksMasked(body.accessToken)
        ? body.accessToken.trim()
        : current.accessToken,
      publicKey: typeof body.publicKey === 'string' ? body.publicKey.trim() : current.publicKey,
      webhookSecret: typeof body.webhookSecret === 'string' && !looksMasked(body.webhookSecret)
        ? body.webhookSecret.trim()
        : current.webhookSecret,
      accountEmail: typeof body.accountEmail === 'string'
        ? body.accountEmail.trim().toLowerCase()
        : current.accountEmail,
      currency: typeof body.currency === 'string' && body.currency.trim().length >= 3
        ? body.currency.trim().toUpperCase()
        : current.currency,
      defaultAmount: typeof body.defaultAmount === 'number' && Number.isFinite(body.defaultAmount)
        ? Math.max(0, body.defaultAmount)
        : current.defaultAmount,
      successUrl: typeof body.successUrl === 'string' ? body.successUrl.trim() : current.successUrl,
      failureUrl: typeof body.failureUrl === 'string' ? body.failureUrl.trim() : current.failureUrl,
      pendingUrl: typeof body.pendingUrl === 'string' ? body.pendingUrl.trim() : current.pendingUrl,
      notificationUrl: typeof body.notificationUrl === 'string'
        ? body.notificationUrl.trim()
        : current.notificationUrl,
    };

    if (next.enabled && !isMercadoPagoConfigComplete(next)) {
      return errorResponse(
        'Cannot activate MercadoPago: complete every required field first.',
        400,
      );
    }

    const id = branchId === MAIN_BRANCH_ID
      ? `${auth.user.id}-${SETTINGS_SECTION}`
      : `${auth.user.id}-${branchId}-${SETTINGS_SECTION}`;
    const now = new Date().toISOString();
    const value = JSON.stringify(next);
    await env.DB.prepare(
      `INSERT INTO settings (id, owner_id, section, value, branch_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET value = ?, updated_at = ?`,
    ).bind(id, auth.user.id, SETTINGS_SECTION, value, branchId, now, now, value, now).run();

    return jsonResponse(publicView(next, false));
  } catch (error) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;
    console.error('[MercadoPago Config PUT]', error);
    return errorResponse((error as Error).message, 500);
  }
}

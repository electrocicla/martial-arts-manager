/**
 * MercadoPago utilities (Cloudflare Workers compatible).
 *
 * Implements the minimal slice of the MercadoPago REST API required for
 * Checkout Pro: create preference, fetch payment, validate credentials,
 * and verify webhook (`x-signature`) HMAC-SHA256 signatures.
 *
 * No SDK is used so this works inside Cloudflare Workers/Pages Functions.
 */

const MP_BASE_URL = 'https://api.mercadopago.com';

export interface MercadoPagoConfigStored {
  enabled: boolean;
  accessToken: string;
  publicKey: string;
  webhookSecret: string;
  accountEmail: string;
  currency: string;
  defaultAmount: number;
  successUrl?: string;
  failureUrl?: string;
  pendingUrl?: string;
  notificationUrl?: string;
}

export interface MercadoPagoPreferenceItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

export interface MercadoPagoPreferencePayload {
  items: MercadoPagoPreferenceItem[];
  payer?: { name?: string; email?: string };
  external_reference: string;
  back_urls?: { success?: string; failure?: string; pending?: string };
  auto_return?: 'approved' | 'all';
  notification_url?: string;
  statement_descriptor?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface MercadoPagoPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  external_reference?: string;
  date_created?: string;
}

export interface MercadoPagoPaymentResponse {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount: number;
  currency_id: string;
  payment_method_id?: string;
  payment_type_id?: string;
  date_approved?: string | null;
  date_created?: string;
  payer?: { email?: string; first_name?: string; last_name?: string };
  metadata?: Record<string, unknown>;
}

export interface MercadoPagoUserResponse {
  id: number;
  nickname?: string;
  email?: string;
  site_id?: string;
  country_id?: string;
}

export class MercadoPagoApiError extends Error {
  public readonly status: number;
  public readonly body: string;
  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = 'MercadoPagoApiError';
    this.status = status;
    this.body = body;
  }
}

async function mpFetch<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${MP_BASE_URL}${path}`, { ...init, headers });
  const text = await response.text();
  if (!response.ok) {
    throw new MercadoPagoApiError(
      `MercadoPago request failed (${response.status})`,
      response.status,
      text,
    );
  }
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

export async function testCredentials(accessToken: string): Promise<MercadoPagoUserResponse> {
  return mpFetch<MercadoPagoUserResponse>(accessToken, '/users/me', { method: 'GET' });
}

export async function createPreference(
  accessToken: string,
  payload: MercadoPagoPreferencePayload,
): Promise<MercadoPagoPreferenceResponse> {
  return mpFetch<MercadoPagoPreferenceResponse>(accessToken, '/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPayment(
  accessToken: string,
  paymentId: string | number,
): Promise<MercadoPagoPaymentResponse> {
  return mpFetch<MercadoPagoPaymentResponse>(accessToken, `/v1/payments/${paymentId}`, {
    method: 'GET',
  });
}

/**
 * Verifies the HMAC-SHA256 signature MercadoPago sends with each webhook.
 *
 * Signature header format: `ts=<unix-ts>,v1=<hex-digest>`
 * Manifest signed: `id:<dataId>;request-id:<x-request-id>;ts:<ts>;`
 *
 * @returns true when the digest matches and the timestamp is fresh.
 */
export async function verifyWebhookSignature(
  secret: string,
  signatureHeader: string | null,
  requestId: string | null,
  dataId: string | null,
  options: { maxSkewSeconds?: number } = {},
): Promise<boolean> {
  if (!secret || !signatureHeader || !dataId) return false;

  const parts: Record<string, string> = {};
  for (const segment of signatureHeader.split(',')) {
    const [rawKey, ...rest] = segment.split('=');
    if (!rawKey || rest.length === 0) continue;
    parts[rawKey.trim()] = rest.join('=').trim();
  }

  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) return false;

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;
  const skew = options.maxSkewSeconds ?? 5 * 60;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - tsNum) > skew) return false;

  const manifest = `id:${dataId};request-id:${requestId ?? ''};ts:${ts};`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(manifest));
  const computed = bufferToHex(signatureBuffer);
  return constantTimeEqual(computed, v1.toLowerCase());
}

function bufferToHex(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer);
  let out = '';
  for (let i = 0; i < view.length; i += 1) {
    out += view[i].toString(16).padStart(2, '0');
  }
  return out;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Mask secret keeping last 4 characters visible for the admin UI. */
export function maskSecret(secret: string | undefined | null): string {
  if (!secret) return '';
  if (secret.length <= 4) return '****';
  return `${'*'.repeat(Math.max(4, secret.length - 4))}${secret.slice(-4)}`;
}

/**
 * Returns true only when the stored config has every field required to
 * accept payments. Used both server-side (gatekeeping payments) and
 * client-side (driving UI badges).
 */
export function isMercadoPagoConfigComplete(config: Partial<MercadoPagoConfigStored> | null | undefined): boolean {
  if (!config) return false;
  const emailOk = typeof config.accountEmail === 'string'
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.accountEmail);
  const tokenOk = typeof config.accessToken === 'string' && config.accessToken.trim().length >= 10;
  const publicKeyOk = typeof config.publicKey === 'string' && config.publicKey.trim().length >= 10;
  const secretOk = typeof config.webhookSecret === 'string' && config.webhookSecret.trim().length >= 8;
  const currencyOk = typeof config.currency === 'string' && config.currency.trim().length >= 3;
  const amountOk = typeof config.defaultAmount === 'number' && config.defaultAmount > 0;
  return Boolean(emailOk && tokenOk && publicKeyOk && secretOk && currencyOk && amountOk);
}

/**
 * Returns true when the system should accept new MercadoPago checkouts.
 * Requires both `enabled` flag and a complete config.
 */
export function isMercadoPagoActive(config: Partial<MercadoPagoConfigStored> | null | undefined): boolean {
  return Boolean(config?.enabled) && isMercadoPagoConfigComplete(config);
}

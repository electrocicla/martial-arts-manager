import type { Env } from '../types/index';
import { getRequestedOrganizationId } from './organizations';
import { rateLimitResponse } from './rate-limit';

export type AuthAction = 'login' | 'register';
const MINUTE = 60_000;
const POLICIES = {
  login: { ip: 10, account: 25, accountWindow: 15 * MINUTE },
  register: { ip: 5, account: 5, accountWindow: 60 * MINUTE },
} as const;

// A single atomic statement enforces the limit across isolates and concurrent
// requests. Once exhausted, do not continue incrementing the durable counter.
export const RESERVE_AUTH_QUOTA_SQL = `INSERT INTO auth_rate_limits (bucket, window_end, attempts)
VALUES (?, ?, 1)
ON CONFLICT(bucket) DO UPDATE SET
  attempts = CASE WHEN auth_rate_limits.window_end <= ? THEN 1 ELSE auth_rate_limits.attempts + 1 END,
  window_end = CASE WHEN auth_rate_limits.window_end <= ? THEN excluded.window_end ELSE auth_rate_limits.window_end END
WHERE auth_rate_limits.window_end <= ? OR auth_rate_limits.attempts < ?
RETURNING attempts, window_end`;

const CLEANUP_SQL = `DELETE FROM auth_rate_limits WHERE bucket IN (
  SELECT bucket FROM auth_rate_limits WHERE window_end <= ? ORDER BY window_end LIMIT 32
)`;

function unavailable(): Response {
  return Response.json({ error: 'Authentication temporarily unavailable' }, {
    status: 503, headers: { 'Cache-Control': 'no-store' },
  });
}

async function fingerprint(key: CryptoKey, value: string): Promise<string> {
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function reserve(
  env: Env, bucket: string, limit: number, duration: number, now: number, cleanup: boolean,
): Promise<boolean> {
  const end = now + duration;
  const stmt = env.DB.prepare(RESERVE_AUTH_QUOTA_SQL).bind(bucket, end, now, now, now, limit);
  const statements = cleanup ? [env.DB.prepare(CLEANUP_SQL).bind(now), stmt] : [stmt];
  const results = await env.DB.batch<{ attempts: number; window_end: number }>(statements);
  if (results.length !== statements.length || results.some((result) => result.success !== true)) {
    throw new Error('Auth quota reservation failed');
  }
  const reservation = results[results.length - 1].results;
  if (!Array.isArray(reservation)) throw new Error('Auth quota result missing');
  if (reservation.length === 0) return false;
  if (reservation.length !== 1 || !Number.isSafeInteger(reservation[0].attempts) ||
      reservation[0].attempts < 1 || reservation[0].attempts > limit ||
      !Number.isSafeInteger(reservation[0].window_end) || reservation[0].window_end <= now) {
    throw new Error('Invalid auth quota result');
  }
  return true;
}

/** Compensating abuse control for BOTH browser and legacy Native transports.
 * Only Cloudflare's connecting IP is trusted; spoofable forwarding headers
 * cannot select a fresh quota. Never store raw email addresses or IPs.
 * A failed D1 reservation must not fall through to password verification.
 */
export async function reserveAuthRateLimit(
  env: Env, request: Request, action: AuthAction, email: unknown, now = Date.now(),
): Promise<Response | null> {
  try {
    if (!env.JWT_SECRET?.trim()) return unavailable();
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const ip = request.headers.get('CF-Connecting-IP')?.trim() || 'unidentified';
    const policy = POLICIES[action];
    const ipBucket = await fingerprint(key, JSON.stringify(['auth-rate-v1', action, 'ip', ip]));
    if (!(await reserve(env, ipBucket, policy.ip, MINUTE, now, true))) {
      return rateLimitResponse(MINUTE);
    }
    const organization = getRequestedOrganizationId(request);
    if (organization !== 'hamarr' && organization !== 'manzur') {
      return Response.json({ error: 'Invalid organization' }, { status: 400 });
    }
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalizedEmail || normalizedEmail.length > 254) return null;
    const accountBucket = await fingerprint(key,
      JSON.stringify(['auth-rate-v1', action, 'account', organization, normalizedEmail]));
    if (!(await reserve(env, accountBucket, policy.account, policy.accountWindow, now, false))) {
      return rateLimitResponse(policy.accountWindow);
    }
    return null;
  } catch {
    return unavailable();
  }
}

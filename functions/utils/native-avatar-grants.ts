import { Buffer } from 'node:buffer';
import type { Env } from '../types/index';
import { verifyJWT } from './jwt';
import { isNativeAuthRequest } from '../middleware/auth';
import { getRequestedOrganizationId } from './organizations';
import { normalizeAvatarUrl } from './avatar';

const LEGACY_HOSTS = new Set(['hamarr.cl', 'www.hamarr.cl']);
const MAX_SECONDS = 600;
const GRANT_PARAM = 'imageGrant';

export interface NativeAvatarGrant {
  readonly v: 1;
  readonly sub: string;
  readonly organization: 'hamarr' | 'manzur';
  readonly key: string;
  readonly host: string;
  readonly exp: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeKey(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 1024 &&
    /^avatars\/[a-zA-Z0-9_-]+\//.test(value) && !value.includes('..') && !value.includes('\\');
}

function proxyKey(value: string): string | null {
  const normalized = normalizeAvatarUrl(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized, 'https://hamarr.cl');
    if (!LEGACY_HOSTS.has(url.hostname) || url.pathname !== '/api/avatars') return null;
    const candidate = url.searchParams.get('key');
    return safeKey(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

/** Strip a presentation-only capability before a legacy client echoes a URL
 * back in a student edit. Persistent R2 references never carry grants. */
export function canonicalAvatarReference(value: string): string {
  const key = proxyKey(value);
  return key ? '/api/avatars?key=' + encodeURIComponent(key) : value;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function signedInput(encoded: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode('native-avatar-read-v1.' + encoded);
}

async function signGrant(grant: NativeAvatarGrant, key: CryptoKey): Promise<string> {
  const encoded = Buffer.from(JSON.stringify(grant), 'utf8').toString('base64url');
  const signature = await crypto.subtle.sign('HMAC', key, signedInput(encoded));
  return encoded + '.' + Buffer.from(signature).toString('base64url');
}

/** An image grant is not a login/access/refresh token. It is a read-only
 * capability for one key on the existing Native API host. Actual membership,
 * role, branch and current D1/R2 ownership are still checked on every read. */
export async function readNativeAvatarGrant(
  request: Request, env: Env, objectKey: string, now = Math.floor(Date.now() / 1000),
): Promise<NativeAvatarGrant | null> {
  try {
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.pathname !== '/api/avatars' ||
        !LEGACY_HOSTS.has(url.hostname) || env.SITE_ORGANIZATION_ID === 'manzur' ||
        !env.JWT_SECRET?.trim() || !safeKey(objectKey)) return null;
    const raw = url.searchParams.get(GRANT_PARAM);
    if (!raw || raw.length > 4096 || url.searchParams.getAll(GRANT_PARAM).length !== 1) return null;
    const parts = raw.split('.');
    if (parts.length !== 2 || parts.some((part) => !/^[a-zA-Z0-9_-]+$/.test(part))) return null;
    const [encoded, signature] = parts;
    if (!await crypto.subtle.verify('HMAC', await hmacKey(env.JWT_SECRET),
      Buffer.from(signature, 'base64url'), signedInput(encoded))) return null;
    const claims: unknown = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!isRecord(claims) || claims.v !== 1 || typeof claims.sub !== 'string' || !claims.sub ||
        (claims.organization !== 'hamarr' && claims.organization !== 'manzur') ||
        claims.key !== objectKey || claims.host !== url.hostname ||
        typeof claims.exp !== 'number' || !Number.isSafeInteger(claims.exp) ||
        claims.exp <= now || claims.exp > now + MAX_SECONDS) return null;
    const requested = request.headers.get('X-Organization-ID');
    if (requested !== null && requested !== claims.organization) return null;
    return { v: 1, sub: claims.sub, organization: claims.organization, key: objectKey,
      host: url.hostname, exp: claims.exp };
  } catch {
    return null;
  }
}

async function signResponseAvatars(
  value: unknown, grantFor: (key: string) => Promise<string>,
): Promise<unknown> {
  if (Array.isArray(value)) return Promise.all(value.map((item) => signResponseAvatars(item, grantFor)));
  if (!isRecord(value)) return value;
  const entries = await Promise.all(Object.entries(value).map(async ([field, item]) => {
    if ((field === 'avatar_url' || field === 'avatarUrl') && typeof item === 'string') {
      const key = proxyKey(item);
      if (key) return [field, await grantFor(key)] as const;
    }
    return [field, await signResponseAvatars(item, grantFor)] as const;
  }));
  return Object.fromEntries(entries);
}

/** Only authenticated successful Native JSON replies may carry a grant.
 * Native's existing Image source can load the resulting URI as-is. Browser
 * responses retain their HttpOnly cookie / Bearer authorization path. */
export async function attachNativeAvatarGrants(
  request: Request, env: Env, response: Response,
  now = Math.floor(Date.now() / 1000),
): Promise<Response> {
  const url = new URL(request.url);
  if (!response.ok || !url.pathname.startsWith('/api/') || !LEGACY_HOSTS.has(url.hostname) ||
      env.SITE_ORGANIZATION_ID === 'manzur' || !isNativeAuthRequest(request) ||
      !env.JWT_SECRET?.trim() || !response.headers.get('Content-Type')?.includes('application/json')) return response;
  // Only the server-produced login/refresh responses are trusted to supply an
  // access token in JSON; all other handlers require an existing Bearer.
  const tokenIssuance = request.method === 'POST' &&
    (url.pathname === '/api/auth/login' || url.pathname === '/api/auth/refresh');
  const authorization = request.headers.get('Authorization');
  if (!tokenIssuance && !authorization?.startsWith('Bearer ')) return response;
  const bodyText = await response.clone().text();
  if (!bodyText.includes('"avatar_url"') && !bodyText.includes('"avatarUrl"')) return response;
  const body: unknown = JSON.parse(bodyText);
  const token = tokenIssuance && isRecord(body) && typeof body.accessToken === 'string'
    ? body.accessToken : authorization?.slice(7);
  if (!token) return response;
  const claims = await verifyJWT(token, env.JWT_SECRET);
  if (claims?.token_use !== 'access' ||
      (claims.organization_id !== 'hamarr' && claims.organization_id !== 'manzur') ||
      claims.organization_id !== getRequestedOrganizationId(request)) return response;
  const organization = claims.organization_id;
  const exp = Math.min(claims.exp, now + MAX_SECONDS);
  if (exp <= now) return response;
  const signingKey = await hmacKey(env.JWT_SECRET);
  const signed = new Map<string, Promise<string>>();
  const grantFor = (key: string): Promise<string> => {
    const cached = signed.get(key);
    if (cached) return cached;
    const pending = signGrant({ v: 1, sub: claims.sub, organization, key, host: url.hostname, exp }, signingKey)
      .then((grant) => '/api/avatars?key=' + encodeURIComponent(key) + '&' + GRANT_PARAM + '=' + encodeURIComponent(grant));
    signed.set(key, pending);
    return pending;
  };
  const decorated = await signResponseAvatars(body, grantFor);
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.delete('Content-Length');
  return new Response(JSON.stringify(decorated), { status: response.status, statusText: response.statusText, headers });
}

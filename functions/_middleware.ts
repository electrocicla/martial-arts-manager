import { Env } from './types/index';

const INTERNAL_SERVER_ERROR_MESSAGE = 'Internal server error';

interface MiddlewareContext {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}

interface InternalErrorBody {
  error: typeof INTERNAL_SERVER_ERROR_MESSAGE;
  requestId: string;
}

function createCspNonce(): string {
  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = '';

  for (const byte of nonceBytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function injectNonceIntoHtml(html: string, nonce: string): string {
  const htmlWithScriptNonces = html.replace(/<script\b(?![^>]*\bnonce=)/g, `<script nonce="${nonce}"`);

  if (htmlWithScriptNonces.includes('meta name="csp-nonce"')) {
    return htmlWithScriptNonces;
  }

  return htmlWithScriptNonces.replace(
    '</head>',
    `    <meta name="csp-nonce" content="${nonce}" />\n  </head>`
  );
}

function createInternalErrorBody(requestId: string): InternalErrorBody {
  return {
    error: INTERNAL_SERVER_ERROR_MESSAGE,
    requestId,
  };
}

function sanitizeServerError(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  headers.delete('Content-Length');

  return new Response(JSON.stringify(createInternalErrorBody(requestId)), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function createUnhandledErrorResponse(requestId: string): Response {
  return new Response(JSON.stringify(createInternalErrorBody(requestId)), {
    status: 500,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function applySecurityHeaders(headers: Headers, nonce: string | null, requestId: string): void {
  headers.set('X-Request-ID', requestId);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=(), xr-spatial-tracking=(self "https://challenges.cloudflare.com")'
  );
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      nonce
        ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://static.cloudflareinsights.com https://challenges.cloudflare.com`
        : "script-src 'self' https://static.cloudflareinsights.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https:",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "frame-src 'self' https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ].join('; ')
  );
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
}

function logServerFailure(request: Request, response: Response, requestId: string): void {
  const url = new URL(request.url);
  console.error(
    `[HTTP ${requestId}] ${request.method} ${url.pathname} returned ${response.status}`
  );
}

/**
 * Global Cloudflare Pages Functions security boundary.
 *
 * Responsibilities:
 * - prevent raw 5xx handler errors from leaking implementation/database details;
 * - convert uncaught handler failures into a stable JSON error envelope;
 * - attach a correlation identifier for operational debugging;
 * - enforce browser security headers and per-response CSP nonces.
 */
export async function onRequest(context: MiddlewareContext): Promise<Response> {
  const requestId = crypto.randomUUID();
  let response: Response;

  try {
    response = await context.next();
  } catch (error: unknown) {
    const url = new URL(context.request.url);
    console.error(
      `[HTTP ${requestId}] Unhandled error for ${context.request.method} ${url.pathname}`,
      error
    );
    response = createUnhandledErrorResponse(requestId);
  }

  if (response.status >= 500) {
    logServerFailure(context.request, response, requestId);
    response = sanitizeServerError(response, requestId);
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  const isHtmlResponse = contentType.includes('text/html');
  const nonce = isHtmlResponse ? createCspNonce() : null;
  const responseBody = isHtmlResponse && nonce
    ? injectNonceIntoHtml(await response.text(), nonce)
    : response.body;

  const headers = new Headers(response.headers);
  headers.delete('Content-Length');
  applySecurityHeaders(headers, nonce, requestId);

  return new Response(responseBody, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

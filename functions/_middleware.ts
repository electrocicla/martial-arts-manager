import { Env } from './types/index';

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

/**
 * Middleware for Cloudflare Pages Functions
 * 
 * The tarpit system has been removed due to incompatibility with Cloudflare Workers.
 * setTimeout doesn't work as expected in the Workers runtime, causing worker exceptions.
 * 
 * This middleware now simply passes through all requests to the next handler.
 */

export async function onRequest(context: { request: Request; env: Env; next: () => Promise<Response> }): Promise<Response> {
  const response = await context.next();
  const contentType = response.headers.get('Content-Type') || '';
  const isHtmlResponse = contentType.includes('text/html');
  const nonce = isHtmlResponse ? createCspNonce() : null;
  const responseBody = isHtmlResponse && nonce
    ? injectNonceIntoHtml(await response.text(), nonce)
    : response.body;

  // Add security headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('X-Frame-Options', 'DENY');
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  newHeaders.set(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=(), xr-spatial-tracking=(self "https://challenges.cloudflare.com")'
  );
  // Content Security Policy — strict by default, allows only self-hosted assets, Cloudflare R2 avatars, inline styles (Tailwind/DaisyUI), and data: images.
  newHeaders.set(
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
  newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
  newHeaders.set('Cross-Origin-Resource-Policy', 'same-origin');

  // Return new response with added headers
  return new Response(responseBody, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

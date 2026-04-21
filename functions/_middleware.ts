import { Env } from './types/index';

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

  // Add security headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('X-Frame-Options', 'DENY');
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  newHeaders.set(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()'
  );
  // Content Security Policy — strict by default, allows only self-hosted assets, Cloudflare R2 avatars, inline styles (Tailwind/DaisyUI), and data: images.
  newHeaders.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
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
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

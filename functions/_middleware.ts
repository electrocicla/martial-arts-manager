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
  newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Return new response with added headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

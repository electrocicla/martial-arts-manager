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
  // Pass through to the next handler
  return await context.next();
}

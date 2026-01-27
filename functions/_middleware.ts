import { Env } from './types/index';

/**
 * Middleware for Cloudflare Pages Functions
 * 
 * The tarpit system has been removed due to incompatibility with Cloudflare Workers.
 * setTimeout doesn't work as expected in the Workers runtime, causing worker exceptions.
 * 
 * This middleware now simply passes through all requests to the next handler.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function onRequest(request: Request, env: Env): Promise<Response | undefined> {
  // Pass through to the next handler
  return undefined;
}

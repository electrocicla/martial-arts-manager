import { Env } from '../types/index';

function getKeyFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) return null;

  // Basic sanity: only allow our avatars prefix
  if (!key.startsWith('avatars/')) return null;

  return key;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const key = getKeyFromRequest(request);
    if (!key) {
      return new Response(JSON.stringify({ error: 'Invalid key' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const object = await env.AVATARS.get(key);
    if (!object) {
      return new Response('Not found', { status: 404 });
    }

    const contentType = object.httpMetadata?.contentType || 'application/octet-stream';

    return new Response(object.body ?? (await object.arrayBuffer()), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache aggressively; avatar URLs are unique per upload (timestamped)
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': object.httpEtag,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

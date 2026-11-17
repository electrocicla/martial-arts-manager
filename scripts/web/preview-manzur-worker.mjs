/** Preview-only Pages worker: no access to shared D1/R2 or real API handlers. */
const securityHeaders = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Manzur-Preview': 'visual-only',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'; worker-src 'none'; form-action 'none'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
};

function restrictedResponse(status) {
  return new Response(JSON.stringify({ error: 'Manzur visual preview: backend disabled' }), {
    status, headers: { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (/^\/api(?:\/|$)/i.test(url.pathname)) return restrictedResponse(503);
    if (request.method !== 'GET' && request.method !== 'HEAD') return restrictedResponse(405);
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(securityHeaders)) headers.set(key, value);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};

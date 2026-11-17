import { describe, it, expect, vi } from 'vitest';
import worker from './preview-manzur-worker.mjs';
describe('Manzur preview isolation', () => {
  it.each(['/api', '/api/auth/login', '/api/students', '/api/payments/mercadopago/webhook', '/API/avatars'])(
    'denies API %s before fetching assets', async (path) => {
      const fetch = vi.fn();
      const response = await worker.fetch(new Request('https://preview.example' + path), { ASSETS: { fetch } });
      expect(response.status).toBe(503);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(fetch).not.toHaveBeenCalled();
    },
  );
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('denies %s on public paths', async (method) => {
    const fetch = vi.fn();
    const response = await worker.fetch(new Request('https://preview.example/', { method }), { ASSETS: { fetch } });
    expect(response.status).toBe(405);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('serves assets with restrictive privacy headers', async () => {
    const request = new Request('https://preview.example/');
    const fetch = vi.fn(async () => new Response('Manzur', { headers: { 'Content-Type': 'text/html' } }));
    const response = await worker.fetch(request, { ASSETS: { fetch } });
    expect(fetch).toHaveBeenCalledWith(request);
    expect(response.headers.get('X-Manzur-Preview')).toBe('visual-only');
    expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
    expect(response.headers.get('Content-Security-Policy')).toContain("connect-src 'none'");
    expect(response.headers.get('Content-Security-Policy')).toContain("form-action 'none'");
    expect(await response.text()).toBe('Manzur');
  });
});

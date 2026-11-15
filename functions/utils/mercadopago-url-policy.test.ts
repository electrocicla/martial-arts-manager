import { describe, expect, it } from 'vitest';
import { resolveMercadoPagoUrls } from './mercadopago-url-policy';

describe('MercadoPago per-academy callback policy', () => {
  it('defaults to trusted Hamarr origins', () => {
    const urls = resolveMercadoPagoUrls('hamarr', {}, {});
    expect(urls.successUrl).toBe('https://hamarr.cl/payments?mp=success');
    expect(urls.notificationUrl).toBe('https://hamarr.cl/api/payments/mercadopago/webhook');
  });

  it('uses Manzur Pages host even when Native routes through Hamarr API', () => {
    const urls = resolveMercadoPagoUrls('manzur', {}, {});
    expect(urls.successUrl).toBe('https://manzurbros.pages.dev/payments?mp=success');
    expect(urls.notificationUrl).toBe('https://manzurbros.pages.dev/api/payments/mercadopago/webhook');
  });

  it('permits explicit tenant-owned URL and future Manzur domain', () => {
    const urls = resolveMercadoPagoUrls('manzur',
      { successUrl: 'https://www.manzurbros.cl/payments?mp=success' }, {});
    expect(urls.successUrl).toBe('https://www.manzurbros.cl/payments?mp=success');
  });

  it('rejects cross-tenant redirect URLs and malicious schemes', () => {
    for (const url of [
      'https://hamarr.cl/payments', 'http://manzurbros.pages.dev/payments',
      'https://manzurbros.pages.dev.evil.example/payments',
      'javascript:alert(1)', 'https://user:password@manzurbros.pages.dev/payments',
      'https://manzurbros.pages.dev:8443/payments',
      'https://manzurbros.pages.dev/api/auth/refresh',
    ]) {
      expect(() => resolveMercadoPagoUrls('manzur', { successUrl: url }, {})).toThrow();
    }
  });

  it('rejects cross-tenant persisted configuration and arbitrary webhook destinations', () => {
    expect(() => resolveMercadoPagoUrls('manzur', {},
      { notificationUrl: 'https://hamarr.cl/api/payments/mercadopago/webhook' })).toThrow();
    expect(() => resolveMercadoPagoUrls('manzur', {},
      { notificationUrl: 'https://manzurbros.pages.dev/api/payments/mercadopago/webhook?redirect=1' })).toThrow();
    expect(() => resolveMercadoPagoUrls('hamarr', {},
      { failureUrl: 'https://other.example/payments' })).toThrow();
  });

  it('fails closed for an unknown academy', () => {
    expect(() => resolveMercadoPagoUrls('unknown', {}, {})).toThrow();
  });
});

import { describe, expect, it } from 'vitest';
import { resolveMercadoPagoCheckout } from './mercadopago-price-policy';

describe('MercadoPago server-side checkout price and type policy', () => {
  const baseline = { role: 'student', isPlatformAdmin: false, defaultAmount: 30000 };
  it('enforces the configured membership price for students even with submitted body.amount', () => {
    expect(resolveMercadoPagoCheckout({ ...baseline, requestedType: 'monthly', requestedAmount: 1 }))
      .toMatchObject({ ok: false, status: 403 });
    expect(resolveMercadoPagoCheckout({ ...baseline, requestedType: 'monthly', requestedAmount: 30000 }))
      .toEqual({ ok: true, type: 'monthly', amount: 30000, overridden: false });
    expect(resolveMercadoPagoCheckout({ ...baseline }))
      .toEqual({ ok: true, type: 'monthly', amount: 30000, overridden: false });
  });

  it('denies underpriced or unpriced custom charge categories to non-admins', () => {
    expect(resolveMercadoPagoCheckout({ ...baseline, requestedType: 'equipment', requestedAmount: 1 }))
      .toMatchObject({ ok: false, status: 403 });
    expect(resolveMercadoPagoCheckout({ ...baseline, role: 'instructor', requestedAmount: 20 }))
      .toMatchObject({ ok: false, status: 403 });
  });

  it('allows explicitly authorized admin custom amounts while rejecting malformed money and types', () => {
    expect(resolveMercadoPagoCheckout({ ...baseline, role: 'admin', requestedType: 'private', requestedAmount: 15000 }))
      .toEqual({ ok: true, type: 'private', amount: 15000, overridden: true });
    expect(resolveMercadoPagoCheckout({ ...baseline, requestedType: 'hack' }))
      .toMatchObject({ ok: false, status: 400 });
    expect(resolveMercadoPagoCheckout({ ...baseline, role: 'admin', requestedAmount: Infinity }))
      .toMatchObject({ ok: false, status: 400 });
    expect(resolveMercadoPagoCheckout({ ...baseline, role: 'admin', requestedAmount: 1.001 }))
      .toMatchObject({ ok: false, status: 400 });
  });

  it('rejects unsupported roles and non-finite server configurations', () => {
    expect(resolveMercadoPagoCheckout({ ...baseline, role: 'viewer' }))
      .toMatchObject({ ok: false, status: 403 });
    expect(resolveMercadoPagoCheckout({ ...baseline, defaultAmount: NaN }))
      .toMatchObject({ ok: false, status: 409 });
  });
});

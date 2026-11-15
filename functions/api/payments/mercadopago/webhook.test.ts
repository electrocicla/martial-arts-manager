import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../../types/index';
import type { MercadoPagoPaymentResponse } from '../../../utils/mercadopago';

const mp = vi.hoisted(() => ({
  verifyWebhookSignature: vi.fn(),
  getPayment: vi.fn(),
}));
vi.mock('../../../utils/mercadopago', () => ({
  MercadoPagoApiError: class MercadoPagoApiError extends Error {
    constructor(public readonly status: number) { super('Provider error'); }
  },
  isMercadoPagoActive: () => true,
  verifyWebhookSignature: mp.verifyWebhookSignature,
  getPayment: mp.getPayment,
}));
import { onRequestPost } from './webhook';

const base: MercadoPagoPaymentResponse = {
  id: 123, status: 'approved', external_reference: 'ref-local-1',
  transaction_amount: 30000, currency_id: 'CLP',
  metadata: {
    organization_id: 'manzur', branch_id: 'branch-m', student_id: 'student-m',
    payment_id: 'local-1', type: 'monthly',
  },
};

function mockEnv(branches: Array<[string, string]> = [['manzur', 'branch-m']]) {
  const configs = branches.map(([organization_id, branch_id]) => ({
    organization_id, branch_id,
    value: JSON.stringify({ enabled: true, accessToken: 'shared', webhookSecret: 'shared', currency: 'CLP' }),
  }));
  const updates: Array<{ sql: string; values: unknown[] }> = [];
  let permitUpdate = true;
  const prepare = vi.fn((sql: string) => {
    if (sql.includes('FROM settings s')) return {
      bind: () => ({ all: async () => ({ results: configs }) }),
    };
    if (sql.includes('UPDATE payments SET')) return {
      bind: (...values: unknown[]) => ({
        first: async () => {
          updates.push({ sql, values });
          return permitUpdate ? { id: 'local-1' } : null;
        },
      }),
    };
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const env = { DB: { prepare } } as unknown as Env;
  return { env, updates, prepare, rejectUpdate: () => { permitUpdate = false; } };
}

function request() {
  return new Request('https://manzurbros.pages.dev/api/payments/mercadopago/webhook?data.id=123&type=payment', {
    method: 'POST', headers: { 'x-signature': 'signed', 'x-request-id': 'req-id' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mp.getPayment.mockResolvedValue(base);
  mp.verifyWebhookSignature.mockResolvedValue(true);
});

describe('MercadoPago shared D1/R2 tenant-safe webhook settlement', () => {
  it('rejects invalid signatures without fetching payment or updating D1', async () => {
    mp.verifyWebhookSignature.mockResolvedValue(false);
    const { env, updates } = mockEnv();
    expect((await onRequestPost({ env, request: request() })).status).toBe(401);
    expect(mp.getPayment).not.toHaveBeenCalled();
    expect(updates).toHaveLength(0);
  });

  it('binds one signed shared merchant event to exactly its metadata branch and tenant', async () => {
    const { env, updates, prepare } = mockEnv([
      ['hamarr', 'branch-h'], ['manzur', 'branch-m'],
    ]);
    const result = await onRequestPost({ env, request: request() });
    expect(result.status).toBe(200);
    expect(updates).toHaveLength(1);
    expect(updates[0].values).toContain('manzur');
    expect(updates[0].values).toContain('branch-m');
    expect(updates[0].values).toContain('local-1');
    expect(updates[0].sql).toContain('ROUND(amount, 2) = ?');
    expect(updates[0].sql).toContain('external_id IS NULL OR external_id = ?');
    expect(updates[0].sql).toContain('WHEN status = \'refunded\'');
    expect(prepare.mock.calls.every(([sql]) => !String(sql).includes('INSERT INTO payments'))).toBe(true);
  });

  it('rejects missing org/branch metadata, and ambiguous active configs', async () => {
    mp.getPayment.mockResolvedValue({ ...base, metadata: { student_id: 'student-m' } });
    const missing = mockEnv();
    expect((await onRequestPost({ env: missing.env, request: request() })).status).toBe(409);
    expect(missing.updates).toHaveLength(0);

    mp.getPayment.mockResolvedValue(base);
    const duplicate = mockEnv([['manzur', 'branch-m'], ['manzur', 'branch-m']]);
    expect((await onRequestPost({ env: duplicate.env, request: request() })).status).toBe(409);
    expect(duplicate.updates).toHaveLength(0);
  });

  it('fails closed on student/reference/price mismatch without creating a new payment', async () => {
    const { env, updates, prepare, rejectUpdate } = mockEnv();
    rejectUpdate(); // D1 bound UPDATE found no matching issued checkout.
    expect((await onRequestPost({ env, request: request() })).status).toBe(409);
    expect(updates).toHaveLength(1);
    expect(prepare.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO payments'))).toBe(false);
  });

  it('rejects a forged fetched payment identity and mismatched currency', async () => {
    mp.getPayment.mockResolvedValue({ ...base, id: 456 });
    const badId = mockEnv();
    expect((await onRequestPost({ env: badId.env, request: request() })).status).toBe(409);
    expect(badId.updates).toHaveLength(0);

    mp.getPayment.mockResolvedValue({ ...base, currency_id: 'USD' });
    const badCurrency = mockEnv();
    expect((await onRequestPost({ env: badCurrency.env, request: request() })).status).toBe(409);
    expect(badCurrency.updates).toHaveLength(0);
  });

  it('repeated signed deliveries target the same local row, never duplicate inserts', async () => {
    const { env, updates } = mockEnv();
    const [first, second] = await Promise.all([
      onRequestPost({ env, request: request() }),
      onRequestPost({ env, request: request() }),
    ]);
    expect([first.status, second.status]).toEqual([200, 200]);
    expect(updates).toHaveLength(2);
    expect(updates.every(({ sql }) => sql.startsWith('UPDATE payments SET'))).toBe(true);
  });
});

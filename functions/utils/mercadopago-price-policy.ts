/** Server-authoritative MercadoPago checkout amount policy.
 *  A client-provided amount is a proposal, never membership pricing authority.
 */
const ALLOWED_TYPES = new Set(['monthly', 'drop-in', 'private', 'equipment', 'other']);
const MAX_AMOUNT = 1_000_000_000;

export interface CheckoutPriceInput {
  role: string;
  isPlatformAdmin: boolean;
  defaultAmount: number;
  requestedAmount?: number;
  requestedType?: string;
}

export type CheckoutPriceDecision =
  | { ok: true; type: string; amount: number; overridden: boolean }
  | { ok: false; status: 400 | 403 | 409; message: string };

function validAmount(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= MAX_AMOUNT
    && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
}

export function resolveMercadoPagoCheckout(input: CheckoutPriceInput): CheckoutPriceDecision {
  if (!validAmount(input.defaultAmount)) {
    return { ok: false, status: 409, message: 'Configured payment amount is invalid' };
  }
  const type = input.requestedType ?? 'monthly';
  if (!ALLOWED_TYPES.has(type)) {
    return { ok: false, status: 400, message: 'Invalid payment type' };
  }
  const administrator = input.role === 'admin' || input.isPlatformAdmin;
  if (!administrator && input.role !== 'student' && input.role !== 'instructor') {
    return { ok: false, status: 403, message: 'Payment role is not authorized' };
  }
  if (!administrator && type !== 'monthly') {
    return { ok: false, status: 403, message: 'Custom payment type requires administrator' };
  }
  if (input.requestedAmount !== undefined && !validAmount(input.requestedAmount)) {
    return { ok: false, status: 400, message: 'Invalid payment amount' };
  }
  const requested = input.requestedAmount;
  if (!administrator && requested !== undefined
    && Math.round(requested * 100) !== Math.round(input.defaultAmount * 100)) {
    return { ok: false, status: 403, message: 'Payment amount is fixed by academy policy' };
  }
  if (administrator && type !== 'monthly' && requested === undefined) {
    return { ok: false, status: 400, message: 'Custom payment requires explicit amount' };
  }
  const amount = administrator && requested !== undefined ? requested : input.defaultAmount;
  return {
    ok: true, type, amount,
    overridden: administrator && requested !== undefined
      && Math.round(amount * 100) !== Math.round(input.defaultAmount * 100),
  };
}

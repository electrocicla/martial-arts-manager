import { Env } from '../../../types/index';
import { authenticateUser } from '../../../middleware/auth';
import { errorResponse, jsonResponse } from '../../../utils/response';
import {
  type MercadoPagoConfigStored,
  isMercadoPagoActive,
} from '../../../utils/mercadopago';

const SETTINGS_SECTION = 'mercadopago';

interface SettingsRow { value: string }

/**
 * GET /api/payments/mercadopago/status
 * Returns the public-safe MercadoPago status used by every authenticated
 * client to decide whether to render the "Pay with MercadoPago" button.
 *
 * Looks up the MercadoPago config under any admin owner (the platform is
 * single-tenant per dojo: a single admin owns the MP account).
 */
export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);

    const row = await env.DB.prepare(
      `SELECT s.value
       FROM settings s
       INNER JOIN users u ON u.id = s.owner_id
       WHERE s.section = ?
         AND u.role = 'admin'
         AND u.is_active = 1
       ORDER BY s.updated_at DESC
       LIMIT 1`,
    ).bind(SETTINGS_SECTION).first<SettingsRow>();

    if (!row) {
      return jsonResponse({ active: false });
    }

    let parsed: Partial<MercadoPagoConfigStored> | null = null;
    try { parsed = JSON.parse(row.value) as Partial<MercadoPagoConfigStored>; } catch { parsed = null; }

    if (!parsed) {
      return jsonResponse({ active: false });
    }

    const active = isMercadoPagoActive(parsed);
    return jsonResponse({
      active,
      currency: parsed.currency ?? 'CLP',
      defaultAmount: parsed.defaultAmount ?? 0,
      publicKey: active ? parsed.publicKey ?? '' : '',
    });
  } catch (error) {
    console.error('[MercadoPago Status]', error);
    return errorResponse((error as Error).message, 500);
  }
}

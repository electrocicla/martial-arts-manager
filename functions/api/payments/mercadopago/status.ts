import { Env } from '../../../types/index';
import { authenticateUser } from '../../../middleware/auth';
import { errorResponse, jsonResponse } from '../../../utils/response';
import {
  type MercadoPagoConfigStored,
  isMercadoPagoActive,
} from '../../../utils/mercadopago';
import {
  branchErrorResponse,
  resolveRequestBranchId,
} from '../../../utils/branches';

const SETTINGS_SECTION = 'mercadopago';

interface SettingsRow { value: string }

/**
 * GET /api/payments/mercadopago/status
 * Returns the public-safe MercadoPago status for the current organization/branch.
 */
export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, auth.status ?? 401);
    const branchId = await resolveRequestBranchId(request, env, auth.user);

    const row = await env.DB.prepare(
      `SELECT s.value
       FROM settings s
       WHERE s.organization_id = ?
         AND s.section = ?
         AND s.branch_id = ?
         AND (
           EXISTS (
             SELECT 1
             FROM organization_memberships om
             WHERE om.organization_id = s.organization_id
               AND om.user_id = s.owner_id
               AND om.role = 'admin'
               AND om.status = 'active'
               AND om.is_active = 1
           )
           OR EXISTS (
             SELECT 1 FROM platform_admins pa WHERE pa.user_id = s.owner_id
           )
         )
       ORDER BY s.updated_at DESC
       LIMIT 1`,
    ).bind(auth.user.organization_id, SETTINGS_SECTION, branchId).first<SettingsRow>();

    if (!row) return jsonResponse({ active: false });

    let parsed: Partial<MercadoPagoConfigStored> | null = null;
    try {
      parsed = JSON.parse(row.value) as Partial<MercadoPagoConfigStored>;
    } catch {
      parsed = null;
    }

    if (!parsed) return jsonResponse({ active: false });

    const active = isMercadoPagoActive(parsed);
    return jsonResponse({
      active,
      currency: parsed.currency ?? 'CLP',
      defaultAmount: parsed.defaultAmount ?? 0,
      publicKey: active ? parsed.publicKey ?? '' : '',
    });
  } catch (error: unknown) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;
    console.error('[MercadoPago Status]', error);
    return errorResponse('Internal server error', 500);
  }
}

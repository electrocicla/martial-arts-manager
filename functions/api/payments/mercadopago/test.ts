import { Env } from '../../../types/index';
import { authenticateUser } from '../../../middleware/auth';
import { errorResponse, jsonResponse } from '../../../utils/response';
import { MercadoPagoApiError, testCredentials } from '../../../utils/mercadopago';

interface TestBody { accessToken?: string }

/**
 * POST /api/payments/mercadopago/test
 * Validates a MercadoPago access token by calling /users/me. Admin only.
 */
export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);
    if (auth.user.role !== 'admin') return errorResponse('Admins only', 403);

    const body = (await request.json()) as TestBody;
    const accessToken = (body.accessToken ?? '').trim();
    if (!accessToken) {
      return errorResponse('accessToken is required', 400);
    }

    const user = await testCredentials(accessToken);
    return jsonResponse({
      ok: true,
      mercadopago_user_id: user.id,
      nickname: user.nickname ?? null,
      email: user.email ?? null,
      site_id: user.site_id ?? null,
    });
  } catch (error) {
    if (error instanceof MercadoPagoApiError) {
      return jsonResponse({ ok: false, error: 'Invalid MercadoPago credentials', detail: error.body }, 200);
    }
    console.error('[MercadoPago Test]', error);
    return errorResponse((error as Error).message, 500);
  }
}

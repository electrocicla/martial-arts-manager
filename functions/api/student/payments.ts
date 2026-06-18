import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';
import {
  branchErrorResponse,
  resolveRequestBranchId,
} from '../../utils/branches';

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated || !auth.user.student_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const branchId = await resolveRequestBranchId(request, env, auth.user);

    const { results } = await env.DB.prepare(
      "SELECT * FROM payments WHERE student_id = ? AND branch_id = ? AND deleted_at IS NULL ORDER BY date DESC"
    ).bind(auth.user.student_id, branchId).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

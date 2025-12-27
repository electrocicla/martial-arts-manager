import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated || !auth.user.student_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { results } = await env.DB.prepare(
      "SELECT * FROM payments WHERE student_id = ? ORDER BY date DESC"
    ).bind(auth.user.student_id).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}

interface Env {
  DB: any;
}

export async function onRequestGet({ env }: { env: Env }) {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM payments").all();
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const body = await request.json() as { id: string; studentId: string; amount: number; date: string; type: string; notes?: string };
    const { id, studentId, amount, date, type, notes } = body;
    await env.DB.prepare("INSERT INTO payments (id, student_id, amount, date, type, notes) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, studentId, amount, date, type, notes || null).run();
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
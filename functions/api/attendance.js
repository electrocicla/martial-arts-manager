export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const classId = url.searchParams.get('classId');
  if (!classId) {
    return new Response(JSON.stringify({ error: 'classId required' }), { status: 400 });
  }
  try {
    const { results } = await env.DB.prepare("SELECT * FROM attendance WHERE class_id = ?").bind(classId).all();
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { classId, studentId, attended } = body;
    await env.DB.prepare("INSERT OR REPLACE INTO attendance (id, class_id, student_id, attended) VALUES (?, ?, ?, ?)")
      .bind(`${classId}-${studentId}`, classId, studentId, attended ? 1 : 0).run();
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
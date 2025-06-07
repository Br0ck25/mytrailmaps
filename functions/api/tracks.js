export async function onRequestPost(context) {
  try {
    const tracks = await context.request.json();
    // …save tracks to KV…
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("POST /api/user/tracks error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

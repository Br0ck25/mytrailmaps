// functions/api/user/tracks.js
export async function onRequestPut(ctx) {
  try {
    const tracks = await ctx.request.json();
    // …save to KV…
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("PUT /api/user/tracks error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

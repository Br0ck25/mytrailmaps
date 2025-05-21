export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/save") {
      const id = crypto.randomUUID();
      const data = await req.text();
      await env.TRACKS_KV.put(id, data);
      return new Response(JSON.stringify({ id }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET" && url.pathname.startsWith("/load/")) {
      const id = url.pathname.split("/").pop();
      const data = await env.TRACKS_KV.get(id);
      return new Response(data, {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight OPTIONS
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method === "POST" && url.pathname === "/save") {
      const id = crypto.randomUUID();
      const data = await req.text();
      await env.TRACKS_KV.put(id, data);
      return new Response(JSON.stringify({ id }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    if (req.method === "GET" && url.pathname.startsWith("/load/")) {
      const id = url.pathname.split("/").pop();
      const data = await env.TRACKS_KV.get(id);
      if (!data) return new Response("Not found", { status: 404, headers: corsHeaders });
      return new Response(data, {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};

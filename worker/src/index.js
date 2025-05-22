export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, "");
      const method = request.method;

      console.log("🛬 Method:", method);
      console.log("🛣️ Path:", path);

      // ✅ 1. Return all user tracks
      if (method === "GET" && path === "/api/tracks") {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.split("Bearer ")[1];
        console.log("🔐 Token:", token);

        if (!token) return new Response("Unauthorized", { status: 401 });

        const userId = await getUserIdFromToken(token);
        console.log("👤 Resolved userId:", userId);

        if (!userId) return new Response("Forbidden", { status: 403 });

        const prefix = `tracks:user:${userId}:`;
        console.log("📦 Listing keys with prefix:", prefix);

        const list = await env.TRACKS_KV.list({ prefix });
        console.log("📋 Keys found:", list.keys.map(k => k.name).join(", ") || "none");

        const results = [];

        for (const key of list.keys) {
          const valueStr = await env.TRACKS_KV.get(key.name);
          try {
            const value = JSON.parse(valueStr);
            results.push({
              id: key.name.split(":").pop(),
              ...value,
            });
          } catch (err) {
            console.log("❌ JSON parse error for key:", key.name);
          }
        }

        return Response.json(results);
      }

      // ✅ 2. List all admin GPX metadata
      if (method === "GET" && path === "/api/admin-gpx-list") {
  const list = await env.TRACKS_KV.list({ prefix: "meta:admin:" });
  const results = [];

  for (const key of list.keys) {
    const meta = await env.TRACKS_KV.get(key.name, "json");
    if (meta?.slug && meta?.name) {
      results.push(meta);
    }
  }

  return Response.json(results);
}


      // ✅ 3. Serve admin GPX file (not downloadable)
      if (method === "GET" && path.startsWith("/api/admin-gpx/")) {
        const slug = path.split("/").pop();
        const file = await env.TRACKS_KV.get(`gpx:admin:${slug}.gpx`, "arrayBuffer");

        if (!file) return new Response("Not Found", { status: 404 });

        return new Response(file, {
          headers: {
            "Content-Type": "application/gpx+xml"
          }
        });
      }

      return new Response("Not Found", { status: 404 });

    } catch (err) {
      console.error("💥 Unexpected error:", err.stack || err);
      return new Response("Internal Error", { status: 500 });
    }
  }
};

// 🧪 Fake auth logic — replace later with real token decoding
async function getUserIdFromToken(token) {
  if (token === "testtoken") return "testuser";
  return null;
}

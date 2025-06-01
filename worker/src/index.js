export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, "");
      const method = request.method.toUpperCase();

      async function getUserIdFromToken(token, env) {
        const email = await env.USERS_KV.get(`token:${token}`);
        return email || null;
      }

      // SIGN UP
      if (method === "POST" && path === "/api/signup") {
        const { email, password } = await request.json().catch(() => ({}));
        if (!email || !password || typeof email !== "string" || typeof password !== "string" || password.length < 8) {
          return new Response(JSON.stringify({ error: "Invalid fields or password too short" }), { status: 400, headers: corsHeaders });
        }
        const normalizedEmail = email.trim().toLowerCase();
        if (await env.USERS_KV.get(normalizedEmail)) {
          return new Response(JSON.stringify({ error: "User already exists" }), { status: 409, headers: corsHeaders });
        }
        const hashedPassword = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password)))).map(b => b.toString(16).padStart(2, "0")).join("");
        await env.USERS_KV.put(normalizedEmail, JSON.stringify({ email: normalizedEmail, passwordHash: hashedPassword, createdAt: Date.now(), lastLogin: null, preferences: {} }));
        return new Response(JSON.stringify({ success: true }), { status: 201, headers: corsHeaders });
      }

      // SIGN IN
      if (method === "POST" && path === "/api/login") {
        const { email, password } = await request.json().catch(() => ({}));
        if (!email || !password || typeof email !== "string" || typeof password !== "string") {
          return new Response(JSON.stringify({ error: "Invalid fields" }), { status: 400, headers: corsHeaders });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = JSON.parse(await env.USERS_KV.get(normalizedEmail) || "{}");
        const hashedPassword = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password)))).map(b => b.toString(16).padStart(2, "0")).join("");
        if (hashedPassword !== user.passwordHash) {
          return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401, headers: corsHeaders });
        }
        const token = crypto.randomUUID();
        await env.USERS_KV.put(`token:${token}`, normalizedEmail, { expirationTtl: 86400 });
        return new Response(JSON.stringify({ success: true, token }), { status: 200, headers: corsHeaders });
      }

      // -------------------------------------------------------
      // 3) EXISTING TRACKS ROUTES (unchanged)
      // -------------------------------------------------------
      if (method === "GET" && path === "/api/tracks") {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.split("Bearer ")[1];
        if (!token) {
          return new Response("Unauthorized", {
            status: 401,
            headers: { "Access-Control-Allow-Origin": "*" },
          });
        }
        // For demonstration, we’ll accept “testtoken” or any dummyToken above.
        const userId = await getUserIdFromToken(token, env);
        if (!userId) {
          return new Response("Forbidden", {
            status: 403,
            headers: { "Access-Control-Allow-Origin": "*" },
          });
        }

        const prefix = `tracks:user:${userId}:`;
        const list = await env.TRACKS_KV.list({ prefix });
        const results = [];
        for (const key of list.keys) {
          const valueStr = await env.TRACKS_KV.get(key.name);
          try {
            const value = JSON.parse(valueStr);
            results.push({ id: key.name.split(":").pop(), ...value });
          } catch {
            // ignore parse errors
          }
        }
        return new Response(JSON.stringify(results), {
          headers: corsHeaders,
        });
      }

      if (method === "GET" && path === "/api/admin-gpx-list") {
        const list = await env.TRACKS_KV.list({ prefix: "meta:admin:" });
        const results = [];
        for (const key of list.keys) {
          const meta = await env.TRACKS_KV.get(key.name, "json");
          if (meta?.slug && meta?.name) {
            results.push(meta);
          }
        }
        return new Response(JSON.stringify(results), {
          headers: corsHeaders,
        });
      }

      if (method === "GET" && path.startsWith("/api/admin-gpx/")) {
        const slug = path.split("/").pop();
        const file = await env.TRACKS_KV.get(`gpx:admin:${slug}.gpx`, "arrayBuffer");
        if (!file) {
          return new Response("Not Found", {
            status: 404,
            headers: { "Access-Control-Allow-Origin": "*" },
          });
        }
        return new Response(file, {
          headers: {
            "Content-Type": "application/gpx+xml",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      if (method === "GET" && path === "/api/tracks-in-bounds") {
        const { searchParams } = new URL(request.url);
        const north = parseFloat(searchParams.get("north"));
        const south = parseFloat(searchParams.get("south"));
        const east = parseFloat(searchParams.get("east"));
        const west = parseFloat(searchParams.get("west"));
        if ([north, south, east, west].some((v) => isNaN(v))) {
          return new Response("Invalid bounds", {
            status: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
          });
        }
        const indexJSON = await env.TRACKS_KV.get("track-index");
        if (!indexJSON) {
          return new Response("No index available", {
            status: 404,
            headers: { "Access-Control-Allow-Origin": "*" },
          });
        }
        const index = JSON.parse(indexJSON);
        const matches = index.filter(
          (t) =>
            !(t.maxLat < south || t.minLat > north || t.maxLon < west || t.minLon > east)
        );
        return new Response(
          JSON.stringify(matches.map((t) => ({ slug: t.slug }))),
          { headers: corsHeaders }
        );
      }

      // 5) Serve vector tile or metadata from R2 under /tiles/*
      if (method === "GET" && path.startsWith("/tiles/")) {
        const key = path.replace(/^\/tiles\//, "tiles/");
        const tile = await env.MYTRAILMAPS.get(key, { type: "arrayBuffer" });
        if (!tile) {
          return new Response("Tile not found", {
            status: 404,
            headers: { "Access-Control-Allow-Origin": "*" },
          });
        }
        const headers = new Headers();
        headers.set("Access-Control-Allow-Origin", "*");
        if (key.endsWith(".pbf")) {
          headers.set("Content-Type", "application/x-protobuf");
          headers.set("Content-Encoding", "gzip");
        } else if (key.endsWith(".json")) {
          headers.set("Content-Type", "application/json");
        }
        return new Response(tile, { headers });
      }

      if (method === "POST" && path === "/api/delete-account") {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.split("Bearer ")[1];
  const email = await env.USERS_KV.get(`token:${token}`);
  if (!email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  // Delete account + token + any linked data
  await env.USERS_KV.delete(email);
  await env.USERS_KV.delete(`token:${token}`);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: corsHeaders,
  });
}


      // POST /upload-public-track — allow public GPX uploads and convert to GeoJSON
      if (method === "POST" && path === "/upload-public-track") {
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
          return new Response("Expected multipart/form-data", {
            status: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
          });
        }
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file || typeof file.arrayBuffer !== "function") {
          return new Response("Missing or invalid file upload", {
            status: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
          });
        }
        const gpxBuffer = await file.arrayBuffer();
        const gpxText = new TextDecoder().decode(gpxBuffer);
        try {
          const { gpx } = await import("@tmcw/togeojson");
          const { DOMParser } = await import("@xmldom/xmldom");
          const dom = new DOMParser().parseFromString(gpxText, "application/xml");
          const geojson = gpx(dom);
          const id = crypto.randomUUID();
          await env.MYTRAILMAPS.put(`public-tracks/${id}/original.gpx`, gpxText);
          await env.MYTRAILMAPS.put(
            `public-tracks/${id}/converted.geojson`,
            JSON.stringify(geojson, null, 2)
          );
          return new Response(
            JSON.stringify({
              success: true,
              id,
              geojsonUrl: `/public-tracks/${id}/converted.geojson`,
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        } catch (err) {
          console.error("❌ Failed to convert GPX:", err);
          return new Response("GPX conversion error", {
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
          });
        }
      }
// Fallback
      return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: corsHeaders });
    } catch (err) {
      console.error("💥 Unexpected error:", err.stack || err.message);
      return new Response(JSON.stringify({ error: "Internal Error" }), { status: 500, headers: corsHeaders });
    }
  },
};


// -------------------------------------------------------
// Helper to resolve userId from token (demo only). 
// In production, verify JWT or session token properly.
// -------------------------------------------------------
async function getUserIdFromToken(token, env) {
  const email = await env.USERS_KV.get(`token:${token}`);
  return email || null;
}
// ✅ Register PWA service worker for offline support
import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });

// ✅ Force page reload when a new service worker takes control
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}


// src/index.js

export default {
  async fetch(request, env) {
    // ---- Handle CORS preflight ----
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    try {
      const url = new URL(request.url);
      // Strip any trailing slashes for consistent matching:
      const path = url.pathname.replace(/\/+$/, "");
      const method = request.method.toUpperCase();

      // ---- Helper: Always return these CORS headers on JSON responses ----
      const corsHeaders = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      };

      // -------------------------------------------------------
      // 1) SIGN UP: POST /api/signup
      //    Body: { email, password, resetKey }
      // -------------------------------------------------------
      if (method === "POST" && path === "/api/signup") {
        let body;
        try {
          body = await request.json();
        } catch {
          return new Response(
            JSON.stringify({ error: "Invalid JSON" }),
            { status: 400, headers: corsHeaders }
          );
        }

        const { email, password, resetKey } = body || {};
        if (
          !email ||
          !password ||
          typeof email !== "string" ||
          typeof password !== "string" ||
          typeof resetKey !== "string"
        ) {
          return new Response(
            JSON.stringify({ error: "Missing or invalid fields" }),
            { status: 400, headers: corsHeaders }
          );
        }

        // === Example resetKey check ===
        // Replace with your own logic (e.g., verify against a KV or DB of valid keys).
        // Here, we simply require a hardcoded key "MYRESETKEY" for demonstration.
        if (resetKey.trim() !== "MYRESETKEY") {
          return new Response(
            JSON.stringify({ error: "Invalid reset key" }),
            { status: 403, headers: corsHeaders }
          );
        }

        // Normalize email to lowercase
        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const existing = await env.USERS_KV.get(normalizedEmail);
        if (existing) {
          return new Response(
            JSON.stringify({ error: "User already exists" }),
            { status: 409, headers: corsHeaders }
          );
        }

        // Hash the password using SHA-256 (for demonstration only)
        // In production, you might use bcrypt, Argon2, or similar.
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedPassword = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        // Create a user object
        const userObj = {
          email: normalizedEmail,
          passwordHash: hashedPassword,
          createdAt: Date.now(),
        };

        // Store user in KV under key = normalizedEmail
        await env.USERS_KV.put(
          normalizedEmail,
          JSON.stringify(userObj)
        );

        return new Response(
          JSON.stringify({ success: true, message: "User created" }),
          { status: 201, headers: corsHeaders }
        );
      }

      // -------------------------------------------------------
      // 2) SIGN IN: POST /api/login
      //    Body: { email, password }
      // -------------------------------------------------------
      if (method === "POST" && path === "/api/login") {
        let body;
        try {
          body = await request.json();
        } catch {
          return new Response(
            JSON.stringify({ error: "Invalid JSON" }),
            { status: 400, headers: corsHeaders }
          );
        }

        const { email, password } = body || {};
        if (
          !email ||
          !password ||
          typeof email !== "string" ||
          typeof password !== "string"
        ) {
          return new Response(
            JSON.stringify({ error: "Missing or invalid fields" }),
            { status: 400, headers: corsHeaders }
          );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const storedValue = await env.USERS_KV.get(normalizedEmail);
        if (!storedValue) {
          return new Response(
            JSON.stringify({ error: "Invalid email or password" }),
            { status: 401, headers: corsHeaders }
          );
        }

        let userObj;
        try {
          userObj = JSON.parse(storedValue);
        } catch {
          return new Response(
            JSON.stringify({ error: "Corrupted user data" }),
            { status: 500, headers: corsHeaders }
          );
        }

        // Recompute hash of provided password
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedPassword = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        if (hashedPassword !== userObj.passwordHash) {
          return new Response(
            JSON.stringify({ error: "Invalid email or password" }),
            { status: 401, headers: corsHeaders }
          );
        }

        // At this point, credentials are valid. Issue a dummy token:
        // In production, you’d sign a JWT or issue a secure session token.
        const dummyToken = crypto.randomUUID();

        // (Optional) Store token → email mapping in KV if you want to verify later.
        // await env.USERS_KV.put(`token:${dummyToken}`, normalizedEmail, { expirationTtl: 3600 });

        return new Response(
          JSON.stringify({ success: true, token: dummyToken }),
          { status: 200, headers: corsHeaders }
        );
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
        const userId = await getUserIdFromToken(token);
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

      // -------------------------------------------------------
      // FALLBACK: Not Found
      // -------------------------------------------------------
      return new Response("Not Found", {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    } catch (err) {
      console.error("💥 Unexpected error:", err.stack || err);
      return new Response("Internal Error", {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
  },
};

// -------------------------------------------------------
// Helper to resolve userId from token (demo only). 
// In production, verify JWT or session token properly.
// -------------------------------------------------------
async function getUserIdFromToken(token) {
  // If you want to allow the dummy token from login, return the email (or user ID).
  // Example: if you stored “token:<uuid> → email” in KV, lookup here. 
  // For now, we just check if it equals “testtoken” or any token you stored.
  if (token === "testtoken") return "testuser";
  // If you decide to store tokens in KV, do:
  // const email = await env.USERS_KV.get(`token:${token}`);
  // return email || null;

  return null;
}

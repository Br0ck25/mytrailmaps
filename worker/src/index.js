export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+\$/, "");
      const method = request.method;

      console.log("🛬 Method:", method);
      console.log("🛣️ Path:", path);

      if (method === "GET" && path === "/api/tracks") {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.split("Bearer ")[1];
        console.log("🔐 Token:", token);

        if (!token)
          return new Response("Unauthorized", { status: 401, headers: { "Access-Control-Allow-Origin": "*" } });

        const userId = await getUserIdFromToken(token);
        console.log("👤 Resolved userId:", userId);

        if (!userId)
          return new Response("Forbidden", { status: 403, headers: { "Access-Control-Allow-Origin": "*" } });

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

        return new Response(JSON.stringify(results), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
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
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      if (method === "GET" && path.startsWith("/api/admin-gpx/")) {
        const slug = path.split("/").pop();
        const file = await env.TRACKS_KV.get(`gpx:admin:${slug}.gpx`, "arrayBuffer");

        if (!file)
          return new Response("Not Found", { status: 404, headers: { "Access-Control-Allow-Origin": "*" } });

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

        if ([north, south, east, west].some(v => isNaN(v))) {
          return new Response("Invalid bounds", {
            status: 400,
            headers: { "Access-Control-Allow-Origin": "*" }
          });
        }

        const indexJSON = await env.TRACKS_KV.get("track-index");
        if (!indexJSON) {
          return new Response("No index available", {
            status: 404,
            headers: { "Access-Control-Allow-Origin": "*" }
          });
        }

        const index = JSON.parse(indexJSON);
        const matches = index.filter(t =>
          !(t.maxLat < south || t.minLat > north || t.maxLon < west || t.minLon > east)
        );

        return new Response(JSON.stringify(matches.map(t => ({ slug: t.slug }))), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      // 5. Serve vector tile or metadata from R2 under /tiles/*
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
    // Convert GPX → GeoJSON
    const { gpx } = await import("@tmcw/togeojson");
    const { DOMParser } = await import("@xmldom/xmldom");
    const dom = new DOMParser().parseFromString(gpxText, "application/xml");
    const geojson = gpx(dom);

    // Save to R2 under a UUID
    const id = crypto.randomUUID();
    await env.MYTRAILMAPS.put(`public-tracks/${id}/original.gpx`, gpxText);
    await env.MYTRAILMAPS.put(
      `public-tracks/${id}/converted.geojson`,
      JSON.stringify(geojson, null, 2)
    );

    return new Response(JSON.stringify({
      success: true,
      id,
      geojsonUrl: `/public-tracks/${id}/converted.geojson`
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (err) {
    console.error("❌ Failed to convert GPX:", err);
    return new Response("GPX conversion error", {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
}

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
  }
};

async function getUserIdFromToken(token) {
  if (token === "testtoken") return "testuser";
  return null;
}
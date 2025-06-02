// src/index.js

import Stripe from "stripe";

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      // CORS preflight
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Initialize Stripe client using your secret key from wrangler.toml
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2022-11-15",
    });

    try {
      const url = new URL(request.url);
      // Trim trailing slashes (so "/api/login/" and "/api/login" are the same)
      const path = url.pathname.replace(/\/+$/, "");
      const method = request.method.toUpperCase();

      // Helper: look up userEmail from token
      async function getUserIdFromToken(token, env) {
        const email = await env.USERS_KV.get(`token:${token}`);
        return email || null;
      }

      //
      // ─── 1) SIGN UP ──────────────────────────────────────────────────────────────
      //
      if (method === "POST" && path === "/api/signup") {
        const { email, password } = await request.json().catch(() => ({}));
        if (
          !email ||
          !password ||
          typeof email !== "string" ||
          typeof password !== "string" ||
          password.length < 8
        ) {
          return new Response(
            JSON.stringify({ error: "Invalid fields or password too short" }),
            { status: 400, headers: corsHeaders }
          );
        }
        const normalizedEmail = email.trim().toLowerCase();
        if (await env.USERS_KV.get(normalizedEmail)) {
          return new Response(
            JSON.stringify({ error: "User already exists" }),
            { status: 409, headers: corsHeaders }
          );
        }
        const hashedPassword = Array.from(
          new Uint8Array(
            await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(password)
            )
          )
        )
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        await env.USERS_KV.put(
          normalizedEmail,
          JSON.stringify({
            email: normalizedEmail,
            passwordHash: hashedPassword,
            createdAt: Date.now(),
            lastLogin: null,
            preferences: {},
          })
        );
        return new Response(JSON.stringify({ success: true }), {
          status: 201,
          headers: corsHeaders,
        });
      }

      //
      // ─── 2) SIGN IN ──────────────────────────────────────────────────────────────
      //
      if (method === "POST" && path === "/api/login") {
        const { email, password } = await request.json().catch(() => ({}));
        if (
          !email ||
          !password ||
          typeof email !== "string" ||
          typeof password !== "string"
        ) {
          return new Response(
            JSON.stringify({ error: "Invalid fields" }),
            { status: 400, headers: corsHeaders }
          );
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = JSON.parse(await env.USERS_KV.get(normalizedEmail) || "{}");
        const hashedPassword = Array.from(
          new Uint8Array(
            await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(password)
            )
          )
        )
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (hashedPassword !== user.passwordHash) {
          return new Response(JSON.stringify({ error: "Invalid credentials" }), {
            status: 401,
            headers: corsHeaders,
          });
        }
        // Generate a random token and store it in KV (expires in 24h)
        const token = crypto.randomUUID();
        await env.USERS_KV.put(`token:${token}`, normalizedEmail, {
          expirationTtl: 86400,
        });
        return new Response(JSON.stringify({ success: true, token }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      //
      // ─── 3) STRIPE: CREATE CHECKOUT SESSION ─────────────────────────────────────
      //
      // Frontend will POST { priceId, userEmail } to this endpoint to start a Checkout Session.
      //
      if (method === "POST" && path === "/api/create-checkout-session") {
        // Allow CORS
        // (We already have corsHeaders above)
        const body = await request.json().catch(() => ({}));
        const { priceId, userEmail } = body || {};
        if (
          !priceId ||
          !userEmail ||
          typeof priceId !== "string" ||
          typeof userEmail !== "string"
        ) {
          return new Response(
            JSON.stringify({ error: "Missing priceId or userEmail" }),
            { status: 400, headers: corsHeaders }
          );
        }

        // 1) Create or retrieve a Stripe Customer for this email
        //    Optionally you could store stripeCustomerId in KV so you don’t create multiple customers
        let customer;
        const existing = await stripe.customers.list({
          email: userEmail,
          limit: 1,
        });
        if (existing.data.length > 0) {
          customer = existing.data[0];
        } else {
          customer = await stripe.customers.create({ email: userEmail });
        }

        // 2) Create Checkout Session for a subscription
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price: priceId, // e.g. "price_1Hxyz...monthly" or "price_1Hxyz...yearly"
              quantity: 1,
            },
          ],
          customer: customer.id,
          // After success, redirect the user back to your front-end dashboard
          success_url: `${request.headers.get("origin")}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${request.headers.get("origin")}/dashboard?canceled=true`,
        });

        return new Response(JSON.stringify({ checkoutUrl: session.url }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      //
      // ─── 4) STRIPE: WEBHOOK ──────────────────────────────────────────────────────
      //
      // Stripe will POST here for events like checkout.session.completed,
      // invoice.payment_failed, customer.subscription.deleted, etc.
      //
      if (method === "POST" && path === "/api/webhook") {
        // 1) Get the raw text body so we can verify the signature
        const sig = request.headers.get("stripe-signature");
        const bodyText = await request.text();

        let event;
        try {
          event = stripe.webhooks.constructEvent(
            bodyText,
            sig,
            env.STRIPE_WEBHOOK_SECRET
          );
        } catch (err) {
          console.error("⚠️ Webhook signature verification failed:", err.message);
          return new Response(`Webhook Error: ${err.message}`, {
            status: 400,
            headers: corsHeaders,
          });
        }

        // 2) Handle only the events we care about
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object;
            const email = session.customer_details.email;
            const customerId = session.customer;
            const subscriptionId = session.subscription;

            // Retrieve the subscription to get current_period_end
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const expiresAt = subscription.current_period_end; // UNIX timestamp

            // Write to KV: key = userEmail, value = {status, expires, stripeCustomerId, subscriptionId}
            const payload = JSON.stringify({
              status: "active",
              expires: expiresAt,
              stripeCustomerId: customerId,
              subscriptionId: subscriptionId,
            });
            await env.SUBSCRIPTIONS_KV.put(email.toLowerCase(), payload);

            console.log(`✅ KV updated: ${email} is active until ${expiresAt}`);
            break;
          }

          case "invoice.payment_failed":
          case "customer.subscription.deleted":
          case "customer.subscription.unpaid": {
            const subscription = event.data.object;
            // subscription.customer is the Customer ID; fetch email from Stripe
            const customer = await stripe.customers.retrieve(subscription.customer);
            const email = customer.email;
            if (email) {
              // Mark as canceled or expired
              await env.SUBSCRIPTIONS_KV.put(
                email.toLowerCase(),
                JSON.stringify({
                  status: "canceled",
                  expires: Math.floor(Date.now() / 1000),
                })
              );
              console.log(`❌ KV updated: ${email} subscription canceled/failed.`);
            }
            break;
          }

          default:
            // Ignore other events
            console.log(`🔔 Unhandled event type ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      //
      // ─── 5) STRIPE: CHECK SUBSCRIPTION STATUS ───────────────────────────────────
      //
      // Frontend can do GET /api/subscription-status?email=… to see if user is paid or free.
      //
      if (method === "GET" && path === "/api/subscription-status") {
        const email = url.searchParams.get("email");
        if (!email) {
          return new Response(
            JSON.stringify({ error: "Missing email" }),
            { status: 400, headers: corsHeaders }
          );
        }
        const stored = await env.SUBSCRIPTIONS_KV.get(email.toLowerCase());
        if (!stored) {
          return new Response(JSON.stringify({ status: "free" }), {
            status: 200,
            headers: corsHeaders,
          });
        }
        const data = JSON.parse(stored);
        const now = Math.floor(Date.now() / 1000);
        if (data.expires < now || data.status !== "active") {
          return new Response(JSON.stringify({ status: "free" }), {
            status: 200,
            headers: corsHeaders,
          });
        }
        return new Response(
          JSON.stringify({ status: "paid", expires: data.expires }),
          { status: 200, headers: corsHeaders }
        );
      }

      //
      // ─── 6) EXISTING TRACKS ROUTES (unchanged) ─────────────────────────────────
      //
      if (method === "GET" && path === "/api/tracks") {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.split("Bearer ")[1];
        if (!token) {
          return new Response("Unauthorized", {
            status: 401,
            headers: { "Access-Control-Allow-Origin": "*" },
          });
        }
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

      //
      // ─── 7) SERVE VECTOR TILES / METADATA FROM R2 ───────────────────────────────
      //
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

      //
      // ─── 8) DELETE ACCOUNT ───────────────────────────────────────────────────────
      //
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
        // Delete account + token
        await env.USERS_KV.delete(email);
        await env.USERS_KV.delete(`token:${token}`);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      //
      // ─── 9) UPLOAD PUBLIC GPX ───────────────────────────────────────────────────
      //
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

      //
      // ─── FALLBACK ────────────────────────────────────────────────────────────────
      //
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: corsHeaders,
      });
    } catch (err) {
      console.error("💥 Unexpected error:", err.stack || err.message);
      return new Response(
        JSON.stringify({ error: "Internal Error" }),
        { status: 500, headers: corsHeaders }
      );
    }
  },
};

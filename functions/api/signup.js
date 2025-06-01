// functions/api/signup.js

/**
 * Handles POST https://<your‐pages‐domain>/api/signup
 * Expects a JSON body: { email: string, password: string }
 * Generates a one‐time resetKey (UUID) and stores it alongside the hashed password.
 * Returns { success: true, resetKey } so the user can save/email it for future password recovery.
 */

export async function onRequestOptions(context) {
  // CORS preflight
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1) Parse JSON body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
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
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 2) Normalize email and check if user already exists
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await env.USERS_KV.get(normalizedEmail);
  if (existing) {
    return new Response(
      JSON.stringify({ error: "User already exists" }),
      {
        status: 409,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 3) Hash password (SHA-256)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  let hashBuffer;
  try {
    hashBuffer = await crypto.subtle.digest("SHA-256", data);
  } catch {
    return new Response(
      JSON.stringify({ error: "Error hashing password" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordHash = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // 4) Generate a one‐time resetKey (UUID)
  const resetKey = crypto.randomUUID();

  // 5) Create user object and store in KV
  const userObj = {
    email: normalizedEmail,
    passwordHash,
    resetKey,
    createdAt: Date.now(),
  };

  try {
    await env.USERS_KV.put(normalizedEmail, JSON.stringify(userObj));
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Error saving user data" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 6) Return success + resetKey so the user can store it (or email it)
  return new Response(
    JSON.stringify({
      success: true,
      message: "User created",
      resetKey,
    }),
    {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

// 7) Reject any other HTTP methods with 405
export async function onRequestGet(context) {
  return new Response(null, {
    status: 405,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
export async function onRequestPut(context) {
  return new Response(null, {
    status: 405,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
export async function onRequestDelete(context) {
  return new Response(null, {
    status: 405,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
export async function onRequestPatch(context) {
  return new Response(null, {
    status: 405,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

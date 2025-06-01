// functions/api/login.js

/**
 * Handles POST https://<your-pages-domain>/api/login
 * Expects a JSON body { email, password }.
 * Uses USERS_KV to look up and verify the user.
 * Returns 200 + { success: true, token } if valid,
 * or an appropriate 4xx/5xx + { error: "…" } otherwise.
 */

export async function onRequestOptions(context) {
  // CORS preflight handler: allow POST from any origin
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

  // 1) Attempt to parse JSON body
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

  // 2) Normalize email and look up in KV
  const normalizedEmail = email.trim().toLowerCase();
  const storedValue = await env.USERS_KV.get(normalizedEmail);
  if (!storedValue) {
    // No user record found
    return new Response(
      JSON.stringify({ error: "Invalid email or password" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // Parse the stored JSON (should contain at least { passwordHash: "..." })
  let userObj;
  try {
    userObj = JSON.parse(storedValue);
  } catch {
    return new Response(
      JSON.stringify({ error: "Corrupted user data" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 3) Re‐hash the incoming password (SHA‐256) and compare against stored hash
  const encoder = new TextEncoder();
  const pwData = encoder.encode(password);
  let hashBuffer;
  try {
    hashBuffer = await crypto.subtle.digest("SHA-256", pwData);
  } catch {
    return new Response(
      JSON.stringify({ error: "Hashing error" }),
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
  const computedHash = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computedHash !== userObj.passwordHash) {
    // Password mismatch
    return new Response(
      JSON.stringify({ error: "Invalid email or password" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 4) Credentials valid → issue (and now store) a token
  const dummyToken = crypto.randomUUID();
  await env.USERS_KV.put(
    `token:${dummyToken}`,
    normalizedEmail,
    { expirationTtl: 3600 } // expires in 1 hour (adjust if needed)
  );

  // 5) Return the token back to the front-end
  return new Response(
    JSON.stringify({ success: true, token: dummyToken }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

// Explicitly reject any other HTTP methods with 405
export async function onRequestGet(context) {
  return new Response(null, {
    status: 405,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}
export async function onRequestPut(context) {
  return new Response(null, {
    status: 405,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}
export async function onRequestDelete(context) {
  return new Response(null, {
    status: 405,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}
export async function onRequestPatch(context) {
  return new Response(null, {
    status: 405,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}

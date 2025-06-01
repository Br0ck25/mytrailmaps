// functions/api/reset-password.js

/**
 * Handles POST https://<your‐pages‐domain>/api/reset-password
 * Expects a JSON body: { email: string, resetKey: string, newPassword: string }
 * - Verifies that resetKey matches the stored one in USERS_KV
 * - If valid, hashes newPassword and writes a NEW resetKey back into KV
 * - Returns { success: true } on success, or { error: "…"} on failure
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

  const { email, resetKey, newPassword } = body || {};
  if (
    !email ||
    !resetKey ||
    !newPassword ||
    typeof email !== "string" ||
    typeof resetKey !== "string" ||
    typeof newPassword !== "string"
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

  // 2) Fetch user record by normalized email
  const normalizedEmail = email.trim().toLowerCase();
  const storedValue = await env.USERS_KV.get(normalizedEmail);
  if (!storedValue) {
    return new Response(
      JSON.stringify({ error: "User not found" }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

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

  // 3) Verify that the provided resetKey matches the stored one
  if (resetKey !== userObj.resetKey) {
    return new Response(
      JSON.stringify({ error: "Invalid reset key" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 4) Hash the new password with SHA-256
  const encoder = new TextEncoder();
  const pwData = encoder.encode(newPassword);
  let hashBuffer;
  try {
    hashBuffer = await crypto.subtle.digest("SHA-256", pwData);
  } catch {
    return new Response(
      JSON.stringify({ error: "Error hashing new password" }),
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
  const newPasswordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  // 5) Generate a brand‐new resetKey so the old one cannot be reused
  const newResetKey = crypto.randomUUID();

  // 6) Write the updated record back into KV
  const updatedUser = {
    ...userObj,
    passwordHash: newPasswordHash,
    resetKey: newResetKey,
    // You may want to keep createdAt or other fields unchanged
  };
  await env.USERS_KV.put(normalizedEmail, JSON.stringify(updatedUser));

  // 7) Return success + (optionally) the new resetKey
  // In a real setup you might email the new key; here we return it so the client can show it or store it
  return new Response(
    JSON.stringify({ success: true, newResetKey }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

// Reject other HTTP methods
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

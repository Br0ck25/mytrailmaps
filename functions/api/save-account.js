// functions/api/save-account.js

/**
 * POST /api/save-account
 * - Requires Authorization: Bearer <token>
 * - Body: { account: { tracks: [...], folderOrder: [...], preferences: {…} } }
 * - Looks up token → email, then writes JSON to ACCOUNT_KV under key `${email}:account`
 */

export async function onRequestOptions(context) {
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

  // 1) Extract token
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Missing token" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 2) Look up normalized email
  const normalizedEmail = await env.USERS_KV.get(`token:${token}`);
  if (!normalizedEmail) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 3) Parse JSON body
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

  const { account } = body || {};
  if (
    !account ||
    typeof account !== "object" ||
    !Array.isArray(account.tracks) ||
    !Array.isArray(account.folderOrder) ||
    typeof account.preferences !== "object"
  ) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid account object" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 4) Write the full account JSON to KV
  const accountKey = `${normalizedEmail}:account`;
  try {
    await env.ACCOUNT_KV.put(accountKey, JSON.stringify(account));
  } catch {
    return new Response(
      JSON.stringify({ error: "Error saving account" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

// Reject other methods
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

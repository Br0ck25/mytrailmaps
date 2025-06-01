// functions/api/get-account.js

/**
 * GET /api/get-account
 * - Requires Authorization: Bearer <token>
 * - Looks up token → email in USERS_KV
 * - Fetches `${normalizedEmail}:account` from ACCOUNT_KV
 * - Returns { account } or { account: defaultObject } if none exists
 */

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function onRequestGet(context) {
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

  // 2) Look up normalized email from USERS_KV
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

  // 3) Fetch the account JSON from KV
  const accountKey = `${normalizedEmail}:account`;
  const accountJson = await env.ACCOUNT_KV.get(accountKey);
  let account;
  if (accountJson) {
    try {
      account = JSON.parse(accountJson);
    } catch {
      account = null;
    }
  }

  // 4) If no account exists in KV, return a default skeleton
  if (!account) {
    account = {
      tracks: [],
      folderOrder: [],
      preferences: {
        showTracks: true,
        showNames: true,
        showWaypoints: true,
        showWaypointLabels: true,
        showPublicTracks: true,
      },
    };
  }

  return new Response(
    JSON.stringify({ account }),
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
export async function onRequestPost(context) {
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

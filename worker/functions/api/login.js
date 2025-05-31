// functions/api/login.js

export async function OPTIONS(request) {
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

export async function POST(request, context) {
  // 1) Parse JSON body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
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
      { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  // 2) Normalize email and fetch from KV
  const normalizedEmail = email.trim().toLowerCase();
  const storedValue = await context.env.USERS_KV.get(normalizedEmail);
  if (!storedValue) {
    return new Response(
      JSON.stringify({ error: "Invalid email or password" }),
      { status: 401, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  let userObj;
  try {
    userObj = JSON.parse(storedValue);
  } catch {
    return new Response(
      JSON.stringify({ error: "Corrupted user data" }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  // 3) Re‐hash the password (SHA‐256) and compare
  const encoder = new TextEncoder();
  const pwData = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", pwData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedPassword = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (hashedPassword !== userObj.passwordHash) {
    return new Response(
      JSON.stringify({ error: "Invalid email or password" }),
      { status: 401, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  // 4) Issue a dummy token (you can also store it in KV for later validation)
  const dummyToken = crypto.randomUUID();
  // Optionally: await context.env.USERS_KV.put(`token:${dummyToken}`, normalizedEmail, { expirationTtl: 3600 });

  return new Response(
    JSON.stringify({ success: true, token: dummyToken }),
    { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
  );
}

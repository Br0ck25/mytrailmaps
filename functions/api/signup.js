// functions/api/signup.js

export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request, context) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  const { email, password, resetKey } = body || {};
  if (
    !email ||
    !password ||
    !resetKey ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof resetKey !== "string"
  ) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid fields" }),
      { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  // Example resetKey check; replace with your own logic
  if (resetKey.trim() !== "MYRESETKEY") {
    return new Response(
      JSON.stringify({ error: "Invalid reset key" }),
      { status: 403, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await context.env.USERS_KV.get(normalizedEmail);
  if (existing) {
    return new Response(
      JSON.stringify({ error: "User already exists" }),
      { status: 409, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  // Hash password via SHA-256 (for demonstration only)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedPassword = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const userObj = {
    email: normalizedEmail,
    passwordHash: hashedPassword,
    createdAt: Date.now(),
  };

  await context.env.USERS_KV.put(
    normalizedEmail,
    JSON.stringify(userObj)
  );

  return new Response(
    JSON.stringify({ success: true, message: "User created" }),
    { status: 201, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
  );
}

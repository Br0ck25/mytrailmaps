// functions/api/login.js
export async function onRequestPost(context) {
  // This function is invoked for POST /api/login
 
  try {
    const req = context.request;
    const body = await req.json(); // parse JSON from client
    const { email, password } = body || {};

    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: "Missing email or password" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── YOUR AUTH CHECK HERE ──
    // For example, look up “email” in KV or a database:
    // let stored = await MY_USERS_KV.get(email);
    // if (!stored) return new Response(JSON.stringify({ message: "User not found" }), { status: 401, headers: { "Content-Type": "application/json" } });
    // const isValid = await bcrypt.compare(password, stored.hashedPassword);
    // if (!isValid) return new Response(JSON.stringify({ message: "Invalid credentials" }), { status: 401, headers: { "Content-Type": "application/json" } });

    // For demonstration, let’s assume any non‐empty email/password is “valid”:
    // You would swap in real logic above.
    const fakeToken = btoa(`${email}:${Date.now()}`); // create a dummy token

    // Return { token: "…" } so your frontend can store it
    return new Response(JSON.stringify({ token: fakeToken }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ message: "Server error: " + err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// If you want to explicitly disallow GET, you can return 405 for other methods:
export async function onRequestGet(context) {
  return new Response(null, { status: 405 });
}
export async function onRequestPut(context) {
  return new Response(null, { status: 405 });
}
export async function onRequestDelete(context) {
  return new Response(null, { status: 405 });
}

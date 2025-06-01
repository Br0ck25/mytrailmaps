// src/AuthLanding.jsx
import { useState } from "react";

export default function AuthLanding() {
  const [activeTab, setActiveTab] = useState("signup"); // or "signin"
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setFormData({ email: "", password: "", });
    setMessage(null);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const endpoint = activeTab === "signup" ? "/api/signup" : "/api/login";
    const bodyPayload =
      activeTab === "signup"
        ? {
            email: formData.email.trim(),
            password: formData.password,
          }
        : {
            email: formData.email.trim(),
            password: formData.password,
          };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");

      if (activeTab === "signin") {
        localStorage.setItem("authToken", json.token);
        localStorage.setItem("userEmail", formData.email.trim());
        setMessage({
          type: "success",
          text: "Successfully signed in! Redirecting…",
        });
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1200);
      } else {
        setMessage({
          type: "success",
          text: "Account created! Redirecting to login…",
        });
        setTimeout(() => handleTabClick("signin"), 1500);
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ===== Hero / Explanation Section ===== */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-8 px-4 text-center">
          <div className="flex items-center justify-center space-x-3">
  <img src="/pwa-512x512.png" alt="Logo" className="w-10 h-10 rounded-md" />
  <h1 className="text-3xl font-bold text-green-700">My Trail Maps</h1>
</div>

          <p className="mt-2 text-gray-600">
            Build, track, and save your trips—view live speed, elevation, and distance.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
  <img
    src="/screenshots/mapview.png"
    alt="Map view"
    className="rounded-lg shadow-lg object-contain w-full max-w-xs mx-auto"
  />
  <img
    src="/screenshots/triptracking.png"
    alt="Trip tracking"
    className="rounded-lg shadow-lg object-contain w-full max-w-xs mx-auto"
  />
  <img
    src="/screenshots/mytracks.png"
    alt="My Tracks"
    className="rounded-lg shadow-lg object-contain w-full max-w-xs mx-auto"
  />
  <img
    src="/screenshots/settings.png"
    alt="Settings"
    className="rounded-lg shadow-lg object-contain w-full max-w-xs mx-auto"
  />
</div>

        </div>
      </header>

      {/* ===== Auth Section ===== */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 mt-16">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex">
            <button
              onClick={() => handleTabClick("signup")}
              className={`flex-1 py-3 text-center font-semibold border-b-2 ${
                activeTab === "signup"
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-600 hover:text-green-700"
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => handleTabClick("signin")}
              className={`flex-1 py-3 text-center font-semibold border-b-2 ${
                activeTab === "signin"
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-600 hover:text-green-700"
              }`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>

            

            {message && (
              <div className={`p-3 rounded ${
                message.type === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading
                ? activeTab === "signup"
                  ? "Creating…"
                  : "Signing in…"
                : activeTab === "signup"
                ? "Create Account"
                : "Sign In"}
            </button>
          </form>
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-gray-500">
        © {new Date().getFullYear()} MyTrailMaps. All rights reserved.
      </footer>
    </div>
  );
}

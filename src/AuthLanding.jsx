// src/AuthLanding.jsx
import { useState } from "react";

export default function AuthLanding() {
  const [activeTab, setActiveTab] = useState("signup"); // or "signin"
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    resetKey: "", // only used for signup/reset
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setFormData({ email: "", password: "", resetKey: "" });
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

    // Choose endpoint based on tab
    const endpoint =
      activeTab === "signup" ? "/api/signup" : "/api/login";
    // If you need a reset‐key for signup, include it in body. Otherwise omit.
    const bodyPayload =
      activeTab === "signup"
        ? {
            email: formData.email.trim(),
            password: formData.password,
            resetKey: formData.resetKey.trim(),
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
      if (!res.ok) {
        throw new Error(json.error || "Request failed");
      }
      setMessage({
        type: "success",
        text:
          activeTab === "signup"
            ? "Account created! Check your email or proceed to sign in."
            : "Successfully signed in! Redirecting…",
      });
      // If sign‐in success, redirect after a short delay (adjust path as needed)
      if (activeTab === "signin") {
        setTimeout(() => {
          window.location.href = "/app"; // change to your app’s protected route
        }, 1200);
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
          <h1 className="text-3xl font-bold text-green-700">
            MyTrailMaps Tracker
          </h1>
          <p className="mt-2 text-gray-600">
            Build, track, and save your trips—view live speed, elevation,
            and distance. Below are a few screenshots of the interface:
          </p>

          {/* ===== Screenshot Gallery ===== */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Replace src with your real screenshots */}
            <img
              src="/screenshots/mapview.png"
              alt="Map view screenshot"
              className="rounded-lg shadow-lg object-cover w-full h-48"
            />
            <img
              src="/screenshots/triptracking.png"
              alt="Trip tracking screenshot"
              className="rounded-lg shadow-lg object-cover w-full h-48"
            />
            <img
              src="/screenshots/mytracks.png"
              alt="My Tracks screenshot"
              className="rounded-lg shadow-lg object-cover w-full h-48"
            />
            <img
              src="/screenshots/settings.png"
              alt="Settings screenshot"
              className="rounded-lg shadow-lg object-cover w-full h-48"
            />
          </div>
        </div>
      </header>

      {/* ===== Auth Tabs & Forms ===== */}
      <main className="flex-1 flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden">
          {/* Tab Buttons */}
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

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-4"
            noValidate
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
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

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
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

            {/* Only show Reset Key field when signing Up */}
            {activeTab === "signup" && (
              <div>
                <label
                  htmlFor="resetKey"
                  className="block text-sm font-medium text-gray-700"
                >
                  Reset Key (shown at signup)
                </label>
                <input
                  id="resetKey"
                  name="resetKey"
                  type="text"
                  required
                  value={formData.resetKey}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the reset key you received when you signed up.
                </p>
              </div>
            )}

            {/* Message Box */}
            {message && (
              <div
                className={`p-3 rounded ${
                  message.type === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading
                ? activeTab === "signup"
                  ? "Creating…"
                  : "Logging in…"
                : activeTab === "signup"
                ? "Create Account"
                : "Sign In"}
            </button>
          </form>
        </div>
      </main>

      {/* ===== Footer ===== */}
      <footer className="text-center py-4 text-xs text-gray-500">
        © {new Date().getFullYear()} MyTrailMaps. All rights reserved.
      </footer>
    </div>
  );
}

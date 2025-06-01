// src/ResetPasswordPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [resetKey, setResetKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          resetKey: resetKey.trim(),
          newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Reset failed");
      }

      // Show success (you can also choose to navigate back to /login directly)
      setSuccessMsg("Password changed successfully! Your new reset key is:\n\n" + json.newResetKey);
      setLoading(false);

      // Optionally, navigate back to /login after a short delay:
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-center text-green-700">
          Reset Password
        </h2>

        {error && (
          <div className="mb-4 text-center text-red-600">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 whitespace-pre-wrap text-center text-green-600">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label
              htmlFor="resetKey"
              className="block text-sm font-medium text-gray-700"
            >
              Reset Key
            </label>
            <input
              id="resetKey"
              type="text"
              required
              value={resetKey}
              onChange={(e) => setResetKey(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-semibold ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Remembered your password?{" "}
          <Link to="/login" className="text-green-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

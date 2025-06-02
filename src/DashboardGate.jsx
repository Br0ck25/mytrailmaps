// src/DashboardGate.jsx
import { useState, useEffect } from "react";
import DashboardCore from "./DashboardCore";

// A small hook that queries our /api/subscription-status endpoint.
function useSubscriptionStatus(userEmail) {
  const [status, setStatus] = useState(null); // null = loading, then "free" or "paid"

  useEffect(() => {
    if (!userEmail) {
      // If no email in localStorage, treat as free immediately:
      setStatus("free");
      return;
    }

    setStatus(null); // show loading while we fetch
    fetch(`/api/subscription-status?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((json) => {
        // Expect { status: "paid" } or { status: "free" }
        setStatus(json.status || "free");
      })
      .catch(() => {
        // On any error, default to “free”
        setStatus("free");
      });
  }, [userEmail]);

  return status;
}

export default function DashboardGate({ onLogout }) {
  // 1) Grab the logged‐in userEmail from localStorage:
  const userEmail = localStorage.getItem("userEmail") || "";

  // 2) Ask our Worker: is this user “free” or “paid”?
  const subscriptionStatus = useSubscriptionStatus(userEmail);

  // 3) Persist “Continue as Free” choice in localStorage:
  const [bypassFree, setBypassFree] = useState(() => {
    return localStorage.getItem("bypassFree") === "true";
  });

  // If they later become “paid” (e.g. after a successful checkout),
  // we can clear the bypassFree flag so that we always trust the backend.
  useEffect(() => {
    if (subscriptionStatus === "paid") {
      localStorage.removeItem("bypassFree");
      setBypassFree(false);
    }
  }, [subscriptionStatus]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Early‐returns (with stable hook order above):
  // ─────────────────────────────────────────────────────────────────────────────

  // A) While subscriptionStatus === null, show a loading spinner:
  if (subscriptionStatus === null) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Checking subscription status…</p>
      </div>
    );
  }

  const isPaid = subscriptionStatus === "paid";
  const isFree = subscriptionStatus === "free";

  // B) If user is free AND has not clicked “Continue as Free User,” show paywall:
  if (isFree && !bypassFree) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Upgrade to Premium
        </h2>
        <p className="text-center text-gray-600 mb-6 max-w-md">
          Free accounts can create and import their own tracks, but paid subscribers
          get access to all official Tracks & Parks, plus offline maps and other
          premium features.
        </p>
        <div className="flex flex-col space-y-4">
          <button
            onClick={async () => {
              // Replace with your real monthly Price ID:
              const priceId = "price_1HxYYY_monthly";
              const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId, userEmail }),
              });
              const { checkoutUrl } = await res.json();
              window.location.href = checkoutUrl;
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
          >
            Subscribe $5.99 / month
          </button>

          <button
            onClick={async () => {
              // Replace with your real yearly Price ID:
              const priceId = "price_1HxYYY_yearly";
              const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId, userEmail }),
              });
              const { checkoutUrl } = await res.json();
              window.location.href = checkoutUrl;
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Subscribe $60 / year
          </button>

          {/* ─── “Continue as Free User” BUTTON ─────────────────────────────────── */}
          <button
            onClick={() => {
              localStorage.setItem("bypassFree", "true");
              setBypassFree(true);
            }}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
          >
            Continue as Free User
          </button>
        </div>
      </div>
    );
  }

  // C) Otherwise (either paid, or free+clicked “Continue”), render the core dashboard:
  return <DashboardCore isPaid={isPaid} onLogout={onLogout} />;
}

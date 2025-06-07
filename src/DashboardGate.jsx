// src/DashboardGate.jsx
import { useState, useEffect } from "react";
import DashboardCore from "./DashboardCore";

// A small hook that queries our /api/subscription-status endpoint.
function useSubscriptionStatus(userEmail) {
  const [status, setStatus] = useState(null); // null = loading, then "free" or "paid"

  useEffect(() => {
    if (!userEmail) {
      setStatus("free");
      return;
    }

    setStatus(null);
    fetch(`/api/subscription-status?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((json) => setStatus(json.status || "free"))
      .catch(() => setStatus("free"));
  }, [userEmail]);

  return status;
}

export default function DashboardGate({ onLogout }) {
  const userEmail = localStorage.getItem("userEmail") || "";
  const subscriptionStatus = useSubscriptionStatus(userEmail);

  const [bypassFree, setBypassFree] = useState(() => {
    return localStorage.getItem("bypassFree") === "true";
  });

  useEffect(() => {
    if (subscriptionStatus === "paid") {
      localStorage.removeItem("bypassFree");
      setBypassFree(false);
    }
  }, [subscriptionStatus]);

  // A) Loading state
  if (subscriptionStatus === null) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Checking subscription status…</p>
      </div>
    );
  }

  // 🔥 FOR TESTING ONLY: treat everyone as paid
  const isPaid = true; // subscriptionStatus === "paid";
  const isFree = subscriptionStatus === "free";

  // B) “Paywall” branch is never taken, because false && anything is always false
  if (false && isFree && !bypassFree) {
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
          {/* paste your two subscribe buttons + “Continue as Free” button here */}
        </div>
      </div>
    );
  }

  // C) Otherwise render the real dashboard
  return <DashboardCore isPaid={isPaid} onLogout={onLogout} />;
}

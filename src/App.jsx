// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import LoginPage from "./LoginPage";
import SignUpPage from "./SignUpPage";
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
  // Keep the auth token in state so we can re-render on login/logout.
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));

  useEffect(() => {
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }, [token]);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage onLogin={setToken} />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Redirect “/” to either /dashboard (if logged in) or /login */}
        <Route
          path="/"
          element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />

        {/* Protected dashboard route */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute token={token}>
              <Dashboard onLogout={() => setToken(null)} />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: any other path also redirects based on auth */}
        <Route
          path="*"
          element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

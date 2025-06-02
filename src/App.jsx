// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import SignUpPage from "./SignUpPage";
import ResetPasswordPage from "./ResetPasswordPage";
// ↓ Replace this line:
 // import Dashboard from "./Dashboard";
// ↑ With this line:
import DashboardGate from "./DashboardGate";

import ProtectedRoute from "./ProtectedRoute";
import AuthLanding from "./AuthLanding";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // On mount, check localStorage for an existing token
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Handler to mark as “logged in” (called by LoginPage/SignUpPage)
  function handleLogin() {
    setIsAuthenticated(true);
  }

  // Handler to log out
  function handleLogout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail"); // be sure to clear userEmail too
    setIsAuthenticated(false);
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthLanding />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <SignUpPage onSignUp={handleLogin} />
            )
          }
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              {/* ↓ Render the “gate” instead of the old Dashboard */}
              <DashboardGate onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

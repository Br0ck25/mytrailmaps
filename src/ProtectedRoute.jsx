// src/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ isAuthenticated, children }) {
  // If the user is not authenticated, redirect to /login.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the protected content.
  return children;
}

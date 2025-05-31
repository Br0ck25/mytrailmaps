// src/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ token, children }) {
  if (!token) {
    // If no token, redirect to login
    return <Navigate to="/login" replace />;
  }
  // Otherwise, render the protected content
  return children;
}

// src/components/PrivateRoute.js
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ requiredRole }) {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    // Not logged in – redirect to the login page.
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // Logged in but does not have required role – show unauthorized page or redirect.
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
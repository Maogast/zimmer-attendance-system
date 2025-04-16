// src/components/PrivateRoute.js
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ requiredRole }) {
  const { currentUser, userRole } = useAuth();

  // If the user is not logged in, redirect to the authentication page.
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  // If a specific role is required, check that first.
  if (requiredRole) {
    if (userRole !== requiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  } else {
    // When no explicit role is provided, allow access only if the user is either an Admin or a Teacher.
    if (userRole !== "admin" && userRole !== "teacher") {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
}
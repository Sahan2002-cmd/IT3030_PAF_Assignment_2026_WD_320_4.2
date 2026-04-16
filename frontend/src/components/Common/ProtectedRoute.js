import React from "react";
import { Navigate } from "react-router-dom";
import LoadingScreen from "./LoadingScreen";
import { routeForRole } from "../../utils/auth";

function ProtectedRoute({ session, requiredRole, children }) {
  if (session.status === "loading") {
    return <LoadingScreen />;
  }

  if (!session.token || !session.user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return <Navigate to={routeForRole(session.user.role)} replace />;
  }

  return children;
}

export default ProtectedRoute;

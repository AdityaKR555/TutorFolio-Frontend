import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken, getStoredUser } from "../utils/auth";

function ProtectedRoute() {
  const user = getStoredUser();
  const token = getAccessToken();

  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;

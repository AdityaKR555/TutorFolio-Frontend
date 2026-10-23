import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { clearAuthSession, getStoredUser } from "../utils/auth";

function PublicRoute() {
  const user = getStoredUser();

  // Not logged in → allow public pages
  if (!user) {
    return <Outlet />;
  }

  const accountType = user?.accountType?.trim().toLowerCase();

  // Tutor → tutor dashboard
  if (accountType === "tutor") {
    return <Navigate to="/dashboard" replace />;
  }

  // Student → temporary student page
  if (accountType === "student") {
    return <Navigate to="/student" replace />;
  }

  // Invalid account type or corrupted session
  clearAuthSession();
  return <Outlet />;
}

export default PublicRoute;

import React from "react";
import { Navigate, Outlet } from "react-router-dom";

function PublicRoute() {
  const storedUser = localStorage.getItem("user");

  // Not logged in → allow public pages
  if (!storedUser) {
    return <Outlet />;
  }

  let user;

  try {
    user = JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("user");
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

  // Invalid account type
  localStorage.removeItem("user");
  return <Outlet />;
}

export default PublicRoute;
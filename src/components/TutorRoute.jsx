import React from "react";
import { Navigate, Outlet } from "react-router-dom";

function TutorRoute() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  let user;

  try {
    user = JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  const accountType = user?.accountType?.trim().toLowerCase();

  if (accountType !== "tutor") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default TutorRoute;
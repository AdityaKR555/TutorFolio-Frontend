import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getStoredUser } from "../utils/auth";

function TutorRoute() {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const accountType = user?.accountType?.trim().toLowerCase();

  if (accountType !== "tutor") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default TutorRoute;

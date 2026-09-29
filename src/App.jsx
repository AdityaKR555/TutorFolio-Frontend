import React from "react";
import { Route, Routes } from "react-router-dom";

import Home from "./Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import ProtectedRoute from "./components/ProtectedRoute";
import TutorRoute from "./components/TutorRoute";
import PublicRoute from "./components/PublicRoute";
import TutorLayout from "./components/TutorLayout";

import Dashboard from "./pages/tutor/Dashboard";
import Profile from "./pages/tutor/Profile";
import TuitionDetails from "./pages/tutor/TuitionDetails";
import Achievements from "./pages/tutor/Achievements";
import Batches from "./pages/tutor/Batches";

function ComingSoon({ title }) {
  return (
    <div className="p-5 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-8">
          <h1 className="text-2xl font-bold text-white">{title}</h1>

          <p className="text-[#94a8c7] mt-2">
            This section will be built next.
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div>
      <Routes>

        {/* Public pages - blocked when already logged in */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Student area - temporary */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/student"
            element={<ComingSoon title="Student Dashboard" />}
          />
        </Route>

        {/* Tutor area */}
        <Route element={<ProtectedRoute />}>
          <Route element={<TutorRoute />}>
            <Route element={<TutorLayout />}>
              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/profile"
                element={<Profile />}
              />

              <Route
                path="/tuition"
                element={<TuitionDetails />}
              />

              <Route
                path="/achievements"
                element={<Achievements />}
              />

              <Route
                path="/batches"
                element={<Batches />}
              />

              <Route
                path="/conversations"
                element={
                  <ComingSoon title="Conversations" />
                }
              />
            </Route>
          </Route>
        </Route>

      </Routes>
    </div>
  );
}

export default App;
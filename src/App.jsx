import React, { useEffect } from "react";
import { useWebsiteHost } from "./utils/websiteHostContext";
import { getTutorWebsiteUrl } from "./utils/websiteUrls";
import { Route, Routes, useParams, useLocation } from "react-router-dom";

import Home from "./Home";
import AdminApp from "./admin/AdminApp";
import BackToTop from "./components/BackToTop";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";

import ProtectedRoute from "./components/ProtectedRoute";
import TutorRoute from "./components/TutorRoute";
import PublicRoute from "./components/PublicRoute";
import TutorLayout from "./components/TutorLayout";

import Dashboard from "./pages/tutor/Dashboard";
import Profile from "./pages/tutor/Profile";
import TuitionDetails from "./pages/tutor/TuitionDetails";
import Achievements from "./pages/tutor/Achievements";
import Experience from "./pages/tutor/Experience";
import Gallery from "./pages/tutor/Gallery";
import Batches from "./pages/tutor/Batches";

import Settings from "./pages/tutor/Settings";

import DiscoverTutors from "./pages/tutor/DiscoverTutors";
import PublicTutorWebsite from "./pages/public/PublicTutorWebsite";

import Conversations from "./pages/tutor/Conversations";
import Notifications from "./pages/tutor/Notifications";

import FAQ from "./pages/tutor/FAQ";

import Themes from "./pages/tutor/Themes";
import Website from "./pages/tutor/Website";

import Subscription from "./pages/tutor/Subscription";
import ReportBug from "./pages/tutor/ReportBug";
import Guide from "./pages/tutor/Guide";

function ComingSoon({ title }) {
  return (
    <div className="p-5 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-tf-surface border border-tf-line rounded-3xl p-8">
          <h1 className="text-2xl font-bold text-tf-ink">{title}</h1>

          <p className="text-tf-copy mt-2">
            This section will be built next.
          </p>
        </div>
      </div>
    </div>
  );
}

function LegacyTutorRedirect() {
  const { username, section } = useParams();
  const location = useLocation();
  const target = getTutorWebsiteUrl(username);
  useEffect(() => {
    if (target) window.location.replace(`${target}${section ? `/${encodeURIComponent(section)}` : '/'}${location.search}${location.hash}`);
  }, [target, section, location.search, location.hash]);
  return <p className="p-8">{target ? 'Opening tutor website…' : 'Tutor website not found.'}</p>;
}

function App() {
  const websiteHost = useWebsiteHost();
  if (websiteHost.kind === 'tutor') return <div><Routes>
    <Route path="/" element={<PublicTutorWebsite hostUsername={websiteHost.username} />} />
    <Route path="/:section" element={<PublicTutorWebsite hostUsername={websiteHost.username} />} />
    <Route path="/tutor/:username" element={<LegacyTutorRedirect />} />
    <Route path="/tutor/:username/:section" element={<LegacyTutorRedirect />} />
    <Route path="*" element={<p className="p-8">Page not found.</p>} />
  </Routes><BackToTop /></div>;
  return (
    <div>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        {/* OAuth Callbacks */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/google/callback" element={<AuthCallback />} />

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
              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/profile" element={<Profile />} />

              <Route path="/settings" element={<Settings />} />

              <Route path="/tuition" element={<TuitionDetails />} />

              <Route path="/achievements" element={<Achievements />} />

              <Route path="/batches" element={<Batches />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/experience" element={<Experience />} />

              <Route path="discover-tutors" element={<DiscoverTutors />} />

              <Route path="/conversations" element={<Conversations />} />

              <Route path="notifications" element={<Notifications />} />

              <Route path="/faq" element={<FAQ />} />

              {/* <Route path="/themes" element={<Themes />} /> */}

              <Route path="/website" element={<Website />} />

              <Route path="/subscription" element={<Subscription />} />

              <Route path="/subscriptions" element={<Subscription />} />

              <Route path="/billing" element={<Subscription />} />

              <Route path="/plans" element={<Subscription />} />

              <Route path="/guide" element={<Guide />} />

              <Route path="/report-bug" element={<ReportBug />} />

            </Route>
          </Route>
        </Route>

        {/* Public tutor website */}
        <Route path="/theme-preview/:previewThemeId/:previewUserId" element={<PublicTutorWebsite />} />
        <Route path="/theme-preview/:previewThemeId/:previewUserId/:section" element={<PublicTutorWebsite />} />
        <Route path="/tutor/:username" element={<LegacyTutorRedirect />} />
        <Route path="/tutor/:username/:section" element={<LegacyTutorRedirect />} />
      </Routes>
      <BackToTop />
    </div>
  );
}

export default App;

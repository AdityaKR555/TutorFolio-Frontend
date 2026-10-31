import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { clearAuthSession, getStoredUser } from "../utils/auth";
import "./TutorLayout.css";

function TutorLayout() {
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("tutorfolio-theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  const profileRef = useRef(null);

  const readUser = () => {
    try {
      return getStoredUser();
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState(readUser);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const refreshUser = () => {
      setUser(readUser());
    };

    window.addEventListener("tutorfolio-user-updated", refreshUser);
    window.addEventListener("storage", refreshUser);

    return () => {
      window.removeEventListener("tutorfolio-user-updated", refreshUser);
      window.removeEventListener("storage", refreshUser);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("tutorfolio-theme", theme);
    } catch {
      // Theme selection remains available for the current page if storage is unavailable.
    }
  }, [theme]);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  // Main navigation items
  const mainNavItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 10.5L12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6"
          />
        </svg>
      ),
    },
    {
      name: "Website",
      path: user?.username ? `/tutor/${encodeURIComponent(user.username)}` : "/profile",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12h18M12 3a15 15 0 010 18m0-18a15 15 0 000 18" />
        </svg>
      ),
    },
    {
      name: "Tuition Details",
      path: "/tuition",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 14l9-5-9-5-9 5 9 5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 12v4.5c0 .8.4 1.5 1.1 1.9 3.7 2.1 7.1 2.1 10.8 0 .7-.4 1.1-1.1 1.1-1.9V12"
          />
        </svg>
      ),
    },
    {
      name: "Achievements",
      path: "/achievements",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 3l2.4 4.9L20 8.7l-4 3.9.9 5.5L12 15.5l-4.9 2.6.9-5.5-4-3.9 5.6-.8L12 3z"
          />
        </svg>
      ),
    },
    {
      name: "Batches",
      path: "/batches",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 19.5A2.5 2.5 0 016.5 17H20"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
          />
        </svg>
      ),
    },
    {
      name: "Discover Tutors",
      path: "/discover-tutors",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
    },
     {
      name: "Conversations",
      path: "/conversations",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h8M8 14h5M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l-1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
    {
      name: "Themes",
      path: "/themes",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3a9 9 0 100 18h1.2a2 2 0 001.4-3.4 1.8 1.8 0 011.3-3.1H18a3 3 0 003-3c0-4.7-4-8.5-9-8.5Z" />
          <circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7.5" r="1" /><circle cx="15" cy="8" r="1" />
        </svg>
      ),
    },
  ];

  // Secondary navigation items
  const secondaryNavItems = [
    {
      name: "Plans & Billing",
      path: "/subscription",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
    {
      name: "Guide",
      path: "/guide",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5.5A2.5 2.5 0 016.5 3H20v17H6.5A2.5 2.5 0 014 17.5v-12ZM4 17.5A2.5 2.5 0 016.5 15H20M8 7h8M8 10h6" />
        </svg>
      ),
    },
    {
      name: "Report a Bug",
      path: "/report-bug",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9V7a4 4 0 018 0v2m-9 0h10a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5a2 2 0 012-2Zm-5 2h3m12 0h3M4 17h3m10 0h3m-8-5v2" />
        </svg>
      ),
    },
    {
      name: "FAQs",
      path: "/faq",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h8m-8 4h5m-9 7l3.5-3H18a3 3 0 003-3V6a3 3 0 00-3-3H6a3 3 0 00-3 3v12l2 3z"
          />
        </svg>
      ),
    },
    {
      name: "Settings",
      path: "/settings",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 15a3 3 0 100-6 3 3 0 000 6z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
          />
        </svg>
      ),
    },
  ];

  const closeMobileSidebar = () => {
    setSidebarOpen(false);
  };

  const mainNavOrder = ["Dashboard", "Website", "Discover Tutors", "Conversations", "Tuition Details", "Batches", "Achievements", "Themes"];
  const orderedMainNavItems = [...mainNavItems].sort((a, b) => mainNavOrder.indexOf(a.name) - mainNavOrder.indexOf(b.name));

  // Shared navigation link styling and rendering
  const renderNavItems = (items, closeOnClick = false) =>
    items.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={closeOnClick ? closeMobileSidebar : undefined}
        className={({ isActive }) =>
          `tutor-nav-link flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive
              ? "active"
              : ""
          }`
        }
      >
        {item.icon}
        <span className="text-sm font-medium">{item.name}</span>
      </NavLink>
    ));

  return (
    <div className="tutor-shell min-h-screen font-poppins" data-theme={theme}>
      {/* ================= NAVBAR ================= */}
      <header className="tutor-header fixed top-0 left-0 right-0 z-50 h-[72px] border-b">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="tutor-menu-button lg:hidden p-2 transition-colors"
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Logo */}
            <button
              onClick={() => navigate("/dashboard")}
              className="tutor-logo-button flex items-center"
            >
              <img
                src="/tf-logo.png"
                alt="TutorFolio"
                className="w-[135px] sm:w-[150px] h-auto object-contain"
              />
            </button>
          </div>

          {/* Profile */}
          <div className="relative flex gap-2.5" ref={profileRef}>
            <div className="tutor-theme-switch" role="group" aria-label="Color theme">
              <button type="button" onClick={() => setTheme("light")} className={theme === "light" ? "active" : ""} aria-pressed={theme === "light"} aria-label="Use light theme" title="Light theme">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>
                <span>Light</span>
              </button>
              <button type="button" onClick={() => setTheme("dark")} className={theme === "dark" ? "active" : ""} aria-pressed={theme === "dark"} aria-label="Use dark theme" title="Dark theme">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/></svg>
                <span>Dark</span>
              </button>
            </div>
            <NotificationBell />

            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="tutor-profile-trigger flex items-center gap-2 p-2 rounded-xl transition-colors"
              aria-label="Profile menu"
            >
              <div className="tutor-profile-avatar w-9 h-9 rounded-full border overflow-hidden flex items-center justify-center">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M20 21a8 8 0 00-16 0M12 13a4 4 0 100-8 4 4 0 000 8z"
                    />
                  </svg>
                )}
              </div>

              <svg
                className={`tutor-profile-chevron hidden sm:block w-4 h-4 transition-transform ${
                  profileOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Profile dropdown */}
            {profileOpen && (
              <div className="tutor-profile-menu absolute right-0 top-14 w-52 border rounded-2xl shadow-xl overflow-hidden">
                <div className="tutor-profile-menu-head px-4 py-3 border-b">
                  <p className="font-medium truncate">
                    {user?.username}
                  </p>
                  <p className="tutor-profile-email text-xs truncate mt-1">
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/subscription");
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-amber-300 hover:bg-[#142744] hover:text-amber-200 transition-colors text-left"
                >
                  <span className="text-base">👑</span>
                  Plans &amp; Billing
                </button>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/profile");
                  }}
                  className="tutor-profile-menu-item w-full px-4 py-3 flex items-center gap-3 transition-colors text-left"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M20 21a8 8 0 00-16 0M12 13a4 4 0 100-8 4 4 0 000 8z"
                    />
                  </svg>
                  Profile
                </button>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/settings");
                  }}
                  className="tutor-profile-menu-item w-full px-4 py-3 flex items-center gap-3 transition-colors text-left"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-.1 0 1.65 1.65 0 00-1.72.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                    />
                  </svg>
                  Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 flex items-center gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="tutor-sidebar hidden lg:flex fixed top-[72px] left-0 bottom-0 w-[250px] border-r flex-col z-40">
        <nav className="flex flex-1 flex-col overflow-y-auto p-4">
          {/* Main features stay at the top */}
          <div className="space-y-2">
            {renderNavItems(orderedMainNavItems)}
          </div>

          {/* Secondary features stay at the bottom */}
          <div className="tutor-sidebar-footer mt-auto space-y-2 border-t pt-4">
            {renderNavItems(secondaryNavItems)}
          </div>
        </nav>
      </aside>

      {/* ================= MOBILE SIDEBAR ================= */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeMobileSidebar}
          />

          {/* Drawer */}
          <aside className="tutor-sidebar tutor-mobile-sidebar absolute top-0 left-0 bottom-0 flex w-[280px] flex-col border-r shadow-2xl">
            <div className="tutor-mobile-sidebar-head flex h-[72px] shrink-0 items-center justify-between border-b px-5">
              <img
                src="/tf-logo.png"
                alt="TutorFolio"
                className="w-[135px] h-auto object-contain"
              />

              <button
                onClick={closeMobileSidebar}
                className="tutor-menu-button p-2 transition-colors"
                aria-label="Close menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <nav className="flex flex-1 flex-col overflow-y-auto p-4">
              {/* Main features stay at the top */}
              <div className="space-y-2">
                {renderNavItems(orderedMainNavItems, true)}
              </div>

              {/* Secondary features stay at the bottom */}
              <div className="tutor-sidebar-footer mt-auto space-y-2 border-t pt-4">
                {renderNavItems(secondaryNavItems, true)}
              </div>
            </nav>
          </aside>
        </div>
      )}

      {/* ================= MAIN CONTENT ================= */}
      <main className="pt-[72px] lg:pl-[250px] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

export default TutorLayout;
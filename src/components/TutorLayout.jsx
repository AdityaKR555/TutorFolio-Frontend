import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import api from "../api/axios";
import { clearAuthSession, getStoredUser, setAuthSession } from "../utils/auth";

function TutorLayout() {
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("tutorfolio-theme") === "dark"
        ? "dark"
        : "light";
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

  // Sync profile picture from backend if missing or outdated in session storage
  useEffect(() => {
    const id = user?.user_id ?? user?.userId ?? user?.id;
    if (!id) return;
    let cancelled = false;

    api.get("/personalDetails", { params: { userId: id }, timeout: 10000 })
      .then((res) => {
        if (cancelled) return;
        const details = res.data?.data;
        const picture =
          details?.profilePicture ||
          details?.profile_picture ||
          details?.profilepicture ||
          details?.profilePhoto ||
          "";
        if (picture && picture !== user?.profilePicture) {
          const current = getStoredUser() || {};
          setAuthSession({ ...current, profilePicture: picture });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user?.user_id, user?.userId, user?.id]);

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
      path: "/website",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" strokeWidth="2" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 12h18M12 3a15 15 0 010 18m0-18a15 15 0 000 18"
          />
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
      name: "Experience",
      path: "/experience",
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12c6 4 12 4 18 0m-9 0v4"/></svg>,
    },
    {
      name: "Gallery",
      path: "/gallery",
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/></svg>,
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
    // {
    //   name: "Themes",
    //   path: "/themes",
    //   icon: (
    //     <svg
    //       className="w-5 h-5"
    //       fill="none"
    //       stroke="currentColor"
    //       viewBox="0 0 24 24"
    //       aria-hidden="true"
    //     >
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeWidth="2"
    //         d="M12 3a9 9 0 100 18h1.2a2 2 0 001.4-3.4 1.8 1.8 0 011.3-3.1H18a3 3 0 003-3c0-4.7-4-8.5-9-8.5Z"
    //       />
    //       <circle cx="7.5" cy="11" r="1" />
    //       <circle cx="10" cy="7.5" r="1" />
    //       <circle cx="15" cy="8" r="1" />
    //     </svg>
    //   ),
    // },
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
            d="M4 5.5A2.5 2.5 0 016.5 3H20v17H6.5A2.5 2.5 0 014 17.5v-12ZM4 17.5A2.5 2.5 0 016.5 15H20M8 7h8M8 10h6"
          />
        </svg>
      ),
    },
    {
      name: "Report an Issue",
      path: "/report-bug",
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
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    // {
    //   name: "Settings",
    //   path: "/settings",
    //   icon: (
    //     <svg
    //       className="w-5 h-5"
    //       fill="none"
    //       stroke="currentColor"
    //       viewBox="0 0 24 24"
    //       aria-hidden="true"
    //     >
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeWidth="2"
    //         d="M12 15a3 3 0 100-6 3 3 0 000 6z"
    //       />
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeWidth="2"
    //         d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
    //       />
    //     </svg>
    //   ),
    // },
  ];

  const closeMobileSidebar = () => {
    setSidebarOpen(false);
  };

  const mainNavOrder = [
    "Dashboard",
    "Website",
    "Discover Tutors",
    "Conversations",
    "Tuition Details",
    "Batches",
    "Gallery",
    "Achievements",
    "Experience",
    "Themes",
    "FAQs",
  ];
  const orderedMainNavItems = [...mainNavItems].sort(
    (a, b) => mainNavOrder.indexOf(a.name) - mainNavOrder.indexOf(b.name),
  );

  // Shared navigation link styling and rendering
  const renderNavItems = (items, closeOnClick = false) =>
    items.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={closeOnClick ? closeMobileSidebar : undefined}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl border-l-[3px] px-[13px] py-3 transition-colors ${
            isActive
              ? "border-l-tf-blue bg-tf-sky text-tf-blue-pressed dark:text-tf-blue"
              : "border-l-transparent text-tf-copy hover:bg-tf-surface-soft hover:text-tf-ink"
          }`
        }
      >
        {item.icon}
        <span className="text-sm font-medium">{item.name}</span>
      </NavLink>
    ));

  return (
    <div className="min-h-screen bg-tf-bg text-tf-ink" data-theme={theme}>
      {/* ================= NAVBAR ================= */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[72px] border-b border-tf-line/40 bg-[color-mix(in_srgb,var(--tf-surface)_30%,transparent)] shadow-sm backdrop-blur-xl">
        <div className="h-full px-2 sm:px-6 flex items-center justify-between gap-2">
          {/* Left side */}
          <div className="flex min-w-0 items-center gap-1 sm:gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-tf-copy transition-colors hover:text-tf-ink lg:hidden"
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
            <a href="/" className="flex h-12 items-center gap-2 no-underline">
              <img
                src="/tf-logo.png"
                alt=""
                aria-hidden="true"
                className="h-8 max-h-9 w-auto shrink-0 object-contain sm:h-9 sm:max-w-[132px]"
              />
              <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-tf-ink min-[375px]:text-base sm:text-lg">
                Tutorfolio
              </span>
            </a>
          </div>

          {/* Profile */}
          <div className="relative flex shrink-0 gap-1 items-center sm:gap-2.5" ref={profileRef}>
            <div className="hidden h-10 items-center gap-1 rounded-full border border-tf-line bg-tf-surface-soft p-1 sm:inline-flex">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  theme === "light"
                    ? "bg-tf-surface text-amber-500 shadow-sm"
                    : "text-tf-muted hover:text-tf-ink"
                }`}
                aria-label="Switch to light theme"
                aria-pressed={theme === "light"}
                title="Light theme"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
                  <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  theme === "dark"
                    ? "bg-tf-surface text-tf-blue-pressed shadow-sm"
                    : "text-tf-muted hover:text-tf-ink"
                }`}
                aria-label="Switch to dark theme"
                aria-pressed={theme === "dark"}
                title="Dark theme"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" fill="currentColor" fillOpacity="0.15" />
                </svg>
              </button>
            </div>
            <NotificationBell />

            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 text-tf-ink transition-colors sm:p-2"
              aria-label="Profile menu"
              aria-expanded={profileOpen}
              aria-controls={profileOpen ? "profile-dropdown" : undefined}
            >
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-tf-blue-pressed">
                {user?.profilePicture || user?.profile_picture || user?.profilepicture ? (
                  <img
                    src={user.profilePicture || user?.profile_picture || user?.profilepicture}
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
                className={`hidden h-4 w-4 text-tf-muted transition-transform sm:block ${
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
              <div id="profile-dropdown" className="absolute right-0 top-14 z-50 w-[min(288px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-tf-line bg-tf-surface text-tf-ink shadow-xl sm:w-52">
                <div className="flex items-center justify-between gap-3 border-b border-tf-line px-4 py-3">
                  <div className="min-w-0 flex-1">
                  <p className="truncate font-medium capitalize">
                    {user?.username
                      ? user.username.charAt(0).toUpperCase() +
                        user.username.slice(1)
                      : ""}
                  </p>
                  <p className="mt-1 truncate text-xs text-tf-copy">
                    {user?.email}
                  </p>
                  </div>
                  <span aria-hidden="true" className="h-8 w-px shrink-0 bg-tf-line sm:hidden" />
                  <button
                    type="button"
                    onClick={() => setTheme((current) => current === "light" ? "dark" : "light")}
                    aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
                    title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-tf-line bg-tf-surface-soft transition-colors hover:bg-tf-surface sm:hidden ${theme === "light" ? "text-indigo-500" : "text-amber-500"}`}
                  >
                    {theme === "light" ? (
                      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" fill="currentColor" fillOpacity="0.15" />
                      </svg>
                    ) : (
                      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
                        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                      </svg>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/subscription");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-tf-copy transition-colors hover:bg-tf-surface-soft hover:text-tf-ink"
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
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Unlock Features
                </button>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/profile");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-tf-copy transition-colors hover:bg-tf-surface-soft hover:text-tf-ink"
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
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-tf-copy transition-colors hover:bg-tf-surface-soft hover:text-tf-ink"
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
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
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
      <aside className="tf-sidebar fixed bottom-0 left-0 top-[72px] z-40 hidden w-[250px] flex-col border-r border-tf-line bg-tf-bg shadow-sm lg:flex">
        <nav className="flex flex-1 flex-col overflow-y-auto p-4">
          {/* Main features stay at the top */}
          <div className="space-y-2">{renderNavItems(orderedMainNavItems)}</div>

          {/* Secondary features stay at the bottom */}
          <div className="mt-auto space-y-2 border-t border-tf-line pt-4">
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
          <aside className="tf-sidebar absolute bottom-0 left-0 top-0 flex w-[280px] flex-col border-r border-tf-line bg-tf-bg shadow-2xl">
            <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-tf-line px-5">
              <img
                src="/tf-logo.png"
                alt="TutorFolio"
                className="h-10 max-h-10 w-auto max-w-[135px] object-contain"
              />

              <button
                onClick={closeMobileSidebar}
                className="rounded-lg p-2 text-tf-copy transition-colors hover:bg-tf-surface-soft hover:text-tf-ink"
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
              <div className="mt-auto space-y-2 border-t border-tf-line pt-4">
                {renderNavItems(secondaryNavItems, true)}
              </div>
            </nav>
          </aside>
        </div>
      )}

      {/* ================= MAIN CONTENT ================= */}
      <main className="tf-mobile-platform pt-[72px] lg:pl-[250px] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

export default TutorLayout;

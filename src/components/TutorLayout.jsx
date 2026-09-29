import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

function TutorLayout() {
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const profileRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
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
      name: "Students Achievements",
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
            d="M8 10h8M8 14h5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20 11.5a7.5 7.5 0 01-7.5 7.5H8l-4 2v-5.2A7.5 7.5 0 1112.5 4H13a7.5 7.5 0 017 7.5z"
          />
        </svg>
      ),
    },
  ];

  const closeMobileSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white font-poppins">
      {/* ================= NAVBAR ================= */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-[#0a1628] border-b border-blue-500/10">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#c7d8f5] hover:text-white transition-colors"
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
              className="flex items-center"
            >
              <img
                src="/tf-logo.png"
                alt="TutorFolio"
                className="w-[135px] sm:w-[150px] h-auto object-contain"
              />
            </button>
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#0f1f36] transition-colors"
              aria-label="Profile menu"
            >
              <div className="w-9 h-9 rounded-full bg-[#0f1f36] border border-blue-500/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-[#c7d8f5]"
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
              </div>

              <svg
                className={`hidden sm:block w-4 h-4 text-[#94a8c7] transition-transform ${
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
              <div className="absolute right-0 top-14 w-52 bg-[#0f1f36] border border-blue-500/10 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-blue-500/10">
                  <p className="text-white font-medium truncate">
                    {user?.username}
                  </p>
                  <p className="text-[#94a8c7] text-xs truncate mt-1">
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-[#c7d8f5] hover:bg-[#142744] hover:text-white transition-colors text-left"
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
      <aside className="hidden lg:flex fixed top-[72px] left-0 bottom-0 w-[250px] bg-[#0a1628] border-r border-blue-500/10 flex-col z-40">
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-[#94a8c7] hover:bg-[#0f1f36] hover:text-white"
                }`
              }
            >
              {item.icon}
              <span className="text-sm font-medium">{item.name}</span>
            </NavLink>
          ))}
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
          <aside className="absolute top-0 left-0 bottom-0 w-[280px] bg-[#0a1628] border-r border-blue-500/10 shadow-2xl">
            <div className="h-[72px] px-5 flex items-center justify-between border-b border-blue-500/10">
              <img
                src="/tf-logo.png"
                alt="TutorFolio"
                className="w-[135px] h-auto object-contain"
              />

              <button
                onClick={closeMobileSidebar}
                className="p-2 text-[#94a8c7] hover:text-white transition-colors"
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

            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-[#94a8c7] hover:bg-[#0f1f36] hover:text-white"
                    }`
                  }
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.name}</span>
                </NavLink>
              ))}
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
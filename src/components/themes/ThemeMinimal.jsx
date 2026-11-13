import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ExpandableText from "../ExpandableText";
import ClassicGallery from "./ClassicGallery";

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const fd = (src, keys, fb = "") => {
  for (const k of keys) if (src?.[k] != null && src?.[k] !== "") return src[k];
  return fb;
};

const list = (v) =>
  Array.isArray(v)
    ? v
    : v
      ? String(v).split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
      : [];

const dateLabel = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
};

const asUrl = (v) =>
  /^https?:\/\//i.test(String(v || "")) ? v : v ? `https://${v}` : "";

const pageLinks = [
  { id: "home", label: "Home", icon: "home" },
  { id: "about", label: "About", icon: "user" },
  { id: "classes", label: "Classes", icon: "book" },
  { id: "batches", label: "Batches", icon: "calendar" },
  { id: "gallery", label: "Gallery", icon: "image" },
  { id: "achievements", label: "Achievements", icon: "award" },
  { id: "experience", label: "Experience", icon: "briefcase" },
];

/* ─── Modern Minimal Icon Library ─────────────────────────────────────────── */
function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    home: (
      <>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
    user: (
      <>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </>
    ),
    arrowUpRight: (
      <>
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10" />
        <path d="M6 10h7" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.7L7.7 9.7a16 16 0 0 0 6.6 6.6l1.3-1.3a2 2 0 0 1 1.7-.6l3 .5a2 2 0 0 1 1.7 2Z" />
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.25" />
        <path d="M12 2v2.2M12 19.8v2.2M4.93 4.93l1.55 1.55M17.52 17.52l1.55 1.55M2 12h2.2M19.8 12h2.2M4.93 19.07l1.55-1.55M17.52 6.48l1.55-1.55" />
      </>
    ),
    moon: (
      <path
        d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"
        fill="currentColor"
        fillOpacity="0.2"
      />
    ),
    message: (
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
    ),
    menu: (
      <>
        <line x1="4" y1="7" x2="20" y2="7" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="17" x2="20" y2="17" />
      </>
    ),
    x: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    award: (
      <>
        <circle cx="12" cy="8" r="6" />
        <path d="m15.4 12.8 2.6 8.2-6-3.5-6 3.5 2.6-8.2" />
      </>
    ),
    briefcase: (
      <>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </>
    ),
    star: (
      <path
        d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="currentColor"
      />
    ),
    chevronRight: <polyline points="9 18 15 12 9 6" />,
    chevronDown: <polyline points="6 9 12 15 18 9" />,
    check: <polyline points="20 6 9 17 4 12" />,
    copy: (
      <>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    sparkles: (
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    ),
    layers: (
      <>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </>
    ),
    graduationCap: (
      <>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
    quote: (
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h4c0 3-1 4-5 4v4zm14 0c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h4c0 3-1 4-5 4v4z" />
    ),
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

/* ─── Minimalist SVG Illustrations ─────────────────────────────────────────── */

/** Modern geometric architectural graphic for hero */
function HeroMinimalIllustration({ className = "w-full max-w-sm" }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 360 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-md"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="min-g1" x1="60" y1="40" x2="300" y2="260" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="0.5" stopColor="#0ea5e9" stopOpacity="0.15" />
            <stop offset="1" stopColor="#14b8a6" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="min-card" x1="0" y1="0" x2="180" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.08" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Ambient background aura */}
        <circle cx="180" cy="150" r="110" fill="url(#min-g1)" />

        {/* Minimal grid lines */}
        <g stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="4 4">
          <line x1="40" y1="80" x2="320" y2="80" />
          <line x1="40" y1="150" x2="320" y2="150" />
          <line x1="40" y1="220" x2="320" y2="220" />
          <line x1="100" y1="40" x2="100" y2="260" />
          <line x1="180" y1="40" x2="180" y2="260" />
          <line x1="260" y1="40" x2="260" y2="260" />
        </g>

        {/* Concentric clean focus rings */}
        <circle cx="180" cy="150" r="85" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
        <circle cx="180" cy="150" r="55" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="6 6" />

        {/* Modern Floating Prism Card */}
        <g transform="translate(100, 85)">
          <rect width="160" height="110" rx="16" fill="url(#min-card)" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
          <circle cx="32" cy="35" r="14" fill="#6366f1" fillOpacity="0.2" stroke="#6366f1" strokeWidth="1.5" />
          <path d="M28 35l3 3 6-6" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="56" y="28" width="70" height="7" rx="3.5" fill="currentColor" fillOpacity="0.6" />
          <rect x="56" y="40" width="45" height="5" rx="2.5" fill="currentColor" fillOpacity="0.25" />
          {/* Progress bar */}
          <rect x="24" y="68" width="112" height="6" rx="3" fill="currentColor" fillOpacity="0.08" />
          <rect x="24" y="68" width="78" height="6" rx="3" fill="#0ea5e9" fillOpacity="0.8" />
          <rect x="24" y="86" width="30" height="5" rx="2.5" fill="currentColor" fillOpacity="0.3" />
          <rect x="110" y="86" width="26" height="5" rx="2.5" fill="currentColor" fillOpacity="0.3" />
        </g>

        {/* Satellites */}
        <g transform="translate(45, 125)">
          <rect width="64" height="32" rx="16" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
          <circle cx="18" cy="16" r="4" fill="#10b981" />
          <rect x="28" y="13" width="24" height="6" rx="3" fill="currentColor" fillOpacity="0.4" />
        </g>

        <g transform="translate(245, 175)">
          <rect width="70" height="34" rx="17" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
          <polygon points="18,12 20,17 25,18 21,21 22,26 18,23 14,26 15,21 11,18 16,17" fill="#f59e0b" />
          <rect x="30" y="14" width="28" height="6" rx="3" fill="currentColor" fillOpacity="0.5" />
        </g>
      </svg>
    </div>
  );
}

/** Modern minimal Trophy/Achievement vector placeholder */
function AchievementIllustration({ className = "h-44 w-full" }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-neutral-100/70 dark:bg-neutral-800/50 ${className}`}>
      <svg viewBox="0 0 200 160" fill="none" className="h-32 w-32" aria-hidden="true">
        <circle cx="100" cy="80" r="60" fill="currentColor" className="text-amber-500/10 dark:text-amber-400/10" />
        <circle cx="45" cy="45" r="2.5" fill="#f59e0b" />
        <circle cx="155" cy="50" r="3" fill="#eab308" />
        <circle cx="145" cy="115" r="2" fill="#f59e0b" />
        <path d="M70 42h60v32c0 16.5-13.5 30-30 30s-30-13.5-30-30V42Z" fill="currentColor" className="text-amber-500/20 dark:text-amber-400/20" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M70 52H54c-5.5 0-10 4.5-10 10 0 7 5.5 12 12.5 12H70" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M130 52h16c5.5 0 10 4.5 10 10 0 7-5.5 12-12.5 12H130" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M100 104v20M82 124h36" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        <polygon points="100,56 103,64 111,64 105,68 107,76 100,71 93,76 95,68 89,64 97,64" fill="#f59e0b" />
      </svg>
    </div>
  );
}

/** Modern minimal Study / Batch vector placeholder */
function BatchIllustration({ className = "h-44 w-full" }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-neutral-100/70 dark:bg-neutral-800/50 ${className}`}>
      <svg viewBox="0 0 200 160" fill="none" className="h-32 w-32" aria-hidden="true">
        <circle cx="100" cy="80" r="55" fill="currentColor" className="text-indigo-500/10 dark:text-indigo-400/10" />
        <g stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M100 62v48M100 62c-12-8-28-7-42-2v48c14-5 30-6 42 2M100 62c12-8 28-7 42-2v48c-14-5-30-6-42 2" fill="currentColor" className="text-indigo-500/15 dark:text-indigo-400/15" />
          <path d="M68 76h20M68 86h16M112 76h20M112 86h16" strokeOpacity="0.6" strokeWidth="1.5" />
        </g>
        <g transform="translate(85, 32)">
          <polygon points="15,4 28,10 15,16 2,10" fill="#6366f1" stroke="#6366f1" strokeWidth="1.5" />
          <path d="M6 12v6c0 3 4.5 5 9 5s9-2 9-5v-6" fill="none" stroke="#6366f1" strokeWidth="1.5" />
          <line x1="28" y1="10" x2="28" y2="18" stroke="#6366f1" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

/** Tailored Minimalist Empty State SVGs */
function EmptyStateIllustration({ type = "default", className = "h-20 w-20 mx-auto text-neutral-400 dark:text-neutral-600" }) {
  if (type === "batches") {
    return (
      <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
        <rect x="18" y="24" width="60" height="52" rx="10" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
        <rect x="30" y="16" width="6" height="12" rx="3" fill="currentColor" />
        <rect x="60" y="16" width="6" height="12" rx="3" fill="currentColor" />
        <circle cx="48" cy="52" r="14" stroke="currentColor" strokeWidth="2" />
        <polyline points="48 44 48 52 54 55" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "achievements") {
    return (
      <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
        <circle cx="48" cy="42" r="22" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
        <polygon points="48,30 51,38 60,38 53,43 55,51 48,46 41,51 43,43 36,38 45,38" fill="currentColor" />
        <path d="M38 58l-8 22 18-8 18 8-8-22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "gallery") {
    return (
      <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
        <rect x="18" y="20" width="60" height="56" rx="10" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="34" cy="36" r="5" stroke="currentColor" strokeWidth="2" />
        <path d="M22 64l18-18 14 14 12-10 12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "experience") {
    return (
      <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
        <rect x="20" y="30" width="56" height="46" rx="8" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M38 30V22a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v8" stroke="currentColor" strokeWidth="2" />
        <line x1="20" y1="50" x2="76" y2="50" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="48" cy="50" r="4" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
      <circle cx="48" cy="48" r="32" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M48 36v16m0 8h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Subject Icon Selector (Context-aware SVG) ────────────────────────────── */
function SubjectIcon({ name, className = "h-4 w-4" }) {
  const lower = String(name || "").toLowerCase();
  if (lower.includes("math") || lower.includes("calc") || lower.includes("algebra") || lower.includes("geom")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
        <path d="M4 19L9 5M9 5H20M12 12H19M7 19H17" />
      </svg>
    );
  }
  if (lower.includes("physic") || lower.includes("atom") || lower.includes("quantum")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    );
  }
  if (lower.includes("chem") || lower.includes("lab") || lower.includes("bio")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M10 2v7.31L4.14 19.3A2 2 0 0 0 5.86 22h12.28a2 2 0 0 0 1.72-2.7L14 9.31V2M8.5 2h7M7 16h10" />
      </svg>
    );
  }
  if (lower.includes("code") || lower.includes("program") || lower.includes("comput") || lower.includes("it")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="10" y1="19" x2="14" y2="5" />
      </svg>
    );
  }
  if (lower.includes("eng") || lower.includes("lang") || lower.includes("gram") || lower.includes("liter")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M8 7h8M8 11h5" />
      </svg>
    );
  }
  return <Icon name="book" className={className} />;
}

/* ─── Avatar ───────────────────────────────────────────────────────────────── */
function Avatar({ src, name, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <div
      aria-label={name}
      className={`flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 font-bold text-neutral-600 dark:text-neutral-300 ${className}`}
    >
      {name?.trim()?.[0]?.toUpperCase() || "T"}
    </div>
  );
}

/* ─── Subject & Feature Chips ──────────────────────────────────────────────── */
function SubjectChip({ label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-neutral-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 shadow-2xs transition hover:border-neutral-300 hover:shadow-xs dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-200">
      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
        <SubjectIcon name={label} className="h-3.5 w-3.5" />
      </span>
      <span>{label}</span>
    </span>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200/90 bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300">
      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/80" />
      {children}
    </span>
  );
}

/* ─── PageHeading ──────────────────────────────────────────────────────────── */
function PageHeading({ title, description, badge }) {
  return (
    <div className="mb-10 max-w-2xl">
      {badge && (
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-400">
          <Icon name="sparkles" className="h-3.5 w-3.5 text-indigo-500" />
          {badge}
        </span>
      )}
      <h1 className="text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-2.5 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
      )}
    </div>
  );
}

/* ─── Section Divider & Title ──────────────────────────────────────────────── */
function SectionTitle({ icon, title, subtitle, action, actionLabel = "View all" }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200/60 pb-3 dark:border-neutral-800/60">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200/70 bg-white text-neutral-800 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
            <Icon name={icon} className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
          </span>
        )}
        <div>
          <h2 className="text-lg font-bold tracking-tight text-neutral-950 dark:text-white sm:text-xl">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <Link
          to={action}
          className="group inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-neutral-600 transition hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400"
        >
          {actionLabel}
          <Icon name="arrow" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/* ─── Batch Card ───────────────────────────────────────────────────────────── */
function BatchImage({ batch, className }) {
  const src = fd(batch, ["imageUrl", "image_url", "batchImageUrl", "batchImage"]);
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <BatchIllustration className={className} />;
  }
  return (
    <img
      src={src}
      alt={fd(batch, ["title", "batchName"], "Batch")}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover bg-neutral-100 dark:bg-neutral-800 ${className}`}
    />
  );
}

function BatchCard({ batch }) {
  const title = fd(batch, ["title", "batchName"], "Learning group");
  const type = fd(batch, ["batchType", "type", "session"], "Class");
  const isCurrent = /current|running/i.test(type);
  const fee = fd(batch, ["fee"]);
  const eligibleClasses = fd(batch, ["eligibleClasses", "eligible_classes"]);
  const schedule = dateLabel(fd(batch, ["startOn"]));

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white transition-all duration-300 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/90 dark:hover:border-neutral-700">
      <div className="relative">
        <BatchImage batch={batch} className="h-44 w-full sm:h-48" />
        <span
          className={`absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md shadow-2xs ${
            isCurrent
              ? "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30"
              : "bg-neutral-900/70 text-white dark:bg-neutral-800/90 border border-white/20"
          }`}
        >
          {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          {type}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold text-neutral-950 [overflow-wrap:anywhere] dark:text-white sm:text-lg">
          {title}
        </h3>

        {fd(batch, ["description"]) && (
          <ExpandableText
            lines={2}
            className="mt-2.5 text-sm leading-6 text-neutral-600 dark:text-neutral-400"
            preserveWhitespace
          >
            {fd(batch, ["description"])}
          </ExpandableText>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 text-xs dark:border-neutral-800/80">
          {eligibleClasses && (
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                <Icon name="graduationCap" className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-neutral-400">Classes</p>
                <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">{eligibleClasses}</p>
              </div>
            </div>
          )}

          {fee && (
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 font-bold text-xs">
                ₹
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-neutral-400">Fee</p>
                <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                  ₹{fee} {fd(batch, ["paymentType"]) ? `/${batch.paymentType}` : ""}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              <Icon name="calendar" className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">Starts</p>
              <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                {schedule || "Contact tutor"}
              </p>
            </div>
          </div>

          {batch.maximumSeats != null && (
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                <Icon name="users" className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-neutral-400">Seats</p>
                <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                  {Math.max(0, Number(batch.maximumSeats) - Number(batch.allottedSeats || 0))} open
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─── Achievement Card ─────────────────────────────────────────────────────── */
function AchievementCard({ item }) {
  const title = fd(item, ["title"], "Student Achievement");
  const rating = Number(fd(item, ["studentRating", "rating"], 0));
  const studentName = fd(item, ["studentName"]);
  const studentSrc = fd(item, ["studentImageUrl", "student_image_url", "studentImage", "studentPhoto"]);
  const achievementSrc = fd(item, ["achievementImageUrl", "achievement_image_url", "imageUrl", "image"]);
  const [failedA, setFailedA] = useState(false);
  const [failedS, setFailedS] = useState(false);

  const hasA = Boolean(achievementSrc && !failedA);
  const hasS = Boolean(studentSrc && !failedS);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white transition-all duration-300 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/90 dark:hover:border-neutral-700">
      {hasA ? (
        <div className="h-48 overflow-hidden bg-neutral-100 dark:bg-neutral-800 sm:h-52">
          <img
            src={achievementSrc}
            alt={title}
            onError={() => setFailedA(true)}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
          />
        </div>
      ) : hasS ? (
        <div className="h-48 overflow-hidden bg-neutral-100 dark:bg-neutral-800 sm:h-52 flex items-center justify-center">
          <img
            src={studentSrc}
            alt={studentName || "Student"}
            onError={() => setFailedS(true)}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <AchievementIllustration className="h-44 sm:h-48" />
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
              item.studentReview
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            }`}
          >
            <Icon name={item.studentReview ? "sparkles" : "award"} className="h-3 w-3" />
            {item.studentReview ? "Student Story" : "Milestone"}
          </span>

          {rating > 0 && (
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Icon name="star" className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>{rating}/5</span>
            </div>
          )}
        </div>

        <h3 className="mt-3 text-base font-bold text-neutral-950 [overflow-wrap:anywhere] dark:text-white">
          {title}
        </h3>

        {item.description && (
          <ExpandableText
            lines={3}
            className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400"
            preserveWhitespace
          >
            {item.description}
          </ExpandableText>
        )}

        {item.studentReview && (
          <blockquote className="relative mt-4 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3.5 dark:border-neutral-800 dark:bg-neutral-800/40">
            <span className="absolute -top-2 left-3 text-neutral-300 dark:text-neutral-600">
              <Icon name="quote" className="h-4 w-4" />
            </span>
            <ExpandableText
              lines={2}
              className="text-xs italic leading-5 text-neutral-700 dark:text-neutral-300 pt-1"
            >
              "{item.studentReview}"
            </ExpandableText>
          </blockquote>
        )}

        {(studentName || hasS) && (
          <div className="mt-4 flex items-center gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            {hasS ? (
              <img
                src={studentSrc}
                alt={studentName}
                onError={() => setFailedS(true)}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 font-semibold text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                {studentName?.charAt(0) || "S"}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                {studentName || "Student"}
              </p>
              <p className="text-[10px] text-neutral-400">Verified learner</p>
            </div>
          </div>
        )}

        {list(item.tags).length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {list(item.tags).map((tag, i) => (
              <Chip key={i}>{tag}</Chip>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

/* ─── Stat Card with SVG Graphic ──────────────────────────────────────────── */
function StatCard({ value, label, icon, accent = "indigo" }) {
  if (!value && value !== 0) return null;
  const accents = {
    indigo: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-900/60",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-900/60",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-100 dark:border-amber-900/60",
  };
  return (
    <div className="group relative flex items-center gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-300 hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/80 dark:hover:border-neutral-700">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${accents[accent] || accents.indigo} transition-transform group-hover:scale-105`}>
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white tabular-nums">
          {value}
        </span>
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
          {label}
        </p>
      </div>
    </div>
  );
}

/* ─── Social Row ──────────────────────────────────────────────────────────── */
const socialMeta = {
  youtube: ["YouTube", "#ef4444", "▶"],
  instagram: ["Instagram", "#db2777", "◎"],
  facebook: ["Facebook", "#2563eb", "f"],
  linkedin: ["LinkedIn", "#0284c7", "in"],
  telegram: ["Telegram", "#0891b2", "➤"],
  whatsapp: ["WhatsApp", "#059669", "◉"],
  x: ["X", "#171717", "𝕏"],
  twitter: ["X", "#171717", "𝕏"],
};

function SocialRow({ links }) {
  if (!links.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {links.map(([key, url]) => {
        const [label, color, mark] = socialMeta[key.toLowerCase()] || [key, "#737373", "↗"];
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            className="group flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200/80 bg-white font-bold text-sm text-neutral-800 shadow-2xs transition-all hover:-translate-y-0.5 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
          >
            <span style={{ color }} className="transition-transform group-hover:scale-110">
              {mark}
            </span>
          </a>
        );
      })}
    </div>
  );
}

/* ─── Floating Quick Action Buttons ───────────────────────────────────────── */
function FloatingContact({ profile, socialLinks }) {
  const phone = String(fd(profile, ["mobileNo", "mobile_no"])).trim().replace(/[^+\d]/g, "");
  const whatsappNumber = String(fd(profile, ["whatsappNo", "whatsapp_no"])).replace(/\D/g, "");
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : socialLinks.find(([key]) => key.toLowerCase() === "whatsapp")?.[1];

  if (!phone && !whatsappUrl) return null;

  return (
    <aside
      aria-label="Contact tutor"
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex flex-col gap-2.5 sm:right-6"
    >
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp tutor"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:scale-105 hover:bg-emerald-700 active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.4-.2-3 .8.8-2.9-.3-.5A8 8 0 1 1 12 20Zm4.4-5.8c-.2-.1-1.4-.7-1.6-.7s-.4-.1-.5.1l-.8 1c-.1.1-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.3.2-.5.6-1 .1-.2.1-.3 0-.5L9.7 8.8c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.6.6-.9 1.3-.8 2.1 0 1.2.9 2.4 1 2.6.2.2 1.8 2.8 4.3 3.8 1.6.6 2.3.7 3.1.5.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.2-.3-.3-.8-.5Z" />
          </svg>
        </a>
      )}
      {phone && (
        <a
          href={`tel:${phone}`}
          aria-label="Call tutor"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition hover:scale-105 hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
        >
          <Icon name="phone" className="h-5 w-5" />
        </a>
      )}
    </aside>
  );
}

/* ─── Mobile Drawer ────────────────────────────────────────────────────────── */
function MobileNav({ basePath, currentPage, open, onClose, name }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <nav className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white p-6 shadow-2xl dark:bg-neutral-900 flex flex-col">
        <div className="mb-6 flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
              TF
            </span>
            <span className="text-sm font-bold text-neutral-950 dark:text-white truncate">
              {name}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Close menu"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <ul className="space-y-1.5 flex-1 overflow-y-auto">
          {pageLinks.map((page) => (
            <li key={page.id}>
              <Link
                to={page.id === "home" ? basePath : `${basePath}/${page.id}`}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  currentPage === page.id
                    ? "bg-indigo-50 font-semibold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                }`}
              >
                <Icon name={page.icon || "arrow"} className="h-4 w-4" />
                {page.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400">
          Modern Minimal Theme · TutorFolio
        </div>
      </nav>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PAGE: HOME
   ═══════════════════════════════════════════════════════════════════════════════ */
function HomePage({
  name, profile, tuition, subjects, batches, achievements, gallery,
  location, socialLinks, onContactClick, basePath, onCopyLink, copyMessage,
}) {
  const intro = fd(
    profile,
    ["about", "description"],
    "Dedicated educator focused on structured learning, clear concept building, and consistent academic progress."
  );
  const experience = fd(profile, ["teachingYOE", "teaching_yoe"]);
  const qualification = fd(profile, ["qualification"]);
  const avatarSrc = fd(profile, ["profilePicture", "profile_picture", "profilePhoto", "avatar"]);
  const previewImages = gallery
    .filter((img) => fd(img, ["fileUrl", "url", "imageUrl", "src"]))
    .slice(0, 4);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden rounded-3xl border border-neutral-200/80 bg-gradient-to-b from-white via-white to-neutral-50/70 p-6 sm:p-10 lg:p-12 dark:border-neutral-800/80 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950/80 shadow-xs">
        {/* Subtle decorative grid mesh */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]" />

        {/* Ambient radial glow background */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/15" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-500/10" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            {/* Verified badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200/90 bg-neutral-100/70 px-3 py-1 text-xs font-semibold text-neutral-700 backdrop-blur-xs dark:border-neutral-700/80 dark:bg-neutral-800/60 dark:text-neutral-300">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Icon name="check" className="h-2.5 w-2.5" />
              </span>
              <span>Verified Educator</span>
              {location && <span className="text-neutral-400">· {location}</span>}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-950 sm:text-5xl dark:text-white">
              {name}
            </h1>

            {qualification && (
              <p className="mt-2 text-base font-semibold text-indigo-600 dark:text-indigo-400">
                {qualification}
              </p>
            )}

            <ExpandableText
              lines={3}
              className="mt-4 max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-base"
              preserveWhitespace
            >
              {intro}
            </ExpandableText>

            {/* CTAs */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onContactClick}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100"
              >
                <Icon name="message" className="h-4 w-4" />
                Message Tutor
              </button>

              <Link
                to={`${basePath}/classes`}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-750"
              >
                Explore Classes
                <Icon name="arrow" className="h-4 w-4" />
              </Link>

              {onCopyLink && (
                <button
                  type="button"
                  onClick={onCopyLink}
                  title="Share profile"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-50 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  <Icon name="copy" className="h-4 w-4" />
                </button>
              )}
            </div>

            {copyMessage && (
              <p className="mt-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                ✓ {copyMessage}
              </p>
            )}
          </div>

          {/* Right Hero: Avatar + Integrated Minimal Geometric SVG + Floating Glass Cards */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Ambient geometric illustration background */}
            <div className="absolute inset-0 flex items-center justify-center scale-110 pointer-events-none opacity-40 dark:opacity-30">
              <HeroMinimalIllustration className="w-full h-full max-w-md" />
            </div>

            <div className="relative">
              {/* Glowing gradient halo */}
              <div className="absolute -inset-2.5 rounded-3xl bg-gradient-to-tr from-indigo-500/30 via-sky-500/20 to-teal-500/30 blur-xl" />

              {/* Avatar Frame */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-white/90 bg-white p-1 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
                <Avatar
                  src={avatarSrc}
                  name={name}
                  className="h-48 w-48 sm:h-60 sm:w-60 rounded-xl"
                />
              </div>

              {/* Floating micro badges */}
              <div className="absolute -top-3 -left-4 sm:-left-6 inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white/90 px-3 py-1 text-[11px] font-bold text-neutral-800 shadow-md backdrop-blur-md dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-neutral-200">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Icon name="check" className="h-2.5 w-2.5" />
                </span>
                <span>Verified Tutor</span>
              </div>

              {experience && (
                <div className="absolute -bottom-3 -right-3 sm:-right-5 inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white/90 px-3 py-1 text-[11px] font-bold text-neutral-800 shadow-md backdrop-blur-md dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-neutral-200">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-white">
                    <Icon name="award" className="h-2.5 w-2.5" />
                  </span>
                  <span>{experience} Yrs Experience</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Metrics ── */}
      <section aria-label="Key highlights" className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <StatCard
          value={subjects.length || "Focused"}
          label="Subjects Offered"
          icon="book"
          accent="indigo"
        />
        <StatCard
          value={experience ? `${experience} Yrs` : batches.length || "Active"}
          label={experience ? "Teaching Experience" : "Active Batches"}
          icon="clock"
          accent="emerald"
        />
        <StatCard
          value={achievements.length || "Proven"}
          label="Student Milestones"
          icon="award"
          accent="amber"
        />
      </section>

      {/* ── Pedagogical Pillars (SVG Features) ── */}
      <section aria-label="Why learn with this tutor" className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 dark:border-neutral-800/80 dark:bg-neutral-900/80 shadow-2xs">
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Teaching Approach
          </span>
          <h2 className="mt-1 text-xl font-bold text-neutral-950 dark:text-white sm:text-2xl">
            A structured method for real results
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-neutral-100 bg-neutral-50/60 p-5 dark:border-neutral-800 dark:bg-neutral-800/40">
            <div className="mb-3.5">
              <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10 text-indigo-500" aria-hidden="true">
                <rect x="6" y="28" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.1" />
                <rect x="26" y="16" width="16" height="26" rx="3" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.2" />
                <rect x="6" y="8" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 3" />
                <path d="M14 22v6M34 10v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Concept Clarity</h3>
            <p className="mt-1.5 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              Breaking down complex principles into logical, memorable building blocks.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-100 bg-neutral-50/60 p-5 dark:border-neutral-800 dark:bg-neutral-800/40">
            <div className="mb-3.5">
              <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10 text-emerald-500" aria-hidden="true">
                <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 3" />
                <circle cx="24" cy="24" r="11" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
                <circle cx="24" cy="24" r="4" fill="currentColor" />
                <line x1="24" y1="2" x2="24" y2="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="24" y1="40" x2="24" y2="46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="2" y1="24" x2="8" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="40" y1="24" x2="46" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Structured Practice</h3>
            <p className="mt-1.5 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              Targeted homework, timed exercises, and continuous doubt-clearing sessions.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-100 bg-neutral-50/60 p-5 dark:border-neutral-800 dark:bg-neutral-800/40">
            <div className="mb-3.5">
              <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10 text-amber-500" aria-hidden="true">
                <path d="M10 38V12a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H18l-8 6z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.12" />
                <path d="M24 16v8M24 28h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Direct Mentorship</h3>
            <p className="mt-1.5 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              Personalized guidance to build confidence and overcome specific subject hurdles.
            </p>
          </div>
        </div>
      </section>

      {/* ── Batches Preview ── */}
      {batches.length > 0 && (
        <section aria-labelledby="home-batches">
          <SectionTitle
            icon="calendar"
            title="Active & Upcoming Batches"
            subtitle="Find the right learning schedule for your level"
            action={`${basePath}/batches`}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {batches.slice(0, 2).map((batch, i) => (
              <BatchCard key={batch.batchId ?? batch.id ?? i} batch={batch} />
            ))}
          </div>
        </section>
      )}

      {/* ── Achievements Preview ── */}
      {achievements.length > 0 && (
        <section aria-labelledby="home-achievements">
          <SectionTitle
            icon="award"
            title="Student Milestones & Reviews"
            subtitle="Real progress backed by focused mentorship"
            action={`${basePath}/achievements`}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {achievements.slice(0, 2).map((item, i) => (
              <AchievementCard key={item.achievementId ?? item.id ?? i} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* ── Gallery Preview ── */}
      {previewImages.length > 0 && (
        <section aria-labelledby="home-gallery">
          <SectionTitle
            icon="image"
            title="Inside the Classroom"
            subtitle="Moments and study sessions from the tuition centre"
            action={`${basePath}/gallery`}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {previewImages.map((img, i) => (
              <div
                key={img.fileId ?? img.id ?? i}
                className="group relative aspect-4/3 overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800"
              >
                <img
                  src={fd(img, ["fileUrl", "url", "imageUrl", "src"])}
                  alt={fd(img, ["title", "originalFilename"], `Classroom photo ${i + 1}`)}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Social Channels ── */}
      {socialLinks.length > 0 && (
        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 dark:border-neutral-800/80 dark:bg-neutral-900/80">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Social & Online Presence
          </p>
          <SocialRow links={socialLinks} />
        </section>
      )}

      {/* ── Bottom Call To Action ── */}
      <section className="relative overflow-hidden rounded-3xl bg-neutral-950 p-8 text-center text-white sm:p-12 dark:bg-neutral-900 dark:border dark:border-neutral-800">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-radial from-indigo-500/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-300">
            <Icon name="sparkles" className="h-3 w-3" />
            Admissions Open
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Start your learning journey today
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Connect directly with the tutor to discuss batch availability, syllabus coverage, and learning goals.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onContactClick}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-neutral-950 shadow-sm transition hover:bg-neutral-100 active:scale-95"
            >
              <Icon name="message" className="h-4 w-4" />
              Send Enquiry
            </button>
            <Link
              to={`${basePath}/batches`}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95"
            >
              Browse Batches
            </Link>
          </div>
        </div>
      </section>

      <FloatingContact profile={profile} socialLinks={socialLinks} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PAGE: ABOUT
   ═══════════════════════════════════════════════════════════════════════════════ */
function AboutPage({ name, profile, tuition, socialLinks, faqs, onContactClick, onCopyLink, copyMessage }) {
  const about = fd(profile, ["about", "description"]);
  const location = [fd(tuition, ["city"]), fd(tuition, ["district"]), fd(tuition, ["state"])].filter(Boolean).join(", ");
  const email = fd(profile, ["email"]);
  const phone = fd(profile, ["mobileNo", "mobile_no"]);
  const whatsapp = fd(profile, ["whatsappNo", "whatsapp_no"]);

  const details = [
    { label: "Qualification", value: fd(profile, ["qualification"]), icon: "graduationCap" },
    { label: "Teaching Experience", value: fd(profile, ["teachingYOE", "teaching_yoe"]) ? `${fd(profile, ["teachingYOE", "teaching_yoe"])} years` : null, icon: "clock" },
    { label: "Tuition / Institute", value: fd(tuition, ["tuitionName", "tuitionClassName"]), icon: "briefcase" },
    { label: "Established Year", value: fd(tuition, ["establishedYear"]), icon: "calendar" },
    { label: "Languages", value: fd(tuition, ["languages"]), icon: "globe" },
    { label: "Location", value: location, icon: "pin" },
  ].filter((item) => item.value);

  return (
    <div className="space-y-12">
      <PageHeading
        badge="Profile & Background"
        title={`About ${fd(profile, ["firstName", "first_name"], name)}`}
        description="Learn more about the educator's philosophy, experience, and contact details."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 dark:border-neutral-800/80 dark:bg-neutral-900/90 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-4 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Icon name="user" className="h-4 w-4" />
            <span>Biography & Background</span>
          </div>
          <ExpandableText
            lines={6}
            className="text-sm sm:text-base leading-relaxed text-neutral-700 dark:text-neutral-300"
            preserveWhitespace
          >
            {about || "The tutor has not added a detailed biography yet."}
          </ExpandableText>
        </article>

        {/* Credentials Grid */}
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {details.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3.5 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xs dark:border-neutral-800/80 dark:bg-neutral-900/90"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                <Icon name={item.icon || "pin"} className="h-5 w-5 text-indigo-500" />
              </span>
              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  {item.label}
                </dt>
                <dd className="truncate text-sm font-semibold text-neutral-900 dark:text-white mt-0.5">
                  {item.value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      {/* ── FAQs Accordion ── */}
      {faqs.length > 0 && (
        <section aria-labelledby="about-faqs" className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 dark:border-neutral-800/80 dark:bg-neutral-900/90 shadow-2xs">
          <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Icon name="sparkles" className="h-4 w-4" />
            <span>Frequently Asked Questions</span>
          </div>

          <div className="divide-y divide-neutral-200/70 dark:divide-neutral-800/70">
            {faqs.map((faq, i) => (
              <details key={faq.faqId ?? faq.id ?? i} className="group py-4 [overflow-wrap:anywhere]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-neutral-900 dark:text-white">
                  <span>{fd(faq, ["title", "question"], "Question")}</span>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-transform group-open:rotate-180 dark:bg-neutral-800 dark:text-neutral-400">
                    <Icon name="chevronDown" className="h-3.5 w-3.5" />
                  </span>
                </summary>
                <ExpandableText
                  lines={4}
                  className="mt-2.5 pr-6 text-sm leading-6 text-neutral-600 dark:text-neutral-400"
                  preserveWhitespace
                >
                  {fd(faq, ["description", "answer"])}
                </ExpandableText>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ── Contact Section ── */}
      <section className="rounded-3xl border border-neutral-200/80 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 sm:p-10 text-white shadow-md dark:border-neutral-800">
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-300 mb-3">
              <Icon name="message" className="h-3.5 w-3.5" />
              Direct Communication
            </span>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Connect with {name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Have questions about syllabus, class schedules, or pricing? Reach out directly via the messaging channels below.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onContactClick}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-neutral-950 shadow-sm transition hover:bg-neutral-100 active:scale-95"
              >
                <Icon name="message" className="h-4 w-4" />
                Open Messenger
              </button>
              {onCopyLink && (
                <button
                  type="button"
                  onClick={onCopyLink}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-medium text-white transition hover:bg-white/10 active:scale-95"
                >
                  <Icon name="copy" className="h-4 w-4" />
                  {copyMessage || "Copy Website Link"}
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-200 transition hover:bg-white/10 hover:border-white/20"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Icon name="mail" className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400">Email Address</p>
                  <p className="truncate font-semibold">{email}</p>
                </div>
              </a>
            )}

            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-200 transition hover:bg-white/10 hover:border-white/20"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Icon name="phone" className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400">Phone</p>
                  <p className="truncate font-semibold">{phone}</p>
                </div>
              </a>
            )}

            {whatsapp && (
              <a
                href={`https://wa.me/${String(whatsapp).replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300 transition hover:bg-emerald-500/20"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Icon name="message" className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] text-emerald-400/80">WhatsApp</p>
                  <p className="truncate font-semibold">Message Tutor</p>
                </div>
              </a>
            )}

            {location && (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-200">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Icon name="pin" className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400">Location</p>
                  <p className="truncate font-semibold">{location}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PAGE: CLASSES
   ═══════════════════════════════════════════════════════════════════════════════ */
function ClassesPage({ tuition, subjects, services }) {
  const tuitionName = fd(tuition, ["tuitionName", "tuitionClassName"], "Independent Tutor");
  const eligibleClasses = fd(tuition, ["eligibleClasses", "eligible_classes"]);
  const languages = fd(tuition, ["languages"], "Available on enquiry");

  return (
    <div className="space-y-10">
      <PageHeading
        badge="Curriculum & Subjects"
        title="Subjects & Learning Formats"
        description="Comprehensive courses designed for concept mastery, school exams, and competitive preparation."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Subjects taught with custom subject SVGs */}
        <section className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 dark:border-neutral-800/80 dark:bg-neutral-900/90 shadow-2xs">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Icon name="book" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-neutral-950 dark:text-white">Subjects Taught</h2>
              <p className="text-xs text-neutral-500">Core academic curriculum</p>
            </div>
          </div>

          {subjects.length ? (
            <div className="flex flex-wrap gap-2.5">
              {subjects.map((s, i) => (
                <SubjectChip key={`${s}-${i}`} label={s} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">Subject information will be added soon.</p>
          )}

          {eligibleClasses && (
            <div className="mt-8 border-t border-neutral-100 pt-5 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
                <Icon name="graduationCap" className="h-4 w-4" />
                <span>Eligible Classes & Grades</span>
              </div>
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {eligibleClasses}
              </p>
            </div>
          )}
        </section>

        {/* Services & Modes */}
        <section className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 dark:border-neutral-800/80 dark:bg-neutral-900/90 shadow-2xs">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Icon name="layers" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-neutral-950 dark:text-white">Learning Modes & Services</h2>
              <p className="text-xs text-neutral-500">How classes and sessions are conducted</p>
            </div>
          </div>

          {services.length ? (
            <div className="flex flex-wrap gap-2.5">
              {services.map((s, i) => (
                <Chip key={`${s}-${i}`}>{s}</Chip>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">Modes available on direct enquiry.</p>
          )}

          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-5 dark:border-neutral-800">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Medium / Languages</p>
              <p className="mt-1 text-sm font-semibold text-neutral-800 dark:text-neutral-200">{languages}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Tuition Centre</p>
              <p className="mt-1 text-sm font-semibold text-neutral-800 dark:text-neutral-200">{tuitionName}</p>
            </div>
          </div>
        </section>
      </div>

      {/* ── Academic Pathway Banner ── */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-white to-sky-50/60 p-6 sm:p-8 dark:border-indigo-900/50 dark:from-neutral-900 dark:via-neutral-900 dark:to-indigo-950/40">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Need a customized schedule?
          </span>
          <h2 className="mt-1 text-xl font-bold text-neutral-950 dark:text-white">
            1-on-1 and small group batches available
          </h2>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 max-w-lg">
            Personalized attention to target specific academic weaknesses and build exam confidence.
          </p>
        </div>
        <Link
          to="../about#about-contact"
          className="inline-flex shrink-0 h-10 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
        >
          Enquire Now
          <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PAGE: BATCHES
   ═══════════════════════════════════════════════════════════════════════════════ */
function BatchesPage({ batches }) {
  const now = new Date();
  const sorted = [...batches].sort((a, b) => new Date(a.startOn || 0) - new Date(b.startOn || 0));
  const groups = [
    ["Current Batches", sorted.filter((b) => (!b.startOn || new Date(b.startOn) <= now) && (!b.endOn || new Date(b.endOn) >= now))],
    ["Upcoming Batches", sorted.filter((b) => b.startOn && new Date(b.startOn) > now)],
    ["Completed Batches", sorted.filter((b) => b.endOn && new Date(b.endOn) < now)],
  ].filter(([, items]) => items.length);

  return (
    <div className="space-y-12">
      <PageHeading
        badge="Timetable & Enrolment"
        title="Batches & Class Schedule"
        description="Browse current, upcoming, and previous learning groups with seat availability and timings."
      />

      {groups.length ? (
        <div className="space-y-12">
          {groups.map(([title, items]) => (
            <section key={title}>
              <div className="mb-5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {title} ({items.length})
                </h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {items.map((batch, i) => (
                  <BatchCard key={batch.batchId ?? batch.id ?? `${title}-${i}`} batch={batch} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900/60">
          <EmptyStateIllustration type="batches" />
          <h3 className="mt-4 text-base font-semibold text-neutral-800 dark:text-neutral-200">
            No public batches published yet
          </h3>
          <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
            Contact the tutor directly to check upcoming class schedules and personalized batch timings.
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PAGE: GALLERY
   ═══════════════════════════════════════════════════════════════════════════════ */
function GalleryPage({ gallery }) {
  return (
    <div className="space-y-8">
      <PageHeading
        badge="Visual Classroom"
        title="Learning Space Gallery"
        description="A glimpse inside whiteboard discussions, classroom focus, and learning milestones."
      />
      {gallery.length ? (
        <ClassicGallery gallery={gallery} />
      ) : (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900/60">
          <EmptyStateIllustration type="gallery" />
          <h3 className="mt-4 text-base font-semibold text-neutral-800 dark:text-neutral-200">
            No gallery photos uploaded yet
          </h3>
          <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
            Classroom photos and event highlights will appear here when added by the tutor.
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PAGE: ACHIEVEMENTS
   ═══════════════════════════════════════════════════════════════════════════════ */
function AchievementsPage({ achievements }) {
  return (
    <div className="space-y-10">
      <PageHeading
        badge="Success Stories"
        title="Student Achievements & Milestones"
        description="Celebrating student milestones, competitive exam ranks, and testimonials."
      />

      {achievements.length ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {achievements.map((item, i) => (
            <AchievementCard key={item.achievementId ?? item.id ?? i} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900/60">
          <EmptyStateIllustration type="achievements" />
          <h3 className="mt-4 text-base font-semibold text-neutral-800 dark:text-neutral-200">
            No achievements published yet
          </h3>
          <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
            Student testimonials and test milestones will appear here once added.
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PAGE: EXPERIENCE
   ═══════════════════════════════════════════════════════════════════════════════ */
function ExperiencePage({ experience }) {
  return (
    <div className="space-y-10">
      <PageHeading
        badge="Career Timeline"
        title="Teaching Career & Experience"
        description="A timeline of educational appointments, tutoring roles, and professional contributions."
      />

      {experience.length ? (
        <div className="relative ml-4 space-y-8 border-l-2 border-neutral-200 pl-6 dark:border-neutral-800">
          {experience.map((item, i) => (
            <article key={item.experienceId ?? item.id ?? i} className="group relative">
              <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-indigo-600 ring-4 ring-neutral-100 dark:border-neutral-950 dark:bg-indigo-400 dark:ring-neutral-900" />
              <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xs transition hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900/80">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {dateLabel(item.startDate)}
                  {item.isCurrent ? " – Present" : item.endDate ? ` – ${dateLabel(item.endDate)}` : ""}
                </span>
                <h2 className="mt-1 text-base font-bold text-neutral-950 dark:text-white sm:text-lg">
                  {fd(item, ["title"], "Teaching Experience")}
                </h2>
                {item.description && (
                  <ExpandableText
                    lines={3}
                    className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400"
                    preserveWhitespace
                  >
                    {item.description}
                  </ExpandableText>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900/60">
          <EmptyStateIllustration type="experience" />
          <h3 className="mt-4 text-base font-semibold text-neutral-800 dark:text-neutral-200">
            No work experience listed yet
          </h3>
          <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
            Professional background and tutoring history will appear here once published.
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN THEME COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function ThemeMinimal({
  profile = {},
  tuition = {},
  achievements = [],
  batches = [],
  experience = [],
  faqs = [],
  gallery = [],
  username = "",
  currentPage = "home",
  onContactClick,
  onCopyLink,
  copyMessage = "",
}) {
  /* Dark / light mode toggle */
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem("tutorfolio:minimal-mode") || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("tutorfolio:minimal-mode", mode);
    } catch {}
  }, [mode]);

  const previousDocumentTheme = useRef(null);
  useEffect(() => {
    const root = document.documentElement;
    previousDocumentTheme.current = root.getAttribute("data-theme");
    return () => {
      if (previousDocumentTheme.current == null) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", previousDocumentTheme.current);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentPage]);

  const isDark = mode === "dark";

  /* Derived data */
  const name =
    [fd(profile, ["firstName", "first_name"]), fd(profile, ["lastName", "last_name"])].filter(Boolean).join(" ") ||
    fd(profile, ["username"], "Tutor");

  const location = [fd(tuition, ["city"]), fd(tuition, ["district"]), fd(tuition, ["state"])].filter(Boolean).join(", ");
  const subjects = list(fd(tuition, ["teachingSubjects", "teaching_subjects"]));
  const services = list(fd(tuition, ["services"]));
  const social = fd(profile, ["socialMedia"], {});
  const socialLinks = useMemo(
    () =>
      Object.entries(social || {})
        .filter(([, v]) => typeof v === "string" && v.trim())
        .map(([label, v]) => [label, asUrl(v.trim())])
        .filter(([, url]) => {
          try {
            const u = new URL(url);
            return ["http:", "https:"].includes(u.protocol) && u.hostname.includes(".");
          } catch {
            return false;
          }
        }),
    [social]
  );

  const basePath = `/tutor/${encodeURIComponent(username)}`;

  /* Mobile navigation drawer state */
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    setMobileNavOpen(false);
  }, [currentPage]);

  /* Active page routing */
  let content;
  if (currentPage === "about") {
    content = (
      <AboutPage
        name={name}
        profile={profile}
        tuition={tuition}
        socialLinks={socialLinks}
        faqs={faqs}
        onContactClick={onContactClick}
        onCopyLink={onCopyLink}
        copyMessage={copyMessage}
      />
    );
  } else if (currentPage === "classes") {
    content = <ClassesPage tuition={tuition} subjects={subjects} services={services} />;
  } else if (currentPage === "batches") {
    content = <BatchesPage batches={batches} />;
  } else if (currentPage === "gallery") {
    content = <GalleryPage gallery={gallery} />;
  } else if (currentPage === "achievements") {
    content = <AchievementsPage achievements={achievements} />;
  } else if (currentPage === "experience") {
    content = <ExperiencePage experience={experience} />;
  } else {
    content = (
      <HomePage
        socialLinks={socialLinks}
        name={name}
        profile={profile}
        tuition={tuition}
        subjects={subjects}
        batches={batches}
        achievements={achievements}
        gallery={gallery}
        location={location}
        onContactClick={onContactClick}
        basePath={basePath}
        onCopyLink={onCopyLink}
        copyMessage={copyMessage}
      />
    );
  }

  const navLinkClass = (id) =>
    `shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
      currentPage === id
        ? "bg-neutral-900 text-white shadow-2xs dark:bg-white dark:text-neutral-950"
        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
    }`;

  return (
    <div data-theme={mode} className="theme-minimal-root">
      <div className="min-h-screen bg-[#FAFAFA] font-sans text-neutral-900 antialiased transition-colors duration-200 dark:bg-[#0A0A0B] dark:text-neutral-100 selection:bg-indigo-500/20 selection:text-indigo-600">
        {/* ── Top Navigation Bar ── */}
        <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-[#FAFAFA]/85 backdrop-blur-xl dark:border-neutral-800/70 dark:bg-[#0A0A0B]/85">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            {/* Left: Mobile menu toggle + Logo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 active:scale-95 lg:hidden dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                aria-label="Open navigation menu"
              >
                <Icon name="menu" className="h-5 w-5" />
              </button>

              <Link to={basePath} className="flex items-center gap-2.5 no-underline">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 font-bold text-xs text-white shadow-2xs">
                  {fd(tuition, ["tuitionName", "tuitionClassName"], name).charAt(0).toUpperCase()}
                </span>
                <span className="truncate text-base font-bold tracking-tight text-neutral-950 dark:text-white">
                  {fd(tuition, ["tuitionName", "tuitionClassName"], name)}
                </span>
              </Link>
            </div>

            {/* Center: Desktop links */}
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
              {pageLinks.map((page) => (
                <Link
                  key={page.id}
                  to={page.id === "home" ? basePath : `${basePath}/${page.id}`}
                  aria-current={currentPage === page.id ? "page" : undefined}
                  className={navLinkClass(page.id)}
                >
                  {page.label}
                </Link>
              ))}
            </nav>

            {/* Right: Theme Toggle & Contact */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode(isDark ? "light" : "dark")}
                aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                title={`Switch to ${isDark ? "light" : "dark"} mode`}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 active:scale-95 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
              >
                <Icon name={isDark ? "sun" : "moon"} className="h-4.5 w-4.5" />
              </button>

              <button
                type="button"
                onClick={onContactClick}
                className="hidden sm:inline-flex h-9 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100"
              >
                <Icon name="message" className="h-3.5 w-3.5" />
                Contact
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <MobileNav
          basePath={basePath}
          currentPage={currentPage}
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          name={name}
        />

        {/* ── Main Content Container ── */}
        <main className="mx-auto min-h-[75vh] max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
          {content}
        </main>

        {/* ── Modern Minimal Footer ── */}
        <footer className="border-t border-neutral-200/80 bg-white dark:border-neutral-800/80 dark:bg-neutral-900/60">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
            <div>
              <Link to={basePath} className="text-base font-bold text-neutral-950 dark:text-white">
                {fd(tuition, ["tuitionName", "tuitionClassName"], name)}
              </Link>
              <p className="mt-2 text-xs text-neutral-500 leading-relaxed max-w-xs">
                A verified tutor website powered by TutorFolio. Empowering educators with simple, modern portfolios.
              </p>
              <p className="mt-4 text-[11px] text-neutral-400">
                © {new Date().getFullYear()} {name}. All rights reserved.
              </p>
            </div>

            <nav aria-label="Footer quick links">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                Explore Pages
              </h3>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {pageLinks.map((page) => (
                  <li key={page.id}>
                    <Link
                      to={page.id === "home" ? basePath : `${basePath}/${page.id}`}
                      className="text-neutral-500 transition hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400"
                    >
                      {page.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex flex-col items-start gap-2.5 sm:items-end">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
                Platform
              </span>
              <a
                href="https://alpha.tutorfolio.site"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-bold text-neutral-800 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-200"
              >
                <img src="/tf-logo.png" alt="" className="h-5 w-5 object-contain" />
                <span>TutorFolio</span>
                <Icon name="arrowUpRight" className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-white" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

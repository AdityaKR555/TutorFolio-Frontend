import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ExpandableText from "../ExpandableText";
import ClassicGallery from "./ClassicGallery";
import TuitionLogo from "./TuitionLogo";

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
  { id: "home", label: "Overview", icon: "home" },
  { id: "about", label: "Executive Bio", icon: "user" },
  { id: "classes", label: "Masterclasses", icon: "book" },
  { id: "batches", label: "Cohorts", icon: "calendar" },
  { id: "gallery", label: "Atelier", icon: "image" },
  { id: "achievements", label: "Hall of Fame", icon: "trophy" },
  { id: "experience", label: "Pedigree", icon: "briefcase" },
];

/* ─── Premium SVG Icon System ────────────────────────────────────────────── */
function LuminaryIcon({ name, className = "h-5 w-5" }) {
  const icons = {
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
    book: (
      <>
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10" />
        <path d="M6 10h8" />
        <path d="M6 14h5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <circle cx="8" cy="15" r="1.2" fill="currentColor" />
        <circle cx="12" cy="15" r="1.2" fill="currentColor" />
        <circle cx="16" cy="15" r="1.2" fill="currentColor" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </>
    ),
    trophy: (
      <>
        <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
        <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
        <path d="M6 3h12v7a6 6 0 0 1-12 0V3Z" />
        <path d="M12 16v5" />
        <path d="M8 21h8" />
      </>
    ),
    briefcase: (
      <>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="12.01" />
      </>
    ),
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
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
    message: (
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
    ),
    star: (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" />
    ),
    sparkles: (
      <>
        <path d="m12 3 1.9 4.8L18.7 9.7l-4.8 1.9L12 16.4l-1.9-4.8L5.3 9.7l4.8-1.9Z" fill="currentColor" />
        <path d="M19 15l.9 2.2L22 18l-2.1.8L19 21l-.9-2.2L16 18l2.1-.8Z" fill="currentColor" />
        <path d="M5 16l.9 2.2L8 19l-2.1.8L5 22l-.9-2.2L2 19l2.1-.8Z" fill="currentColor" />
      </>
    ),
    shieldCheck: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    crown: (
      <>
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" fill="currentColor" fillOpacity="0.2" />
        <circle cx="2" cy="4" r="1.5" fill="currentColor" />
        <circle cx="8" cy="4" r="1.5" fill="currentColor" />
        <circle cx="16" cy="4" r="1.5" fill="currentColor" />
        <circle cx="22" cy="4" r="1.5" fill="currentColor" />
      </>
    ),
    whatsapp: (
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.716 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="currentColor" />
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4.5" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="1.5" />
        <path d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
    moon: (
      <>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#818cf8" fillOpacity="0.25" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="6" r="1" fill="#fbbf24" />
        <circle cx="14" cy="3" r="0.8" fill="#fbbf24" />
      </>
    ),
    chevronDown: (
      <path d="m6 9 6 6 6-6" />
    ),
    copy: (
      <>
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
    check: (
      <polyline points="20 6 9 17 4 12" />
    ),
    menu: (
      <>
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </>
    ),
    close: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
    externalLink: (
      <>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </>
    ),
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name] || icons.home}
    </svg>
  );
}

/* ─── Heraldic Crest & Pedagogy Artworks ─────────────────────────────────── */
function HeraldicCrestVector({ className = "h-28 w-28" }) {
  return (
    <svg className={className} viewBox="0 0 160 160" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="lum-gold-radial" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <linearGradient id="lum-shield-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      {/* Radiant Aura */}
      <circle cx="80" cy="80" r="72" stroke="url(#lum-gold-radial)" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3" />
      <circle cx="80" cy="80" r="64" stroke="url(#lum-gold-radial)" strokeWidth="1.5" strokeOpacity="0.45" />

      {/* Laurel Wreath */}
      <path d="M35 110c-8-25 0-50 15-65m75 65c8-25 0-50-15-65" stroke="url(#lum-gold-radial)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="43" cy="52" r="3" fill="#f59e0b" />
      <circle cx="36" cy="70" r="3" fill="#f59e0b" />
      <circle cx="37" cy="90" r="3" fill="#f59e0b" />
      <circle cx="117" cy="52" r="3" fill="#f59e0b" />
      <circle cx="124" cy="70" r="3" fill="#f59e0b" />
      <circle cx="123" cy="90" r="3" fill="#f59e0b" />

      {/* Royal Escutcheon / Shield */}
      <path
        d="M80 32 L112 44 C112 85 96 112 80 125 C64 112 48 85 48 44 Z"
        fill="url(#lum-shield-bg)"
        stroke="url(#lum-gold-radial)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Internal Shield Cross Division */}
      <line x1="80" y1="44" x2="80" y2="120" stroke="url(#lum-gold-radial)" strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="52" y1="72" x2="108" y2="72" stroke="url(#lum-gold-radial)" strokeWidth="1.2" strokeOpacity="0.5" />

      {/* Golden Crown Apex */}
      <path
        d="M68 28 L72 35 L80 30 L88 35 L92 28 L94 40 L66 40 Z"
        fill="url(#lum-gold-radial)"
      />

      {/* Illuminated Starburst Core */}
      <polygon
        points="80,60 83,68 91,69 85,75 87,83 80,78 73,83 75,75 69,69 77,68"
        fill="url(#lum-gold-radial)"
      />

      {/* Base Ribbon */}
      <path d="M50 128 Q80 138 110 128" stroke="url(#lum-gold-radial)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="80" cy="133" r="3" fill="#f59e0b" />
    </svg>
  );
}

function PillarArtVector({ index }) {
  if (index === 0) {
    // Architecture of Mastery (Compass, Geometry, Gold Matrix)
    return (
      <svg className="h-16 w-16" viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <circle cx="40" cy="40" r="36" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="3 3" />
        <circle cx="40" cy="40" r="26" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.3" />
        {/* Architect Compass */}
        <path d="M40 18 L24 58 M40 18 L56 58" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M28 46 Q40 50 52 46" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="40" cy="18" r="4" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
        {/* Keystone */}
        <polygon points="40,28 46,38 34,38" fill="#f59e0b" fillOpacity="0.6" />
      </svg>
    );
  }
  if (index === 1) {
    // Bespoke Precision Mentorship (Shield with Luminous Flame)
    return (
      <svg className="h-16 w-16" viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <circle cx="40" cy="40" r="36" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="3 3" />
        <rect x="18" y="18" width="44" height="44" rx="12" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.3" />
        {/* Promethean Torch & Flame */}
        <path d="M34 56 L46 56 L43 42 L37 42 Z" fill="#6366f1" fillOpacity="0.5" stroke="#6366f1" strokeWidth="1.5" />
        <path d="M40 20 Q48 28 44 36 Q40 40 36 34 Q34 26 40 20 Z" fill="#f59e0b" />
        <circle cx="40" cy="30" r="3" fill="#fef08a" />
      </svg>
    );
  }
  // High-Yield Echelon (Ascending Tiers with Star of Excellence)
  return (
    <svg className="h-16 w-16" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="36" stroke="#10b981" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="3 3" />
      {/* Ascending Podium */}
      <rect x="16" y="48" width="14" height="18" rx="2" fill="#10b981" fillOpacity="0.3" stroke="#10b981" strokeWidth="1.5" />
      <rect x="33" y="38" width="14" height="28" rx="2" fill="#10b981" fillOpacity="0.5" stroke="#10b981" strokeWidth="1.5" />
      <rect x="50" y="28" width="14" height="38" rx="2" fill="#10b981" fillOpacity="0.7" stroke="#10b981" strokeWidth="1.5" />
      {/* Sovereign Star */}
      <polygon points="57,14 59,19 64,20 60,24 61,29 57,26 53,29 54,24 50,20 55,19" fill="#f59e0b" />
    </svg>
  );
}

function SubjectCrestVector({ subjectName = "" }) {
  const norm = String(subjectName).toLowerCase();
  if (norm.includes("math") || norm.includes("algebra") || norm.includes("calc")) {
    return (
      <svg className="h-10 w-10 text-amber-500" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="6" y="6" width="36" height="36" rx="8" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
        <path d="M14 16 L22 32 M34 16 L26 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="24" r="4" fill="currentColor" fillOpacity="0.2" />
        <path d="M30 14 Q36 24 30 34" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
      </svg>
    );
  }
  if (norm.includes("phys") || norm.includes("mechanic")) {
    return (
      <svg className="h-10 w-10 text-indigo-400" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="3 3" />
        <ellipse cx="24" cy="24" rx="16" ry="6" transform="rotate(-30 24 24)" stroke="currentColor" strokeWidth="2" />
        <ellipse cx="24" cy="24" rx="16" ry="6" transform="rotate(30 24 24)" stroke="currentColor" strokeWidth="2" />
        <circle cx="24" cy="24" r="4.5" fill="#f59e0b" />
      </svg>
    );
  }
  if (norm.includes("chem") || norm.includes("bio") || norm.includes("science")) {
    return (
      <svg className="h-10 w-10 text-emerald-400" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M21 8h6v8l9 16c1 2 0 4-2 4H14c-2 0-3-2-2-4l9-16V8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <line x1="18" y1="8" x2="30" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 30 Q24 28 32 30" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="20" cy="24" r="1.5" fill="currentColor" />
        <circle cx="27" cy="22" r="2" fill="currentColor" />
      </svg>
    );
  }
  if (norm.includes("code") || norm.includes("computer") || norm.includes("program") || norm.includes("tech")) {
    return (
      <svg className="h-10 w-10 text-cyan-400" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="6" y="10" width="36" height="26" rx="6" stroke="currentColor" strokeWidth="2" />
        <path d="M16 20 L12 24 L16 28 M32 20 L36 24 L32 28 M22 28 L26 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="40" x2="30" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="36" x2="24" y2="40" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  // Default Academic Quill & Codex
  return (
    <svg className="h-10 w-10 text-amber-500" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M8 38 L14 12 Q24 8 36 12 L38 24 Q28 26 22 36 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
      <path d="M8 38 L14 34 M14 12 L22 36" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="34" cy="14" r="2" fill="#fbbf24" />
    </svg>
  );
}

/* ─── Hero Graphic Component ─────────────────────────────────────────────── */
function LuminaryHeroShowcase({ profile, tuition, name }) {
  const avatarUrl = fd(profile, ["profilePicture", "profileImage", "avatar", "photo", "image"]);
  const experienceYears = fd(profile, ["experience", "teachingExperience", "yearsOfExperience"], "10+");

  return (
    <div className="relative mx-auto flex w-full max-w-sm flex-col items-center justify-center lg:max-w-none">
      {/* Background Golden Halo Glow */}
      <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-amber-500/20 via-indigo-600/15 to-amber-300/10 blur-2xl filter dark:from-amber-500/15 dark:via-indigo-500/10 dark:to-amber-200/5" />

      {/* Decorative Rotating Ring */}
      <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72 lg:h-80 lg:w-80">
        <svg
          className="absolute inset-0 h-full w-full animate-[spin_60s_linear_infinite]"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle
            cx="100"
            cy="100"
            r="94"
            stroke="url(#lum-ring-gradient)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
          <defs>
            <linearGradient id="lum-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.9" />
            </linearGradient>
          </defs>
        </svg>

        {/* Secondary Inner Fine Ring */}
        <div className="absolute inset-3 rounded-full border border-amber-400/30 dark:border-amber-400/20" />

        {/* Avatar Display */}
        <div className="relative flex h-52 w-52 items-center justify-center overflow-hidden rounded-full border-2 border-amber-400/50 bg-gradient-to-b from-amber-950/20 to-slate-900 shadow-2xl sm:h-60 sm:w-60 lg:h-68 lg:w-68">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 p-4 text-center">
              <HeraldicCrestVector className="h-24 w-24 sm:h-28 sm:w-28" />
              <span className="mt-2 text-xs font-semibold tracking-widest text-amber-300 uppercase">
                Luminary Mentor
              </span>
            </div>
          )}
        </div>

        {/* Floating Verified Master Badge (Top Left) */}
        <div className="absolute -top-1 -left-2 sm:top-2 sm:left-0 flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-slate-950/90 px-3 py-1 text-[11px] font-bold text-amber-300 shadow-xl backdrop-blur-md dark:bg-black/90">
          <LuminaryIcon name="sparkles" className="h-3.5 w-3.5 text-amber-400" />
          <span>PRO MENTOR</span>
        </div>

        {/* Floating Experience Pill (Bottom Right) */}
        <div className="absolute -bottom-2 -right-2 sm:bottom-2 sm:right-0 flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-slate-950/90 px-3.5 py-1.5 text-left shadow-xl backdrop-blur-md dark:bg-black/90">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <LuminaryIcon name="crown" className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-neutral-400">Track Record</p>
            <p className="text-xs font-extrabold text-white">{experienceYears} Pedigree</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PAGES
   ══════════════════════════════════════════════════════════════════════════════ */

/* ─── 1. Home / Overview Page ────────────────────────────────────────────── */
function HomePage({
  profile,
  tuition,
  achievements,
  batches,
  gallery,
  name,
  onContactClick,
  onCopyLink,
  copyMessage,
  basePath,
  whatsappNumber,
  phoneCall,
}) {
  const bio = fd(profile, ["bio", "about", "aboutMe", "description"], "");
  const location = fd(profile, ["city", "state", "location", "address"], "Available Nationwide & Online");
  const subjects = list(fd(tuition, ["subjects", "subjectTaught", "courses", "skills"], []));
  const classesList = list(fd(tuition, ["classes", "grades", "standards", "targetAudience"], []));
  const experienceYears = fd(profile, ["experience", "teachingExperience", "yearsOfExperience"], "8+");

  const topAchievements = (achievements || []).slice(0, 3);
  const activeBatches = (batches || []).slice(0, 3);

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* ── Top Announcement Ribbon ── */}
      <div className="mx-auto flex max-w-2xl items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-center text-xs font-medium text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
        <LuminaryIcon name="sparkles" className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        <span className="truncate">
          Admissions Open for High-Caliber Academic Cohorts • Limited Enrolment
        </span>
      </div>

      {/* ── Hero Section ── */}
      <section className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-6 text-center lg:col-span-7 lg:text-left">
          {/* Elite Tier Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-50 px-3.5 py-1 text-xs font-bold tracking-wide text-amber-900 uppercase dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Verified Executive Educator</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-neutral-900 sm:text-4xl sm:leading-tight lg:text-5xl lg:leading-tight dark:text-white">
            Transforming Academic Ambition into{" "}
            <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 bg-clip-text text-transparent dark:from-amber-300 dark:via-amber-400 dark:to-indigo-300">
              Unrivaled Mastery.
            </span>
          </h1>

          <div className="text-sm sm:text-base text-neutral-600 leading-relaxed dark:text-neutral-300">
            {bio ? (
              <ExpandableText lines={3} className="text-neutral-600 dark:text-neutral-300">
                {bio}
              </ExpandableText>
            ) : (
              <p>
                Welcome to the official academic portal of{" "}
                <strong className="text-neutral-900 dark:text-white">{name}</strong>.
                Dedicated to structured intellectual rigor, bespoke concept architecture,
                and milestone-driven examination results.
              </p>
            )}
          </div>

          {/* Quick Metas (Location & Credentials) */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-neutral-500 lg:justify-start dark:text-neutral-400">
            {location && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 dark:border-neutral-800 dark:bg-neutral-900">
                <LuminaryIcon name="pin" className="h-3.5 w-3.5 text-amber-500" />
                {location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 dark:border-neutral-800 dark:bg-neutral-900">
              <LuminaryIcon name="crown" className="h-3.5 w-3.5 text-amber-500" />
              {experienceYears} Years Experience
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 dark:border-neutral-800 dark:bg-neutral-900">
              <LuminaryIcon name="shieldCheck" className="h-3.5 w-3.5 text-amber-500" />
              100% Verified Faculty
            </span>
          </div>

          {/* Action Callouts */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 lg:justify-start">
            <button
              type="button"
              onClick={onContactClick}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-6 text-sm font-bold text-white shadow-lg shadow-amber-600/20 transition hover:from-amber-500 hover:to-amber-600 active:scale-95"
            >
              <LuminaryIcon name="message" className="h-4 w-4" />
              <span>Direct Consultation</span>
            </button>

            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 active:scale-95 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                <LuminaryIcon name="whatsapp" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={onCopyLink}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-bold text-neutral-800 transition hover:bg-neutral-50 active:scale-95 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
              title="Share portfolio link"
            >
              <LuminaryIcon name="copy" className="h-4 w-4 text-neutral-500" />
              <span>{copyMessage || "Share Link"}</span>
            </button>
          </div>
        </div>

        {/* Hero Visual Crest & Avatar Showcase */}
        <div className="lg:col-span-5">
          <LuminaryHeroShowcase profile={profile} tuition={tuition} name={name} />
        </div>
      </section>

      {/* ── Executive Metric Ribbons ── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { label: "Dedication Track", value: `${experienceYears} Yrs`, desc: "Executive Mentorship" },
          { label: "Active Cohorts", value: `${batches?.length || 4}+`, desc: "Specialized Batches" },
          { label: "Distinction Rate", value: "98.4%", desc: "Top Decile Performers" },
          { label: "Proven Honors", value: `${achievements?.length || 12}+`, desc: "Verified Accolades" },
        ].map((item, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white/70 p-4 sm:p-5 text-center shadow-sm backdrop-blur-md transition hover:border-amber-500/40 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/60"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent group-hover:via-amber-500/80 transition-all" />
            <p className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
              {item.value}
            </p>
            <p className="mt-1 text-xs font-bold text-amber-700 dark:text-amber-400">
              {item.label}
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
              {item.desc}
            </p>
          </div>
        ))}
      </section>

      {/* ── Three Pillars of Pedagogy ── */}
      <section className="space-y-6">
        <div className="text-center">
          <span className="text-xs font-extrabold tracking-widest text-amber-600 uppercase dark:text-amber-400">
            Teaching Philosophy
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
            The Three Pillars of Scholarly Eminence
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            An elite framework designed for conceptual clarity, strategic problem-solving, and decisive academic confidence.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Conceptual Architecture",
              desc: "Building rock-solid first principles rather than rote memorization. Every concept is mapped with crystalline analytical precision.",
            },
            {
              title: "Adaptive Precision Mentorship",
              desc: "Small-group cohorts tailored to individual cognitive velocity, continuous diagnostics, and immediate remediation.",
            },
            {
              title: "Echelon Examination Mastery",
              desc: "High-yield past paper synthesis, speed drills, and exam psychology conditioning to guarantee peak performance on test day.",
            },
          ].map((pillar, idx) => (
            <div
              key={idx}
              className="relative flex flex-col items-center rounded-2xl border border-neutral-200/90 bg-white/80 p-6 text-center shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-lg dark:border-neutral-800/90 dark:bg-neutral-900/60"
            >
              <div className="mb-4">
                <PillarArtVector index={idx} />
              </div>
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                {pillar.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed dark:text-neutral-300">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Masterclasses Preview ── */}
      {subjects.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold tracking-widest text-amber-600 uppercase dark:text-amber-400">
                Curriculum Focus
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-neutral-900 dark:text-white">
                Core Disciplines & Instruction
              </h2>
            </div>
            <Link
              to={`${basePath}/classes`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            >
              <span>Explore All Masterclasses</span>
              <LuminaryIcon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.slice(0, 6).map((sub, i) => (
              <div
                key={i}
                className="group flex items-start gap-3.5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-amber-500/40 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/60"
              >
                <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-800/50">
                  <SubjectCrestVector subjectName={sub} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-neutral-900 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400 transition-colors">
                    {sub}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500 line-clamp-2 dark:text-neutral-400">
                    Comprehensive syllabus coverage with weekly problem sets and rigorous diagnostics.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Active Cohorts Preview ── */}
      {activeBatches.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold tracking-widest text-amber-600 uppercase dark:text-amber-400">
                Live Cohorts
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-neutral-900 dark:text-white">
                Upcoming Academic Batches
              </h2>
            </div>
            <Link
              to={`${basePath}/batches`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            >
              <span>View All Cohorts</span>
              <LuminaryIcon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {activeBatches.map((b, i) => {
              const bName = fd(b, ["name", "batchName", "title"], `Executive Cohort ${i + 1}`);
              const bSubject = fd(b, ["subject", "course", "subjectName"], "Advanced Studies");
              const bTiming = fd(b, ["timing", "schedule", "time", "days"], "Weekday Evenings");
              const bSeats = fd(b, ["seats", "seatsLeft", "capacity"], "Limited");
              return (
                <div
                  key={i}
                  className="relative flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-amber-500/50 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/60"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        ● Open for Enrolment
                      </span>
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        {bSeats} Seats
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-extrabold text-neutral-900 dark:text-white">
                      {bName}
                    </h3>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {bSubject}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                      <LuminaryIcon name="calendar" className="h-3.5 w-3.5 text-amber-500" />
                      <span>{bTiming}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onContactClick}
                    className="mt-5 w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 text-xs font-bold text-neutral-800 transition hover:border-amber-500 hover:bg-amber-50 hover:text-amber-900 dark:border-neutral-800 dark:bg-neutral-800/80 dark:text-neutral-200 dark:hover:bg-amber-500/10 dark:hover:text-amber-300"
                  >
                    Reserve Seat
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Hall of Fame Preview ── */}
      {topAchievements.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold tracking-widest text-amber-600 uppercase dark:text-amber-400">
                Track Record
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-neutral-900 dark:text-white">
                Hall of Fame & Distinctions
              </h2>
            </div>
            <Link
              to={`${basePath}/achievements`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            >
              <span>Explore All Honors</span>
              <LuminaryIcon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {topAchievements.map((item, idx) => {
              const title = fd(item, ["title", "achievement", "name"], "Outstanding Distinction");
              const student = fd(item, ["studentName", "student", "recipient"], "");
              const score = fd(item, ["score", "grade", "rank", "percentage"], "Top Rank");
              const desc = fd(item, ["description", "details"], "");
              return (
                <div
                  key={idx}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-white to-neutral-50/50 p-5 shadow-sm transition hover:border-amber-500/50 hover:shadow-lg dark:from-neutral-900/80 dark:to-neutral-950/90"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-15 group-hover:opacity-30 transition-opacity">
                    <LuminaryIcon name="trophy" className="h-14 w-14 text-amber-500" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      <LuminaryIcon name="star" className="h-2.5 w-2.5" />
                      <span>{score}</span>
                    </div>
                    <h3 className="mt-3 text-base font-extrabold text-neutral-900 dark:text-white">
                      {title}
                    </h3>
                    {student && (
                      <p className="mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        Candidate: {student}
                      </p>
                    )}
                    {desc && (
                      <p className="mt-2 text-xs text-neutral-600 line-clamp-3 dark:text-neutral-300">
                        {desc}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    <LuminaryIcon name="shieldCheck" className="h-3.5 w-3.5" />
                    <span>Verified Milestone</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Elite VIP Consultation Card ── */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-950 via-indigo-950 to-neutral-950 p-8 text-center text-white shadow-2xl sm:p-12">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-xl space-y-4">
          <HeraldicCrestVector className="mx-auto h-20 w-20" />
          <span className="inline-block text-xs font-bold tracking-widest text-amber-400 uppercase">
            Executive Assessment
          </span>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            Ready to Accelerate Your Academic Trajectory?
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Schedule a private one-on-one diagnostic consultation to evaluate baseline competency,
            identify leverage areas, and reserve your place in upcoming cohorts.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onContactClick}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 text-sm font-bold text-white shadow-lg shadow-amber-600/30 transition hover:from-amber-400 hover:to-amber-500 active:scale-95"
            >
              <LuminaryIcon name="message" className="h-4 w-4" />
              <span>Request Diagnostic Session</span>
            </button>
            {phoneCall && (
              <a
                href={`tel:${phoneCall}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
              >
                <LuminaryIcon name="phone" className="h-4 w-4 text-amber-400" />
                <span>Direct Line</span>
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── 2. About Page ──────────────────────────────────────────────────────── */
function AboutPage({ profile, tuition, faqs, name, onContactClick, phoneCall, emailAddress, whatsappNumber }) {
  const bio = fd(profile, ["bio", "about", "aboutMe", "description"], "");
  const location = fd(profile, ["city", "state", "location", "address"], "");
  const experienceYears = fd(profile, ["experience", "teachingExperience", "yearsOfExperience"], "10+");
  const qualifications = list(fd(profile, ["qualifications", "education", "degrees"], []));
  const [openFaq, setOpenFaq] = useState(null);

  const faqList = faqs && faqs.length > 0 ? faqs : [
    {
      question: "What distinguishes the Luminary Elite methodology?",
      answer: "Our curriculum emphasizes deep conceptual foundations, personal cognitive diagnostics, and systematic past-paper deconstruction instead of formulaic memorization.",
    },
    {
      question: "How are student batches structured?",
      answer: "Cohorts are intentionally kept strictly capped to ensure every candidate receives customized inquiry responses, detailed homework reviews, and personalized milestone feedback.",
    },
    {
      question: "Are hybrid or virtual masterclasses available?",
      answer: "Yes. In addition to in-person atelier sessions, interactive high-definition virtual masterclasses are conducted with real-time digital whiteboarding and session recordings.",
    },
    {
      question: "How can parents monitor academic velocity?",
      answer: "Bi-weekly diagnostic summaries and benchmark progress reports are dispatched directly to candidates and guardians.",
    },
  ];

  return (
    <div className="space-y-12">
      {/* ── Header ── */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-extrabold tracking-widest text-amber-600 uppercase dark:text-amber-400">
          Faculty Profile
        </span>
        <h1 className="text-3xl font-black text-neutral-900 sm:text-4xl dark:text-white">
          Executive Biography & Pedigree
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          Decades of academic mastery committed to cultivating intellectual distinction and top-percentile outcomes.
        </p>
      </div>

      {/* ── Main Bio Card ── */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <div className="lg:col-span-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <LuminaryIcon name="user" className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">{name}</h2>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Senior Academic Faculty • {experienceYears} Experience
              </p>
            </div>
          </div>

          <div className="text-sm text-neutral-600 leading-relaxed dark:text-neutral-300 space-y-4">
            {bio ? (
              <p className="whitespace-pre-line">{bio}</p>
            ) : (
              <p>
                An accomplished academician whose pedigree spans institutional and private coaching for competitive examinations and board distinction. Renowned for clarifying intricate conceptual frameworks and training students to think with rigorous analytical precision.
              </p>
            )}
          </div>

          {/* Key Specialization Pillars */}
          <div className="grid gap-3 sm:grid-cols-3 pt-2">
            {[
              { label: "Teaching Caliber", val: "Tier 1 Mentor", icon: "crown" },
              { label: "Pedagogy", val: "Inquiry-Based", icon: "sparkles" },
              { label: "Integrity", val: "Verified Record", icon: "shieldCheck" },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-center dark:border-neutral-800 dark:bg-neutral-800/40">
                <LuminaryIcon name={stat.icon} className="mx-auto h-4 w-4 text-amber-500" />
                <p className="mt-1 text-xs font-extrabold text-neutral-900 dark:text-white">{stat.val}</p>
                <p className="text-[10px] text-neutral-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Fast Contact & Location Sidebar ── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 space-y-4">
            <h3 className="text-sm font-extrabold tracking-wide text-neutral-900 uppercase dark:text-white">
              Direct Inquiries
            </h3>

            <div className="space-y-2 text-xs">
              {location && (
                <div className="flex items-start gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50 p-2.5 dark:border-neutral-800 dark:bg-neutral-800/40">
                  <LuminaryIcon name="pin" className="h-4 w-4 shrink-0 text-amber-500" />
                  <span className="text-neutral-700 dark:text-neutral-300">{location}</span>
                </div>
              )}
              {phoneCall && (
                <a
                  href={`tel:${phoneCall}`}
                  className="flex items-center gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50 p-2.5 text-neutral-700 hover:text-amber-600 transition dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-300 dark:hover:text-amber-400"
                >
                  <LuminaryIcon name="phone" className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>{phoneCall}</span>
                </a>
              )}
              {emailAddress && (
                <a
                  href={`mailto:${emailAddress}`}
                  className="flex items-center gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50 p-2.5 text-neutral-700 hover:text-amber-600 transition truncate dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-300 dark:hover:text-amber-400"
                >
                  <LuminaryIcon name="mail" className="h-4 w-4 shrink-0 text-amber-500" />
                  <span className="truncate">{emailAddress}</span>
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={onContactClick}
              className="w-full rounded-xl bg-neutral-900 py-2.5 text-xs font-bold text-white transition hover:bg-neutral-800 dark:bg-amber-600 dark:hover:bg-amber-500"
            >
              Initiate Private Inquiry
            </button>
          </div>
        </div>
      </div>

      {/* ── FAQ Section with Gold Indicator Accordion ── */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 space-y-6">
        <div>
          <span className="text-xs font-extrabold tracking-widest text-amber-600 uppercase dark:text-amber-400">
            Admissions & Protocol
          </span>
          <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white">
            Frequently Addressed Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqList.map((faq, i) => {
            const q = fd(faq, ["question", "title", "q"], `Inquiry ${i + 1}`);
            const a = fd(faq, ["answer", "response", "a", "description"], "");
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-neutral-200 transition dark:border-neutral-800"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">
                    {q}
                  </span>
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-transform dark:border-neutral-700 dark:text-neutral-400 ${
                      isOpen ? "rotate-180 bg-amber-500/10 text-amber-600 dark:text-amber-400" : ""
                    }`}
                  >
                    <LuminaryIcon name="chevronDown" className="h-3.5 w-3.5" />
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-neutral-100 bg-neutral-50/70 p-4 text-xs sm:text-sm text-neutral-600 leading-relaxed dark:border-neutral-800/60 dark:bg-neutral-900/40 dark:text-neutral-300">
                    <p>{a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── 3. Classes / Masterclasses Page ─────────────────────────────────────── */
function ClassesPage({ tuition, onContactClick }) {
  const subjects = list(fd(tuition, ["subjects", "subjectTaught", "courses", "skills"], []));
  const classesList = list(fd(tuition, ["classes", "grades", "standards", "targetAudience"], []));
  const teachingMode = fd(tuition, ["mode", "teachingMode", "modeOfTeaching"], "Hybrid (In-Person Atelier & Digital Live)");
  const feeStructure = fd(tuition, ["fees", "feeStructure", "pricing"], "Available Upon Private Consultation");

  return (
    <div className="space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-extrabold tracking-widest text-amber-600 uppercase dark:text-amber-400">
          Instructional Offerings
        </span>
        <h1 className="text-3xl font-black text-neutral-900 sm:text-4xl dark:text-white">
          Curated Masterclasses & Modules
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          Rigorous academic curricula structured for competitive distinction, syllabus mastery, and accelerated competence.
        </p>
      </div>

      {/* Modes & Format Ribbon */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: "Instruction Modality", desc: teachingMode, icon: "sparkles" },
          { title: "Eligible Cohorts", desc: classesList.join(", ") || "Secondary to Pre-University", icon: "book" },
          { title: "Investment Structure", desc: feeStructure, icon: "crown" },
        ].map((card, i) => (
          <div
            key={i}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60"
          >
            <LuminaryIcon name={card.icon} className="h-5 w-5 text-amber-500" />
            <h3 className="mt-3 text-xs font-extrabold uppercase tracking-wide text-neutral-400">
              {card.title}
            </h3>
            <p className="mt-1 text-sm font-bold text-neutral-900 dark:text-white">
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Subject Masterclasses Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">
          Primary Disciplines & Specializations
        </h2>

        {subjects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((sub, i) => (
              <div
                key={i}
                className="group relative flex flex-col justify-between rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-amber-500/50 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900/60"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-2.5 dark:border-neutral-800 dark:bg-neutral-800/40">
                      <SubjectCrestVector subjectName={sub} />
                    </div>
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      Masterclass
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-extrabold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {sub}
                  </h3>

                  <p className="mt-2 text-xs text-neutral-600 leading-relaxed dark:text-neutral-300">
                    Comprehensive syllabus mapping with in-depth problem breakdowns, weekly diagnostic evaluation, and executive mentorship notes.
                  </p>

                  <ul className="mt-4 space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <li className="flex items-center gap-1.5">
                      <LuminaryIcon name="check" className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Detailed conceptual scaffolding</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <LuminaryIcon name="check" className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Past 10 years question synthesis</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onContactClick}
                  className="mt-6 w-full rounded-xl bg-neutral-900 py-2.5 text-xs font-bold text-white transition hover:bg-neutral-800 dark:bg-amber-600 dark:hover:bg-amber-500"
                >
                  Enquire for {sub}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            No specific subjects published yet. Please initiate an inquiry for current curricular schedules.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 4. Batches / Cohorts Page ───────────────────────────────────────────── */
function BatchesPage({ batches, onContactClick }) {
  return (
    <div className="space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-extrabold tracking-widest text-amber-600 uppercase dark:text-amber-400">
          Active Enrolment
        </span>
        <h1 className="text-3xl font-black text-neutral-900 sm:text-4xl dark:text-white">
          Scheduled Academic Cohorts
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          Small-group masterclasses capped to guarantee intimate instruction and dedicated question resolution.
        </p>
      </div>

      {batches && batches.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((b, i) => {
            const name = fd(b, ["name", "batchName", "title"], `Cohort ${i + 1}`);
            const subject = fd(b, ["subject", "course", "subjectName"], "Core Curriculum");
            const timing = fd(b, ["timing", "schedule", "time", "days"], "Scheduled Timetable");
            const seats = fd(b, ["seats", "seatsLeft", "capacity"], "Strictly Limited");
            const fee = fd(b, ["fees", "fee", "price", "amount"], "");
            const desc = fd(b, ["description", "details"], "");

            return (
              <div
                key={i}
                className="flex flex-col justify-between rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-amber-500/50 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900/60"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Cohort
                    </span>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {seats} Available
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-black text-neutral-900 dark:text-white">
                    {name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    {subject}
                  </p>

                  <div className="mt-4 space-y-2 rounded-2xl border border-neutral-100 bg-neutral-50 p-3.5 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-300">
                    <div className="flex items-center gap-2">
                      <LuminaryIcon name="calendar" className="h-4 w-4 text-amber-500" />
                      <span>{timing}</span>
                    </div>
                    {fee && (
                      <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                        <LuminaryIcon name="crown" className="h-4 w-4 text-amber-500" />
                        <span>Investment: {fee}</span>
                      </div>
                    )}
                  </div>

                  {desc && (
                    <p className="mt-4 text-xs text-neutral-600 line-clamp-3 dark:text-neutral-300">
                      {desc}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onContactClick}
                  className="mt-6 w-full rounded-xl bg-neutral-900 py-2.5 text-xs font-bold text-white transition hover:bg-neutral-800 dark:bg-amber-600 dark:hover:bg-amber-500"
                >
                  Apply for Admission
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900/40">
          <HeraldicCrestVector className="mx-auto h-16 w-16 opacity-40" />
          <h3 className="mt-4 text-base font-bold text-neutral-900 dark:text-white">
            Upcoming Cohorts Being Scheduled
          </h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            Contact faculty directly to receive prioritized notification when new cohort schedules are announced.
          </p>
          <button
            type="button"
            onClick={onContactClick}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500"
          >
            Join Priority Waitlist
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── 5. Gallery / Atelier Page ───────────────────────────────────────────── */
function GalleryPage({ gallery }) {
  return (
    <div className="space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-extrabold tracking-widest text-amber-600 uppercase dark:text-amber-400">
          Academic Atelier
        </span>
        <h1 className="text-3xl font-black text-neutral-900 sm:text-4xl dark:text-white">
          Campus, Seminar & Milestone Gallery
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          A visual chronicle of lecture sessions, scholarly seminars, laboratory work, and ceremony recognitions.
        </p>
      </div>

      <ClassicGallery gallery={gallery || []} />
    </div>
  );
}

/* ─── 6. Achievements / Hall of Fame Page ─────────────────────────────────── */
function AchievementsPage({ achievements, onContactClick }) {
  return (
    <div className="space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-extrabold tracking-widest text-amber-600 uppercase dark:text-amber-400">
          Distinction & Honors
        </span>
        <h1 className="text-3xl font-black text-neutral-900 sm:text-4xl dark:text-white">
          The Hall of Academic Distinction
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          Celebrating top-percentile board ranks, Olympiad laureates, and transformative individual triumphs.
        </p>
      </div>

      {achievements && achievements.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((item, idx) => {
            const title = fd(item, ["title", "achievement", "name"], "Academic Honor");
            const student = fd(item, ["studentName", "student", "recipient"], "");
            const score = fd(item, ["score", "grade", "rank", "percentage"], "Top Rank");
            const desc = fd(item, ["description", "details"], "");
            const year = fd(item, ["year", "session", "date"], "");

            return (
              <div
                key={idx}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-white to-amber-50/20 p-6 shadow-sm transition hover:border-amber-500/60 hover:shadow-xl dark:from-neutral-900/80 dark:to-neutral-950/90"
              >
                <div className="absolute top-2 right-2 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <HeraldicCrestVector className="h-20 w-20" />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-800 dark:text-amber-300">
                      <LuminaryIcon name="star" className="h-3 w-3" />
                      <span>{score}</span>
                    </span>
                    {year && (
                      <span className="text-[11px] font-semibold text-neutral-400">
                        {year}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-lg font-black text-neutral-900 dark:text-white">
                    {title}
                  </h3>

                  {student && (
                    <p className="mt-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                      Candidate: {student}
                    </p>
                  )}

                  {desc && (
                    <p className="mt-3 text-xs text-neutral-600 leading-relaxed line-clamp-4 dark:text-neutral-300">
                      {desc}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-amber-500/10 pt-4 text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                  <span className="inline-flex items-center gap-1">
                    <LuminaryIcon name="shieldCheck" className="h-3.5 w-3.5 text-amber-500" />
                    <span>Verified Milestone</span>
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">Luminary Honor</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900/40">
          <HeraldicCrestVector className="mx-auto h-16 w-16 opacity-40" />
          <h3 className="mt-4 text-base font-bold text-neutral-900 dark:text-white">
            Honors Register Updating
          </h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Student accomplishments and examination milestones are being curated for this portfolio.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── 7. Experience / Pedigree Page ───────────────────────────────────────── */
function ExperiencePage({ experience }) {
  return (
    <div className="space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-extrabold tracking-widest text-amber-600 uppercase dark:text-amber-400">
          Professional Pedigree
        </span>
        <h1 className="text-3xl font-black text-neutral-900 sm:text-4xl dark:text-white">
          Academic Appointments & Tenure
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          A distinguished chronology of educational leadership, departmental tenure, and masterclass instruction.
        </p>
      </div>

      {experience && experience.length > 0 ? (
        <div className="relative mx-auto max-w-3xl space-y-8 before:absolute before:inset-0 before:left-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-amber-500 before:via-amber-500/40 before:to-transparent sm:before:left-7">
          {experience.map((exp, i) => {
            const role = fd(exp, ["role", "title", "designation", "position"], "Senior Academic Faculty");
            const org = fd(exp, ["organization", "institution", "school", "company"], "Premier Academy");
            const duration = fd(exp, ["duration", "period", "years", "time"], "");
            const desc = fd(exp, ["description", "details"], "");

            return (
              <div key={i} className="relative flex items-start gap-4 sm:gap-6">
                {/* Timeline Crown Node */}
                <div className="relative flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-500 bg-slate-950 text-amber-400 shadow-lg shadow-amber-500/20">
                  <LuminaryIcon name="crown" className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>

                <div className="flex-1 rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
                      {role}
                    </h3>
                    {duration && (
                      <span className="inline-flex w-fit items-center rounded-full bg-neutral-100 px-3 py-0.5 text-[11px] font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        {duration}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400">
                    {org}
                  </p>

                  {desc && (
                    <p className="mt-3 text-xs sm:text-sm text-neutral-600 leading-relaxed dark:text-neutral-300">
                      {desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900/40">
          <HeraldicCrestVector className="mx-auto h-16 w-16 opacity-40" />
          <h3 className="mt-4 text-base font-bold text-neutral-900 dark:text-white">
            Tenure History In Review
          </h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Professional milestones will appear here as recorded by the educator.
          </p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT: ThemeLuminary (Luminary Elite)
   ══════════════════════════════════════════════════════════════════════════════ */
export default function ThemeLuminary({
  profile = {},
  tuition = {},
  achievements = [],
  batches = [],
  experience = [],
  faqs = [],
  gallery = [],
  username = "", previewBasePath,
  currentPage = "home",
  onContactClick = () => {},
  onCopyLink = () => {},
  copyMessage = "",
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ── Dark / Light mode ── */
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const saved = localStorage.getItem("tutorfolio:luminary-mode");
      if (saved === "dark" || saved === "light") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("tutorfolio:luminary-mode", themeMode);
    } catch {}
  }, [themeMode]);

  const isDark = themeMode === "dark";

  /* ── Close mobile menu on page switch ── */
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPage]);

  const name =
    fd(profile, ["fullName", "name", "tutorName", "displayName"]) ||
    fd(tuition, ["tuitionName", "tuitionClassName", "academyName"]) ||
    "Distinguished Faculty";

  const academyName =
    fd(tuition, ["tuitionName", "tuitionClassName", "academyName"]) || name;

  const phoneCall = fd(profile, ["phone", "phoneNumber", "mobile", "contactNumber"]);
  const emailAddress = fd(profile, ["email", "contactEmail"]);
  const whatsappNumber =
    fd(profile, ["whatsapp", "whatsappNumber", "phone"])?.replace(/\D/g, "");

  const basePath = previewBasePath || `/tutor/${encodeURIComponent(username || "")}`;

  /* Route page component switcher */
  let activePageContent = null;
  switch (currentPage) {
    case "about":
      activePageContent = (
        <AboutPage
          profile={profile}
          tuition={tuition}
          faqs={faqs}
          name={name}
          onContactClick={onContactClick}
          phoneCall={phoneCall}
          emailAddress={emailAddress}
          whatsappNumber={whatsappNumber}
        />
      );
      break;
    case "classes":
      activePageContent = (
        <ClassesPage tuition={tuition} onContactClick={onContactClick} />
      );
      break;
    case "batches":
      activePageContent = (
        <BatchesPage batches={batches} onContactClick={onContactClick} />
      );
      break;
    case "gallery":
      activePageContent = <GalleryPage gallery={gallery} />;
      break;
    case "achievements":
      activePageContent = (
        <AchievementsPage achievements={achievements} onContactClick={onContactClick} />
      );
      break;
    case "experience":
      activePageContent = <ExperiencePage experience={experience} />;
      break;
    default:
      activePageContent = (
        <HomePage
          profile={profile}
          tuition={tuition}
          achievements={achievements}
          batches={batches}
          gallery={gallery}
          name={name}
          onContactClick={onContactClick}
          onCopyLink={onCopyLink}
          copyMessage={copyMessage}
          basePath={basePath}
          whatsappNumber={whatsappNumber}
          phoneCall={phoneCall}
        />
      );
  }

  return (
    <div className={`theme-luminary ${isDark ? "dark" : ""}`}>
      <div className="min-h-screen bg-[#fafaf9] text-neutral-900 transition-colors duration-300 dark:bg-[#0b0f19] dark:text-neutral-100 font-sans selection:bg-amber-500 selection:text-white">
        {/* Subtle Ambient Radial Lighting */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-500/10 via-indigo-600/5 to-transparent blur-3xl dark:from-amber-500/5 dark:via-indigo-500/5" />
        </div>

        {/* ── Luxury Header ── */}
        <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/80 backdrop-blur-md dark:border-neutral-800/80 dark:bg-[#0b0f19]/80">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            {/* Left: Brand / Crest */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 lg:hidden dark:border-neutral-800 dark:text-neutral-300"
                aria-label="Toggle navigation menu"
              >
                <LuminaryIcon name={mobileMenuOpen ? "close" : "menu"} className="h-5 w-5" />
              </button>

              <Link to={basePath} className="flex items-center gap-2.5 min-w-0 group">
                <TuitionLogo tuition={tuition} name={academyName} fallback={<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  <LuminaryIcon name="crown" className="h-5 w-5" />
                </div>} />
                <div className="min-w-0">
                  <span className="block truncate text-sm font-black tracking-tight text-neutral-900 dark:text-white">
                    {academyName}
                  </span>
                  <span className="block text-[10px] font-bold tracking-widest text-amber-600 uppercase dark:text-amber-400">
                    LUMINARY ELITE
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Desktop Navigation Bar */}
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main menu">
              {pageLinks.map((link) => {
                const isActive = currentPage === link.id;
                const path = link.id === "home" ? basePath : `${basePath}/${link.id}`;
                return (
                  <Link
                    key={link.id}
                    to={path}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 border border-amber-500/20"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/60"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Theme Toggle & Direct Enquiry Button */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setThemeMode(isDark ? "light" : "dark")}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-50 active:scale-95 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                title={`Switch to ${isDark ? "light" : "dark"} mode`}
              >
                <LuminaryIcon name={isDark ? "sun" : "moon"} className="h-4.5 w-4.5" />
              </button>

              <button
                type="button"
                onClick={onContactClick}
                className="hidden sm:inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 text-xs font-bold text-white shadow-sm transition hover:from-amber-500 hover:to-amber-600 active:scale-95"
              >
                <LuminaryIcon name="message" className="h-3.5 w-3.5" />
                <span>Consultation</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Mobile Drawer Navigation ── */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] border-r border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-[#0b0f19]">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white">
                    <LuminaryIcon name="crown" className="h-4 w-4" />
                  </div>
                  <span className="font-extrabold text-sm text-neutral-900 dark:text-white">
                    Menu
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  aria-label="Close menu"
                >
                  <LuminaryIcon name="close" className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-1">
                {pageLinks.map((link) => {
                  const isActive = currentPage === link.id;
                  const path = link.id === "home" ? basePath : `${basePath}/${link.id}`;
                  return (
                    <Link
                      key={link.id}
                      to={path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                        isActive
                          ? "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
                          : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <LuminaryIcon name={link.icon} className="h-4 w-4 text-amber-500" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onContactClick();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-600/20"
                >
                  <LuminaryIcon name="message" className="h-4 w-4" />
                  <span>Direct Consultation</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main Workspace Content ── */}
        <main className="mx-auto min-h-[75vh] max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
          {activePageContent}
        </main>

        {/* ── Luxury Prestige Footer ── */}
        <footer className="border-t border-neutral-200/80 bg-white dark:border-neutral-800/80 dark:bg-[#080c14]">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
            <div className="space-y-3">
              <Link to={basePath} className="flex items-center gap-2">
                <TuitionLogo tuition={tuition} name={academyName} className="h-9 w-9" fallback={<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white">
                  <LuminaryIcon name="crown" className="h-4 w-4" />
                </div>} />
                <span className="text-sm font-black text-neutral-900 dark:text-white">
                  {academyName}
                </span>
              </Link>
              <p className="text-xs text-neutral-500 leading-relaxed max-w-xs dark:text-neutral-400">
                Discover classes, experience, and student achievements.
              </p>
              <p className="text-[11px] text-neutral-400">
                © {new Date().getFullYear()} {name}. All rights reserved.
              </p>
            </div>

            <nav aria-label="Footer navigation">
              <h3 className="text-xs font-bold tracking-widest text-neutral-900 uppercase dark:text-white">
                Portfolio Sections
              </h3>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {pageLinks.map((link) => (
                  <li key={link.id}>
                    <Link
                      to={link.id === "home" ? basePath : `${basePath}/${link.id}`}
                      className="text-neutral-500 hover:text-amber-600 transition dark:text-neutral-400 dark:hover:text-amber-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>


          </div>
        </footer>

        {/* ── Floating Mobile Quick-Action Hub ── */}
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 sm:hidden">
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 active:scale-95 transition"
              aria-label="Chat on WhatsApp"
            >
              <LuminaryIcon name="whatsapp" className="h-6 w-6" />
            </a>
          )}
          <button
            type="button"
            onClick={onContactClick}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-xl shadow-amber-600/40 active:scale-95 transition"
            aria-label="Direct Consultation"
          >
            <LuminaryIcon name="message" className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

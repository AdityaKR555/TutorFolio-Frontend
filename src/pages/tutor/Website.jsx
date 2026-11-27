import { getTutorWebsiteUrl } from "../../utils/websiteUrls";
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { getStoredUser } from "../../utils/auth";
import {
  UserRound,
  MessageCircle,
  Trophy,
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
} from "lucide-react";

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const getUserId = () => {
  const u = getStoredUser();
  return (
    u?.userId ??
    u?.userid ??
    u?.user_id ??
    u?.id ??
    u?.user?.userId ??
    u?.user?.id ??
    null
  );
};

const getUsername = () => {
  const u = getStoredUser();
  return u?.username ?? "";
};

const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const checkApiResponse = (res, fallback) => {
  const r = res?.data;
  if (r?.status >= 400) throw new Error(r.message || fallback);
  return r?.data;
};

const formatPlan = (p) =>
  !p ? "Free" : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();

const getPlanRequirement = (availability, currentPlan) => {
  if (!Array.isArray(availability)) return "Plan details unavailable";
  const plans = availability.filter((plan) => typeof plan === "string" && plan.trim()).map((plan) => plan.trim().toLowerCase());
  const rank = { free: 0, pro: 1, elite: 2 };
  const currentRank = rank[String(currentPlan || "").trim().toLowerCase()];
  const upgrade = plans.filter((plan) => rank[plan] !== undefined && currentRank !== undefined && rank[plan] > currentRank).sort((a, b) => rank[a] - rank[b])[0];
  if (upgrade) return `Upgrade to ${formatPlan(upgrade)}`;
  return plans.length ? `Available on ${plans.map(formatPlan).join(" or ")}` : "Plan details unavailable";
};

/* ─── Visual Mini-Artworks for Theme Selector ─────────────────────────── */
function ClassicPreviewArt({ primary = "#1e40af", secondary = "#3b82f6", bg = "#f8fafc" }) {
  return (
    <div
      className="relative h-28 sm:h-36 w-full select-none overflow-hidden p-2 sm:p-2.5 transition-transform duration-300 group-hover:scale-[1.01]"
      style={{ backgroundColor: bg }}
    >
      {/* Top Academic Navigation Bar */}
      <div
        className="mb-2 flex items-center justify-between rounded-md px-2 py-1 shadow-xs"
        style={{ backgroundColor: primary }}
      >
        <div className="flex items-center gap-1.5">
          <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-300 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
          </svg>
          <div className="h-1.5 w-12 sm:w-16 rounded-sm bg-white/90" />
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="h-1 w-5 sm:w-7 rounded-sm bg-white/60" />
          <div className="h-1 w-5 sm:w-7 rounded-sm bg-white/60" />
          <div className="h-3 sm:h-3.5 w-7 sm:w-9 rounded-sm bg-white text-[7px] font-bold text-blue-900 flex items-center justify-center">
            Admit
          </div>
        </div>
      </div>

      {/* Main Split Academic Content */}
      <div className="grid grid-cols-12 gap-1.5 sm:gap-2 h-full">
        {/* Left: Classic Faculty Profile Card */}
        <div className="col-span-4 rounded-md border border-slate-200 bg-white p-1 sm:p-1.5 shadow-xs flex flex-col items-center text-center">
          <div className="relative mb-1 h-7 w-7 sm:h-9 sm:w-9 rounded-full border-2 border-blue-500 bg-blue-50 flex items-center justify-center">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-600 text-[6px] text-white font-bold">✓</span>
          </div>
          <div className="h-1 sm:h-1.5 w-10 sm:w-12 rounded bg-slate-800" />
          <div className="mt-0.5 h-1 w-7 sm:w-9 rounded bg-slate-400" />
          <div className="mt-1 flex items-center gap-0.5">
            <span className="h-1 w-1 rounded-full bg-amber-400" />
            <span className="h-1 w-1 rounded-full bg-amber-400" />
            <span className="h-1 w-1 rounded-full bg-amber-400" />
          </div>
        </div>

        {/* Right: Academic Syllabus & Notice Board */}
        <div className="col-span-8 flex flex-col gap-1 sm:gap-1.5">
          <div className="rounded-md border border-blue-100 bg-blue-50/70 p-1 sm:p-1.5">
            <div className="h-1.5 sm:h-2 w-20 sm:w-28 rounded" style={{ backgroundColor: primary }} />
            <div className="mt-1 h-1 w-full rounded bg-slate-300/80" />
            <div className="mt-0.5 h-1 w-3/4 rounded bg-slate-300/80" />
          </div>

          <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
            <div className="rounded-md border-l-2 border-blue-600 bg-white p-1 shadow-xs">
              <div className="h-1 w-8 rounded bg-blue-900" />
              <div className="mt-0.5 h-1 w-11 rounded bg-slate-300" />
            </div>
            <div className="rounded-md border-l-2 border-sky-400 bg-white p-1 shadow-xs">
              <div className="h-1 w-8 rounded bg-sky-900" />
              <div className="mt-0.5 h-1 w-11 rounded bg-slate-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MinimalPreviewArt({ primary = "#0f172a", secondary = "#10b981", bg = "#ffffff" }) {
  return (
    <div
      className="relative h-28 sm:h-36 w-full select-none overflow-hidden p-2 sm:p-2.5 transition-transform duration-300 group-hover:scale-[1.01]"
      style={{ backgroundColor: bg }}
    >
      {/* Subtle Dot Grid Background Pattern */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: "radial-gradient(#94a3b8 0.75px, transparent 0.75px)",
          backgroundSize: "8px 8px",
        }}
      />

      {/* Floating Modern Pill Navbar */}
      <div className="relative mb-2 sm:mb-2.5 mx-auto flex h-4 sm:h-5 w-44 sm:w-56 items-center justify-between rounded-full border border-neutral-200/90 bg-white/95 px-2 sm:px-2.5 shadow-xs backdrop-blur-xs">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[7px] sm:text-[8px] font-bold tracking-tight text-neutral-800">
            STUDIO.ED
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 sm:w-6 rounded bg-neutral-400" />
          <div className="h-0.5 w-4 sm:w-6 rounded bg-neutral-400" />
          <div className="h-2.5 sm:h-3 w-5 sm:w-6 rounded-full bg-neutral-900" />
        </div>
      </div>

      {/* Modern Typographic Minimal Hero */}
      <div className="relative grid grid-cols-12 gap-2 items-center">
        <div className="col-span-8 flex flex-col gap-1">
          <div className="inline-flex items-center gap-1 w-fit rounded-sm bg-neutral-100 px-1 py-0.5 text-[6px] sm:text-[7px] font-mono text-neutral-600">
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
            MINIMALIST FRAMEWORK
          </div>
          <div className="h-2 sm:h-2.5 w-24 sm:w-32 rounded-xs bg-neutral-900" />
          <div className="h-1.5 w-16 sm:w-20 rounded-xs bg-neutral-400" />
          <div className="mt-1 flex items-center gap-1">
            <div className="h-3 sm:h-4 w-12 sm:w-16 rounded-sm bg-neutral-900 flex items-center justify-center">
              <div className="h-0.5 w-8 rounded-full bg-white" />
            </div>
            <div className="h-3 sm:h-4 w-8 sm:w-10 rounded-sm border border-neutral-300 bg-white" />
          </div>
        </div>

        {/* Minimal Monogram / Avatar Cube */}
        <div className="col-span-4 flex justify-end">
          <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-xl border border-neutral-200 bg-neutral-50 p-1 flex flex-col items-center justify-center shadow-xs">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-neutral-900 text-white font-mono text-[9px] sm:text-[11px] font-bold">
              M
            </div>
            <div className="mt-1 flex items-center gap-0.5">
              <span className="h-0.5 w-2 rounded bg-emerald-500" />
              <span className="h-0.5 w-4 rounded bg-neutral-300" />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Hairline Blocks */}
      <div className="relative mt-2 grid grid-cols-3 gap-1">
        {[
          { label: "COHORTS", val: "04" },
          { label: "PASS RATE", val: "99%" },
          { label: "CURATION", val: "1:1" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="rounded border border-neutral-200/90 bg-white/95 px-1 py-0.5 text-center shadow-2xs"
          >
            <div className="font-mono text-[7px] sm:text-[8px] font-bold text-neutral-800">{item.val}</div>
            <div className="text-[5px] sm:text-[6px] tracking-wider text-neutral-400 uppercase">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LuminaryPreviewArt({ primary = "#d97706", secondary = "#fbbf24", bg = "#090d16" }) {
  return (
    <div
      className="relative h-28 sm:h-36 w-full select-none overflow-hidden p-2 sm:p-2.5 transition-transform duration-300 group-hover:scale-[1.01]"
      style={{ backgroundColor: bg }}
    >
      {/* Luxury Golden Ambient Backlight Glow */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-28 sm:h-36 w-28 sm:w-36 rounded-full blur-2xl opacity-80"
        style={{
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, rgba(217, 119, 6, 0.15) 50%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 h-24 sm:h-32 w-24 sm:w-32 rounded-full blur-xl opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)",
        }}
      />

      {/* Top Luxury Obsidian Glass Bar */}
      <div className="relative mb-2 flex items-center justify-between rounded-lg border border-amber-500/30 bg-black/60 px-2 py-1 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
          </svg>
          <span className="text-[7px] sm:text-[8px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500 uppercase">
            LUMINARY ELITE
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-0.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-1 py-0.2 text-[6px] font-bold text-amber-300">
            ★ PRO
          </span>
          <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
        </div>
      </div>

      {/* Hero Showcase with Radiant Golden Avatar Ring */}
      <div className="relative grid grid-cols-12 gap-2 items-center">
        {/* Left: Golden Ring with Heraldic Crest */}
        <div className="col-span-4 flex items-center justify-center">
          <div className="relative flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center">
            {/* Spinning decorative gold dashed ring */}
            <svg className="absolute inset-0 h-full w-full animate-[spin_20s_linear_infinite]" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 4" fill="none" opacity="0.8" />
            </svg>
            <div className="relative flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 border-amber-400 bg-gradient-to-b from-amber-950/80 to-black shadow-lg">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div className="absolute -bottom-1 rounded-full border border-amber-300/60 bg-black/90 px-1 text-[5px] sm:text-[6px] font-bold text-amber-300">
              ELITE
            </div>
          </div>
        </div>

        {/* Right: Golden Typography & Pedigree Glass Plaque */}
        <div className="col-span-8 flex flex-col gap-1">
          <div className="h-2 sm:h-2.5 w-20 sm:w-28 rounded-xs bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 shadow-xs" />
          <div className="h-1 sm:h-1.5 w-14 sm:w-20 rounded-xs bg-amber-200/50" />
          
          <div className="mt-1 flex items-center gap-1.5">
            <div className="flex-1 rounded border border-amber-500/30 bg-black/60 p-1 backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <span className="text-[6px] font-bold text-amber-300">PEDIGREE</span>
                <span className="text-[6px] text-amber-400 font-mono">100%</span>
              </div>
              <div className="mt-0.5 h-0.5 w-full rounded bg-neutral-800 overflow-hidden">
                <div className="h-full w-4/5 bg-gradient-to-r from-amber-500 to-amber-300" />
              </div>
            </div>

            <div className="h-4 sm:h-5 w-9 sm:w-12 rounded border border-amber-400/60 bg-gradient-to-r from-amber-600 to-amber-500 flex items-center justify-center shadow-md">
              <span className="text-[6px] sm:text-[7px] font-black text-black">ENROLL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shimmering Bottom Obsidian Cards */}
      <div className="relative mt-1.5 grid grid-cols-2 gap-1">
        <div className="rounded border border-amber-500/20 bg-black/40 px-1 py-0.5 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <div className="h-1 w-10 sm:w-14 rounded bg-amber-100/40" />
        </div>
        <div className="rounded border border-amber-500/20 bg-black/40 px-1 py-0.5 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <div className="h-1 w-10 sm:w-14 rounded bg-amber-100/40" />
        </div>
      </div>
    </div>
  );
}

function AuroraPreviewArt({ primary = "#c8fc78", secondary = "#743de3", bg = "#111022" }) {
  return (
    <div
      className="relative h-28 sm:h-36 w-full select-none overflow-hidden p-2 sm:p-2.5 transition-transform duration-300 group-hover:scale-[1.01]"
      style={{ backgroundColor: bg }}
    >
      {/* Cosmic Dual Ambient Glows */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-28 sm:h-36 w-28 sm:w-36 rounded-full blur-2xl opacity-60"
        style={{ background: secondary }}
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 h-24 sm:h-32 w-24 sm:w-32 rounded-full blur-xl opacity-40"
        style={{ background: "#00696f" }}
      />

      {/* Top Cosmic Navigation Bar */}
      <div className="relative mb-2 flex items-center justify-between border-b border-white/10 pb-1.5">
        <div className="flex items-center gap-1.5">
          <div
            className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-md font-black text-black text-[8px]"
            style={{ backgroundColor: primary }}
          >
            ✦
          </div>
          <span className="text-[7px] sm:text-[8px] font-black tracking-widest text-white uppercase">
            AURORA
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 rounded bg-white/40" />
          <div className="h-0.5 w-4 rounded bg-white/40" />
          <div
            className="rounded-full px-1.5 py-0.5 text-[6px] font-bold text-black"
            style={{ backgroundColor: primary }}
          >
            Talk ↗
          </div>
        </div>
      </div>

      {/* Hero Content with Planetary Orbits */}
      <div className="relative grid grid-cols-12 gap-2 items-center">
        <div className="col-span-7 flex flex-col gap-1">
          <div className="inline-flex items-center gap-1 text-[6px] sm:text-[7px] font-bold tracking-wider uppercase" style={{ color: primary }}>
            <span className="h-1 w-1 rounded-full animate-ping" style={{ backgroundColor: primary }} />
            A Brighter Way
          </div>
          <div className="h-2 sm:h-2.5 w-20 sm:w-28 rounded-xs bg-white" />
          <div className="h-1 sm:h-1.5 w-14 sm:w-20 rounded-xs bg-purple-200/50" />
          
          <div className="mt-1 flex items-center gap-1">
            <div
              className="h-3 sm:h-4 w-12 sm:w-16 rounded-full flex items-center justify-center font-bold text-[6px] text-black shadow-xs"
              style={{ backgroundColor: primary }}
            >
              Classes →
            </div>
            <div className="h-3 sm:h-4 w-8 sm:w-10 rounded-full border border-white/30 bg-white/5" />
          </div>
        </div>

        {/* Dual Organic Orbits around Avatar */}
        <div className="col-span-5 flex justify-end">
          <div className="relative flex h-14 w-14 sm:h-18 sm:w-18 items-center justify-center">
            {/* Outer Orbit */}
            <div
              className="absolute inset-0 rounded-[44%_56%_59%_41%] border border-purple-400/40 animate-[spin_15s_linear_infinite]"
            />
            {/* Inner Orbit */}
            <div
              className="absolute inset-1.5 rounded-[56%_44%_41%_59%] border border-lime-300/40 animate-[spin_20s_linear_infinite_reverse]"
            />
            {/* Center Avatar */}
            <div className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-[40%_40%_12px_12px] bg-gradient-to-tr from-purple-700 to-indigo-500 flex items-center justify-center shadow-lg border border-white/20">
              <span className="text-white text-[10px] font-black">A</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats pill footer */}
      <div className="relative mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2 py-0.5">
        <span className="text-[6px] text-purple-200 font-mono">100% INQUIRY</span>
        <span className="text-[6px] font-bold" style={{ color: primary }}>COSMIC FLOW</span>
        <span className="text-[6px] text-purple-200 font-mono">2026 ED</span>
      </div>
    </div>
  );
}

function MotionStudioPreviewArt({ primary = "#414dff", secondary = "#d6ff63", bg = "#101116" }) {
  return (
    <div
      className="relative h-28 sm:h-36 w-full select-none overflow-hidden p-2 sm:p-2.5 transition-transform duration-300 group-hover:scale-[1.01]"
      style={{ backgroundColor: bg }}
    >
      {/* Dynamic 3D Scene Fallback Flare */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-32 sm:h-40 w-32 sm:w-40 rounded-full blur-2xl opacity-50"
        style={{
          background: "radial-gradient(circle, #6375ff 0%, #262c7b 50%, transparent 70%)",
        }}
      />

      {/* Top Minimal Studio Navigation */}
      <div className="relative mb-2 flex items-center justify-between border-b border-white/10 pb-1">
        <div className="flex items-center gap-1.5">
          <div
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded font-mono font-black text-white text-[8px] flex items-center justify-center"
            style={{ backgroundColor: primary }}
          >
            5
          </div>
          <span className="text-[7px] sm:text-[8px] font-black tracking-widest text-white uppercase">
            MOTION STUDIO
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-0.5 w-4 rounded bg-white/40" />
          <div className="h-0.5 w-4 rounded bg-white/40" />
          <div className="h-3 sm:h-3.5 w-8 rounded-full border border-white/30 text-[6px] font-bold text-white flex items-center justify-center">
            Menu
          </div>
        </div>
      </div>

      {/* Kinetic Hero Layout */}
      <div className="relative grid grid-cols-12 gap-2 items-center">
        <div className="col-span-7 flex flex-col gap-1">
          <div className="text-[6px] sm:text-[7px] font-mono tracking-widest text-[#9da7ff] uppercase">
            KINETIC // LAB
          </div>
          <div className="h-2.5 sm:h-3 w-22 sm:w-30 rounded-xs bg-white" />
          <div className="h-1.5 w-14 sm:w-20 rounded-xs bg-slate-400" />
          
          <div className="mt-1 flex items-center gap-1.5">
            <div
              className="h-3.5 sm:h-4 w-12 sm:w-16 rounded-full flex items-center justify-center font-bold text-[6px] text-white shadow-md"
              style={{ backgroundColor: primary }}
            >
              Action ↗
            </div>
            <div className="h-3.5 sm:h-4 w-8 sm:w-10 rounded-full border border-white/40 bg-transparent text-[6px] text-white flex items-center justify-center">
              Intro
            </div>
          </div>
        </div>

        {/* 3D Wireframe / Spatial Mesh Vector */}
        <div className="col-span-5 flex justify-end">
          <div className="relative flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl border border-white/20 bg-white/5 p-1 backdrop-blur-xs">
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-[#6574ff] flex items-center justify-center shadow-inner">
              <div
                className="h-4 w-4 sm:h-5 sm:w-5 rounded-full animate-ping opacity-60"
                style={{ backgroundColor: primary }}
              />
            </div>
            <span className="absolute bottom-1 right-1 text-[6px] font-mono text-[#d6ff63]">
              3D/SPATIAL
            </span>
          </div>
        </div>
      </div>

      {/* Kinetic Neon Marquee Strip at bottom */}
      <div
        className="relative mt-2 -mx-2.5 flex items-center justify-between px-2 py-0.5 font-mono text-[6px] font-black uppercase tracking-wider text-black overflow-hidden"
        style={{ backgroundColor: secondary }}
      >
        <span className="truncate">✦ KINETIC PEDAGOGY • STUDIO LAB • INTERACTIVE ✦</span>
      </div>
    </div>
  );
}

function GlassPreviewArt({ primary = "#b45309", secondary = "#54a880", bg = "#ebe4d8" }) {
  // Frosted "glass" surface used for every card in this mini preview
  const glass = {
    background: "rgba(255, 255, 255, 0.55)",
    border: "1px solid rgba(255, 255, 255, 0.8)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 14px -10px rgba(80,55,20,0.45)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
  };

  return (
    <div
      className="relative h-28 sm:h-36 w-full select-none overflow-hidden p-2 sm:p-2.5 transition-transform duration-300 group-hover:scale-[1.01]"
      style={{ backgroundColor: bg }}
    >
      {/* Ambient colour orbs the glass appears to refract */}
      <div
        className="pointer-events-none absolute -top-8 -left-6 h-24 sm:h-32 w-24 sm:w-32 rounded-full blur-2xl opacity-80"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute top-4 -right-8 h-24 sm:h-32 w-24 sm:w-32 rounded-full blur-2xl opacity-70"
        style={{ background: "radial-gradient(circle, rgba(244,114,94,0.55) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-10 left-10 h-24 sm:h-28 w-24 sm:w-28 rounded-full blur-2xl opacity-70"
        style={{ background: `radial-gradient(circle, ${secondary} 0%, transparent 70%)` }}
      />

      {/* Floating glass pill navbar */}
      <div
        className="relative mb-2 flex h-4 sm:h-5 items-center justify-between rounded-full px-2"
        style={glass}
      >
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: primary }} />
          <div className="h-1 w-8 sm:w-10 rounded-sm bg-stone-800/80" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-0.5 w-4 sm:w-5 rounded bg-stone-500/60" />
          <div className="h-0.5 w-4 sm:w-5 rounded bg-stone-500/60" />
          <div className="h-2.5 sm:h-3 w-7 sm:w-9 rounded-full bg-stone-900" />
        </div>
      </div>

      {/* Hero: text + glass portrait */}
      <div className="relative grid grid-cols-12 items-center gap-2">
        <div className="col-span-8 flex flex-col gap-1">
          <div
            className="inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-[6px] sm:text-[7px] font-bold tracking-wider uppercase"
            style={{ background: "rgba(217,119,6,0.15)", color: primary }}
          >
            <span className="h-1 w-1 rounded-full" style={{ backgroundColor: primary }} />
            Frosted glass
          </div>
          <div className="h-2 sm:h-2.5 w-24 sm:w-32 rounded-xs bg-stone-900" />
          <div className="h-1 sm:h-1.5 w-16 sm:w-20 rounded-xs bg-stone-500/60" />
          <div className="mt-1 flex items-center gap-1">
            <div className="h-3 sm:h-4 w-12 sm:w-16 rounded-full bg-stone-900 flex items-center justify-center">
              <div className="h-0.5 w-7 rounded-full bg-white/90" />
            </div>
            <div className="h-3 sm:h-4 w-9 sm:w-11 rounded-full" style={glass} />
          </div>
        </div>

        <div className="col-span-4 flex justify-end">
          <div
            className="relative flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl p-1"
            style={glass}
          >
            <div
              className="flex h-full w-full items-center justify-center rounded-xl text-[10px] sm:text-xs font-bold"
              style={{ background: "rgba(217,119,6,0.18)", color: primary }}
            >
              G
            </div>
            <span
              className="absolute -bottom-1 -left-2 h-3 w-6 sm:h-3.5 sm:w-8 rounded-full"
              style={glass}
            />
          </div>
        </div>
      </div>

      {/* Glass stat strip */}
      <div className="relative mt-2 grid grid-cols-3 gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg px-1 py-0.5 text-center" style={glass}>
            <div className="mx-auto h-1.5 w-4 rounded-sm bg-stone-800/80" />
            <div className="mx-auto mt-0.5 h-0.5 w-6 rounded bg-stone-500/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GenericPreviewArt({ primary = "#4F46E5", secondary = "#818CF8", bg = "#F8FAFC" }) {
  return (
    <div
      className="relative h-28 sm:h-36 w-full select-none overflow-hidden p-2.5 transition-transform duration-300 group-hover:scale-[1.01]"
      style={{ backgroundColor: bg }}
    >
      <div className="flex h-full gap-2">
        <div className="w-1/4 rounded-lg p-1.5" style={{ backgroundColor: primary }}>
          <div className="mb-2 h-3 w-3 rounded-full bg-white/80" />
          <div className="mb-1.5 h-1.5 rounded bg-white/70" />
          <div className="h-1.5 w-3/4 rounded bg-white/40" />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="h-2 w-16 rounded" style={{ backgroundColor: primary }} />
            <div className="h-4 w-10 rounded-lg" style={{ backgroundColor: secondary }} />
          </div>
          <div className="flex-1 rounded-lg border border-white/30 bg-white/60 p-2">
            <div className="mb-1.5 h-1.5 w-2/3 rounded" style={{ backgroundColor: primary, opacity: 0.8 }} />
            <div className="mb-1 h-1 w-full rounded bg-slate-300/60" />
            <div className="h-1 w-3/4 rounded bg-slate-300/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Helper to classify themes and assign metadata & color palettes */
function getThemeMeta(theme) {
  const id = String(theme?.themeId || theme?.id || "").toLowerCase();
  const rawTitle = String(theme?.title || "").toLowerCase();

  // 0. Glass (Theme 6) - signature frosted palette: warm terracotta, frosted sage, and linen chalk
  if (
    id.includes("glass") ||
    id.includes("theme6") ||
    id.includes("theme_6") ||
    rawTitle.includes("glass") ||
    rawTitle.includes("theme 6")
  ) {
    return {
      type: "glass",
      displayTitle: theme?.title && !theme.title.toLowerCase().includes("theme 6") ? theme.title : "Glass Theme",
      displayDescription: theme?.description || "iOS-style frosted glass with soft ambient colour, floating translucent panels, and a light/dark mode toggle.",
      primaryColor: "#b45309",
      secondaryColor: "#54a880",
      backgroundColor: "#ebe4d8",
      styleTag: "FROSTED",
      tagClasses: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30",
    };
  }

  // 1. Luminary Elite (Theme 3) - signature luxury gold & obsidian midnight palette
  if (
    id.includes("luminary") ||
    id.includes("elite") ||
    id.includes("theme_3") ||
    id.includes("theme3") ||
    rawTitle.includes("luminary") ||
    rawTitle.includes("theme 3") ||
    rawTitle.includes("elite")
  ) {
    return {
      type: "luminary",
      displayTitle: theme?.title && !theme.title.toLowerCase().includes("theme 3") ? theme.title : "Luminary Elite",
      displayDescription: theme?.description || "Haute-couture dark & gold aesthetic with heraldic crests, ambient radial glows, and luxury pedigree showcases.",
      primaryColor: "#d97706",
      secondaryColor: "#fbbf24",
      backgroundColor: "#090d16",
      styleTag: "PAID EXCLUSIVE",
      tagClasses: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30",
    };
  }

  // 2. Aurora (Theme 4) - signature cosmic violet & electric lime palette
  if (
    id.includes("aurora") ||
    id.includes("theme4") ||
    id.includes("theme_4") ||
    rawTitle.includes("aurora") ||
    rawTitle.includes("theme 4")
  ) {
    return {
      type: "aurora",
      displayTitle: theme?.title && !theme.title.toLowerCase().includes("theme 4") ? theme.title : "Aurora",
      displayDescription: theme?.description || "Atmospheric cosmic dark canvas with violet glows, organic planetary orbits, and electric lime accents.",
      primaryColor: "#c8fc78",
      secondaryColor: "#743de3",
      backgroundColor: "#111022",
      styleTag: "COSMIC",
      tagClasses: "bg-lime-500/15 text-lime-700 dark:text-lime-300 border border-lime-500/30",
    };
  }

  // 3. Motion Studio (Theme 5) - signature electric blue & neon marquee lime on studio black
  if (
    id.includes("motion") ||
    id.includes("studio") ||
    id.includes("theme5") ||
    id.includes("theme_5") ||
    rawTitle.includes("motion") ||
    rawTitle.includes("studio") ||
    rawTitle.includes("theme 5")
  ) {
    return {
      type: "motion_studio",
      displayTitle: theme?.title && !theme.title.toLowerCase().includes("theme 5") ? theme.title : "Motion Studio",
      displayDescription: theme?.description || "High-energy kinetic editorial layout with electric blue accents, marquee tickers, and bold studio motion.",
      primaryColor: "#414dff",
      secondaryColor: "#d6ff63",
      backgroundColor: "#101116",
      styleTag: "KINETIC",
      tagClasses: "bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-500/30",
    };
  }

  // 4. Modern Minimal - signature crisp monochrome & studio emerald
  if (id.includes("minimal") || rawTitle.includes("minimal") || id.includes("modern")) {
    return {
      type: "minimal",
      displayTitle: theme?.title || "Modern Minimal",
      displayDescription: theme?.description || "Clean, content-first Swiss layout with subtle borders, refined monospace accents, and breathable whitespace.",
      primaryColor: "#0f172a",
      secondaryColor: "#10b981",
      backgroundColor: "#ffffff",
      styleTag: "MODERN",
      tagClasses: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
    };
  }

  // 5. Classic Academic - signature university royal navy & cobalt
  if (id.includes("classic") || rawTitle.includes("classic") || rawTitle.includes("academic")) {
    return {
      type: "classic",
      displayTitle: theme?.title || "Classic Academic",
      displayDescription: theme?.description || "Traditional university-grade structure with prominent credential badges, syllabus highlights, and trusted blue accents.",
      primaryColor: "#1e40af",
      secondaryColor: "#3b82f6",
      backgroundColor: "#f8fafc",
      styleTag: "ACADEMIC",
      tagClasses: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30",
    };
  }

  return {
    type: "generic",
    displayTitle: theme?.title || "Custom Theme",
    displayDescription: theme?.description || "Customized website layout and color styling for your tutor profile.",
    primaryColor: theme?.primaryColor || "#4F46E5",
    secondaryColor: theme?.secondaryColor || "#818CF8",
    backgroundColor: theme?.backgroundColor || "#F8FAFC",
    styleTag: null,
    tagClasses: "",
  };
}

/* ─── ThemePreviewMini – visual swatch for picker ─────────────────────────── */
function ThemePreviewMini({ theme, userId, userPlan, isSelected, onApply, disabled }) {
  const meta = getThemeMeta(theme);
  const p = meta.primaryColor;
  const s = meta.secondaryColor;
  const bg = meta.backgroundColor;

  return (
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl sm:rounded-2xl border-2 transition-all duration-200 ${
        isSelected
          ? "border-indigo-500 ring-2 sm:ring-4 ring-indigo-100 dark:ring-indigo-900/60 shadow-md"
          : "border-tf-line hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm"
      }`}
    >
      {/* Visual Preview Artwork Area */}
      <div className="relative border-b border-tf-line/70">
        {meta.type === "classic" ? (
          <ClassicPreviewArt primary={p} secondary={s} bg={bg} />
        ) : meta.type === "minimal" ? (
          <MinimalPreviewArt primary={p} secondary={s} bg={bg} />
        ) : meta.type === "luminary" ? (
          <LuminaryPreviewArt primary={p} secondary={s} bg={bg} />
        ) : meta.type === "aurora" ? (
          <AuroraPreviewArt primary={p} secondary={s} bg={bg} />
        ) : meta.type === "motion_studio" ? (
          <MotionStudioPreviewArt primary={p} secondary={s} bg={bg} />
        ) : meta.type === "glass" ? (
          <GlassPreviewArt primary={p} secondary={s} bg={bg} />
        ) : (
          <GenericPreviewArt primary={p} secondary={s} bg={bg} />
        )}
      </div>

      {/* Info & Action Controls */}
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-tf-ink text-sm sm:text-base truncate">
                {meta.displayTitle}
              </span>
              {meta.styleTag && (
                <span className={`rounded-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${meta.tagClasses}`}>
                  {meta.styleTag}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isSelected && (
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                  Active
                </span>
              )}
              {!isSelected && theme.isPlanAllowed === false && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                  {getPlanRequirement(theme.planAvailability, userPlan)}
                </span>
              )}
            </div>
          </div>

          <p className="mt-1.5 text-xs text-tf-muted line-clamp-2 leading-relaxed hidden md:block">
            {meta.displayDescription}
          </p>

          {/* Theme Palette Swatches */}
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[11px] font-medium text-tf-muted">Palette:</span>
            <div className="flex items-center gap-1.5">
              {[p, s, bg].map((c, i) => (
                <span
                  key={`${c}-${i}`}
                  title={c}
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border border-tf-line/80 shadow-2xs"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex flex-col md:flex-row w-full gap-2">
          {theme.previewUrl ? (
            <a
              href={`${theme.previewUrl}/${encodeURIComponent(userId)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Preview ${meta.displayTitle} (opens in a new tab)`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-tf-line px-3 py-2 text-xs font-semibold text-tf-copy hover:bg-tf-surface-soft transition-colors"
            >
              Preview <ExternalLink size={13} />
            </a>
          ) : (
            <span className="flex-1 px-3 py-2 text-xs text-tf-muted text-center">Preview unavailable</span>
          )}
          <button
            type="button"
            onClick={onApply}
            disabled={disabled || isSelected}
            aria-label={isSelected ? `${meta.displayTitle} is active` : `Use ${meta.displayTitle}`}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-1 md:py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSelected ? "Current theme" : "Use theme"}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── main component ────────────────────────────────────────────────────────── */
export default function Website() {
  const userId = getUserId();
  const username = getUsername();
  const websiteUrl = username
    ? getTutorWebsiteUrl(username)
    : "";

  const [activeThemeId, setActiveThemeId] = useState("");
  const [availableThemes, setAvailableThemes] = useState([]);
  const [userPlan, setUserPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [emailVerified, setEmailVerified] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  /* Load current theme from backend */
  const loadTheme = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const themesRes = await api.get("/themes", { params: { userId } });
      const themesData = checkApiResponse(themesRes, "Unable to fetch themes.");
      const themes = (themesData?.themes || []).map((t) => ({
        ...t,
        themeId: t.themeId || t.id,
      }));
      setAvailableThemes(themes);
      setActiveThemeId(
        themes.find((theme) => theme.isSelected)?.themeId ||
          themes.find((theme) => theme.isSelected)?.id ||
          themesData?.selectedThemeId ||
          themesData?.themeId || "",
      );
      setUserPlan(themesData?.userPlan || "free");
      const verified = themesData?.isEmailVerified;
      setEmailVerified(typeof verified === "boolean" ? verified : null);
      setError(typeof verified === "boolean" ? "" : "Email verification status is unavailable. Please refresh after the backend is updated.");
    } catch (err) {
      console.error("Could not load themes from API:", err.message);
      setAvailableThemes([]);
      setEmailVerified(null);
      setActiveThemeId("");
      setError(getErrorMessage(err, "Unable to fetch themes from the server."));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  /* Apply theme */
  const handleApplyTheme = async (themeId) => {
    const targetTheme = availableThemes.find((theme) => (theme.themeId || theme.id) === themeId);
    if (!userId || saving || emailVerified !== true || (activeThemeId && (themeId === activeThemeId || targetTheme?.themeId === activeThemeId)) || !targetTheme ||
        targetTheme.isPlanAllowed === false) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/themes/select", {
        userId: Number(userId),
        themeId: targetTheme.themeId || targetTheme.id || themeId,
      });
      const selected = checkApiResponse(res, "Unable to select theme.");
      setActiveThemeId(selected?.themeId || selected?.id || targetTheme.themeId || targetTheme.id || themeId);
      setSuccess(
        `Theme "${selected?.theme?.title || targetTheme.title}" applied! Your website now uses this look.`,
      );
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to apply theme. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleVerification = async (verify) => {
    setVerificationBusy(true); setError(""); setSuccess("");
    try {
      const response = await api.post(verify ? "/auth/verify-otp" : "/auth/resend-otp", verify ? { userId: Number(userId), otp: verificationCode } : { userId: Number(userId) });
      checkApiResponse(response, "Unable to verify email.");
      if (verify) { setVerificationCode(""); setCodeSent(false); await loadTheme(); setSuccess("Email verified. You can now use a theme and publish your website."); }
      else { setCodeSent(true); setSuccess("Verification code sent to your account email."); }
    } catch (err) { setError(getErrorMessage(err, "Unable to verify email.")); }
    finally { setVerificationBusy(false); }
  };

  /* Copy link */
  const handleCopyLink = async () => {
    if (!websiteUrl) return;
    try {
      await navigator.clipboard.writeText(websiteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Unable to copy the link. Please copy it from the website URL below.");
    }
  };

  return (
    <div className="mobile-page mobile-website min-h-full bg-tf-bg px-3 py-4 text-tf-ink sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* ── Page header ── */}
        <div className="mb-5 sm:mb-8">
          <div className="mobile-website-heading flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-tf-ink">
                Website Settings
              </h1>
              <p className="mt-1 sm:mt-2 max-w-2xl text-xs sm:text-sm leading-5 sm:leading-6 text-tf-copy">
                Customize how your public tutor portfolio looks. Preview a theme,
                then choose Use theme to apply it to your live website.
              </p>
            </div>

            {/* View website button */}
            <div className="flex shrink-0 items-center gap-2 w-full sm:w-auto">
              {websiteUrl ? (
                <>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 sm:flex-initial sm:w-40 sm:min-w-[150px] h-9 sm:h-10 inline-flex justify-center items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-tf-line bg-tf-surface px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-tf-copy transition hover:bg-tf-surface-soft"
                  >
                    {copied ? (
                      <>
                        <Check size={15} className="text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={15} />
                        <span>Copy link</span>
                      </>
                    )}
                  </button>
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial sm:w-40 sm:min-w-[150px] h-9 sm:h-10 inline-flex justify-center items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-transparent bg-indigo-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <span>View website</span>
                    <ExternalLink size={15} />
                  </a>
                </>
              ) : (
                <Link
                  to="/settings"
                  className="w-full sm:w-auto sm:min-w-[150px] h-9 sm:h-10 inline-flex justify-center items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-amber-300 bg-amber-50 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                >
                  {username ? "Choose a website-compatible username" : "Set a username first"}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Website URL card ── */}
        {websiteUrl && (
          <div className="mb-4 sm:mb-6 flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border border-tf-line bg-tf-surface px-3 py-2.5 sm:px-5 sm:py-4">
            <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0 rounded-full bg-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-semibold text-tf-muted uppercase tracking-wider">
                Your website URL
              </p>
              <p className="mt-0.5 truncate text-xs sm:text-sm font-medium text-tf-ink">
                {websiteUrl}
              </p>
            </div>
            <button type="button" onClick={handleCopyLink} aria-label="Copy website URL" className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-tf-line px-2 py-1.5 text-xs font-semibold text-tf-copy"><Copy size={14}/>{copied ? "Copied" : "Copy"}</button>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              {emailVerified === null ? "Status unavailable" : emailVerified ? "Live" : "Not live"}
            </span>
          </div>
        )}

        {emailVerified === false && <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <p className="font-bold">Verify your email to publish your website</p><p className="mt-1">You can preview themes now. Verify your account email before using a theme or making your website public.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" disabled={verificationBusy} onClick={() => handleVerification(false)} className="rounded-lg border border-amber-400 px-3 py-2 text-xs font-semibold disabled:opacity-50">{codeSent ? "Resend code" : "Send verification code"}</button>{codeSent && <><input aria-label="Email verification code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))} placeholder="6-digit code" className="w-32 rounded-lg border border-amber-400 bg-tf-surface px-3 py-2 text-tf-ink"/><button type="button" disabled={verificationBusy || verificationCode.length !== 6} onClick={() => handleVerification(true)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Verify email</button></>}</div>
        </div>}

        {/* ── Alerts ── */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}
        {success && (
          <div
            role="status"
            className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
          >
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="font-bold"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Theme section ── */}
        <section className="rounded-xl sm:rounded-2xl border border-tf-line bg-tf-surface p-3.5 sm:p-6">
          <div className="mb-3.5 sm:mb-5 flex items-center justify-between gap-2 sm:gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-tf-ink">
                Choose a Theme
              </h2>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-tf-copy hidden sm:block">
                Open a preview in a new tab, then choose Use theme when you’re ready.
              </p>
            </div>
            <div className="shrink-0 rounded-lg sm:rounded-xl border border-tf-line px-2.5 sm:px-3 py-1 sm:py-2 text-[11px] sm:text-xs text-tf-copy">
              Plan:{" "}
              <span className="font-bold text-tf-ink">
                {formatPlan(userPlan)}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-xl sm:rounded-2xl border border-tf-line bg-tf-surface"
                >
                  <div className="h-20 sm:h-32 bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-1.5 sm:space-y-2 p-2 sm:p-3">
                    <div className="mx-auto sm:mx-0 h-3 sm:h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-2 sm:h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : availableThemes.length === 0 ? (
            <p className="text-sm text-tf-muted">
              {error ? "Themes could not be loaded. Please refresh to try again." : "No themes are currently available."}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableThemes.map((theme) => (
                <ThemePreviewMini
                  key={theme.themeId}
                  theme={theme}
                  userId={userId}
                  userPlan={userPlan}
                  isSelected={activeThemeId === theme.themeId}
                  onApply={() => handleApplyTheme(theme.themeId)}
                  disabled={saving || emailVerified !== true || theme.isPlanAllowed === false}
                />
              ))}
            </div>
          )}

          {saving && (
            <p className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-tf-muted">
              Applying theme…
            </p>
          )}
        </section>

        {/* ── Quick links ── */}
        <section className="mt-4 sm:mt-6 grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4">
          {[
            {
              label: "Edit Profile",
              desc: "Update your name, photo, and bio.",
              href: "/profile",
              icon: UserRound,
            },
            {
              label: "Manage FAQs",
              desc: "Add or edit your public FAQ answers.",
              href: "/faq",
              icon: MessageCircle,
            },
            {
              label: "Achievements",
              desc: "Showcase student success stories.",
              href: "/achievements",
              icon: Trophy,
            },
          ].map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1.5 sm:gap-3 rounded-xl sm:rounded-2xl border border-tf-line bg-tf-surface p-2 sm:p-4 transition hover:border-indigo-300 hover:shadow-sm dark:hover:border-indigo-700"
            >
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center text-tf-copy">
                <item.icon size={18} strokeWidth={1.8} className="sm:hidden" />
                <item.icon size={22} strokeWidth={1.8} className="hidden sm:block" />
              </span>

              <div className="min-w-0 w-full">
                <p className="font-semibold text-tf-ink text-[11px] sm:text-sm truncate">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-tf-muted hidden sm:block">
                  {item.desc}
                </p>
              </div>
            </Link>
          ))}
        </section>


      </div>
    </div>
  );
}
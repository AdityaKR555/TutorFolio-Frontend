import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import VisitorChatWidget from "../../components/VisitorChatWidget";
import { ThemeClassic, ThemeModern, ThemeBold, ThemeMinimal } from "../../components/themes/index.js";

/* ─── data helpers ─────────────────────────────────────────────────────────── */
function unwrap(body) {
  let v = body?.data ?? body?.details ?? body ?? {};
  for (let i = 0; i < 2; i++) {
    if (v && !Array.isArray(v) && typeof v === "object" && (v.data || v.details)) v = v.data ?? v.details;
    else break;
  }
  return v;
}
function fd(src, keys, fb = "") {
  for (const k of keys) { if (src?.[k] != null && src?.[k] !== "") return src[k]; }
  return fb;
}
function fo(src, keys) {
  for (const k of keys) { const v = src?.[k]; if (v && typeof v === "object" && !Array.isArray(v)) return v; }
  return {};
}
function fa(src, keys) {
  for (const k of keys) { if (Array.isArray(src?.[k])) return src[k]; }
  return [];
}
function normalizeWebsite(root) {
  const profile = fo(root, ["profile","tutor","tutorProfile","personalDetails","personal_details","profileDetails"]) || {};
  const tuition = fo(root, ["tuition","tuitionDetails","tuition_details","tuitionInformation"]) || {};
  const achievements = fa(root, ["achievements","studentAchievements","visibleAchievements"]);
  const batches = fa(root, ["batches","tuitionBatches","visibleBatches"]);
  return { profile, tuition, achievements, batches };
}

/* ─── theme registry ───────────────────────────────────────────────────────── */
const THEME_MAP = {
  theme_classic: ThemeClassic,
  theme_modern: ThemeModern,
  theme_bold: ThemeBold,
  theme_minimal: ThemeMinimal,
};
const DEFAULT_THEME = "theme_classic";

/* ─── fallback UI components (used when theme components aren't loaded) ─────── */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-tf-bg px-5">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 dark:border-blue-500/20 border-t-blue-500" />
        <p className="mt-4 text-sm text-tf-copy">Loading tutor website…</p>
      </div>
    </div>
  );
}
function ErrorScreen({ error, onRetry }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-tf-bg px-5 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-blue-200 dark:border-blue-500/15 bg-tf-surface p-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-2xl text-red-700 dark:text-red-300">!</div>
        <h1 className="mt-4 text-xl font-bold text-tf-ink">Tutor website unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-tf-copy">{error || "This tutor profile may not exist or may not be public."}</p>
        <button type="button" onClick={onRetry} className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">Try again</button>
        <div><Link to="/" className="mt-4 inline-block text-sm text-blue-700 dark:text-blue-300 hover:underline">Go to TutorFolio</Link></div>
      </div>
    </main>
  );
}

/* ─── main component ────────────────────────────────────────────────────────── */
export default function PublicTutorWebsite() {
  const { username = "" } = useParams();
  const [searchParams] = useSearchParams();

  const [website, setWebsite] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [error, setError] = useState("");
  const [sectionErrors, setSectionErrors] = useState({});
  const [copyMessage, setCopyMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [themeId, setThemeId] = useState(searchParams.get("theme") || DEFAULT_THEME);
  const visitRecordedRef = useRef(new Set());

  /* fetch main website data */
  const fetchWebsite = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/website/u/${encodeURIComponent(username)}`, { timeout: 20000 });
      const body = res?.data ?? {};
      if (body.status !== undefined && body.status !== 200) throw new Error(body.message || "Tutor website could not be found.");
      const root = unwrap(body);
      const normalized = normalizeWebsite(root);
      if (!Object.keys(normalized.profile).length && (root.username || root.firstName || root.profilePicture)) normalized.profile = root;
      setWebsite({ ...normalized, raw: root });

      /* fetch the tutor's selected theme from backend (non-blocking) */
      const tutorId = Number(fd(normalized.profile, ["userId","user_id","userid","tutorId","tutor_id"], 0)) || null;
      if (tutorId && !searchParams.get("theme")) {
        api.get(`/themes/current/${tutorId}`, { timeout: 8000 })
          .then((r) => {
            const tid = r?.data?.data?.theme?.themeId;
            if (tid && THEME_MAP[tid]) setThemeId(tid);
          })
          .catch(() => {}); /* silently fall back to default */
      }
    } catch (err) {
      setWebsite(null);
      setError(err?.response?.data?.message || err.message || "Unable to load this tutor website.");
    } finally {
      setLoading(false);
    }
  }, [username, searchParams]);

  useEffect(() => { if (username) fetchWebsite(); }, [fetchWebsite, username]);

  /* fetch individual sections on tab change */
  const fetchSection = useCallback(async (sectionId) => {
    if (!username || sectionId === "overview") return;
    setSectionLoading(true);
    setSectionErrors((p) => ({ ...p, [sectionId]: "" }));
    try {
      const res = await api.get(`/website/u/${encodeURIComponent(username)}/${sectionId}`, { timeout: 15000 });
      const body = res?.data ?? {};
      if (body.status !== undefined && body.status !== 200) throw new Error(body.message || `Unable to load ${sectionId}.`);
      const result = unwrap(body);
      setWebsite((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        if (sectionId === "tuition") { const o = fo(result, ["tuition","tuitionDetails","tuition_details"]); next.tuition = Object.keys(o).length ? o : result; }
        else if (sectionId === "batches") { next.batches = Array.isArray(result) ? result : fa(result, ["batches","tuitionBatches","visibleBatches","details"]); }
        else if (sectionId === "achievements") { next.achievements = Array.isArray(result) ? result : fa(result, ["achievements","studentAchievements","visibleAchievements","details"]); }
        return next;
      });
    } catch (err) {
      setSectionErrors((p) => ({ ...p, [sectionId]: err?.response?.data?.message || err.message || `Unable to refresh ${sectionId}.` }));
    } finally {
      setSectionLoading(false);
    }
  }, [username]);

  /* derived data */
  const profile = website?.profile ?? {};
  const tuition = website?.tuition ?? {};
  const achievements = website?.achievements ?? [];
  const batches = website?.batches ?? [];
  const tutorId = Number(fd(profile, ["userId","user_id","userid","tutorId","tutor_id"], 0)) || null;
  const name = [fd(profile, ["firstName","first_name"]), fd(profile, ["lastName","last_name"])].filter(Boolean).join(" ") || fd(profile, ["username"], username);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  /* visit tracking */
  const VISIT_COOLDOWN_MS = 10 * 60 * 1000;
  useEffect(() => {
    if (!website || !tutorId || visitRecordedRef.current.has(tutorId)) return;
    const key = `tutorfolio:visit-ts:${tutorId}`;
    try {
      if (Date.now() - Number(localStorage.getItem(key) || 0) < VISIT_COOLDOWN_MS) return;
      localStorage.setItem(key, String(Date.now()));
    } catch {}
    visitRecordedRef.current.add(tutorId);
    let referrer = null;
    try { referrer = document.referrer || null; } catch {}
    api.post("/notifications/visit", { tutorId, referrer }, { timeout: 10000 }).catch(() => {});
  }, [website, tutorId]);

  /* tab handler */
  const setTab = (tab) => { setActiveTab(tab); fetchSection(tab); };

  /* copy link */
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopyMessage("Link copied"); }
    catch { setCopyMessage(shareUrl); }
    setTimeout(() => setCopyMessage(""), 2500);
  };

  /* ── render ── */
  if (loading) return <LoadingScreen />;
  if (error || !website) return <ErrorScreen error={error} onRetry={fetchWebsite} />;

  /* pick theme component (fall back to Classic if unknown) */
  const ThemeComponent = THEME_MAP[themeId] ?? ThemeClassic;

  const themeProps = {
    profile,
    tuition,
    achievements,
    batches,
    activeTab,
    onTabChange: setTab,
    onContactClick: () => setChatOpen(true),
    onCopyLink: copyLink,
    copyMessage,
    sectionLoading,
    sectionErrors,
  };

  return (
    <>
      <ThemeComponent {...themeProps} />
      <VisitorChatWidget tutorId={tutorId} tutorName={name} open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}

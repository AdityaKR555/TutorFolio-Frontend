import PlatformLoader from "../../components/PlatformLoader";
import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import VisitorChatWidget from "../../components/VisitorChatWidget";
import { ThemeClassic, ThemeMinimal, ThemeLuminary, ThemeAurora } from "../../components/themes/index.js";
import TuitionLogo from "../../components/themes/TuitionLogo";
import "../../components/themes/theme-standards.css";
const ThemeFive = lazy(() => import("../../components/themes/ThemeFive"));

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
  const experience = fa(root, ["experience","experiences","workExperience"]);
  const faqs = fa(root, ["faqs","FAQs","questions"]);
  const gallery = fa(root, ["gallery","galleryImages","images"]);
  return { profile, tuition, achievements, batches, experience, faqs, gallery };
}

/* ─── theme registry ───────────────────────────────────────────────────────── */
const THEME_MAP = {
  theme5: ThemeFive,
  motion_studio: ThemeFive,
  theme4: ThemeAurora,
  aurora: ThemeAurora,
  classic: ThemeClassic,
  minimal: ThemeMinimal,
  luminary_elite: ThemeLuminary,
  theme_3: ThemeLuminary,
  theme3: ThemeLuminary,
  elite: ThemeLuminary,
  elite_academy: ThemeLuminary,
  // Backward compatibility aliases for existing saved records in DB
  vibrant_slate: ThemeLuminary,
  bold_educator: ThemeLuminary,
  theme_classic: ThemeClassic,
  theme_minimal: ThemeMinimal,
  theme_modern: ThemeMinimal,
  theme_bold: ThemeLuminary,
};
const DEFAULT_THEME = "classic";

/* ─── fallback UI components (used when theme components aren't loaded) ─────── */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-tf-bg px-5">
      <div className="text-center">
        <PlatformLoader showLabel={false} />
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
  const { username = "", section = "", previewThemeId, previewUserId } = useParams();
  const isPreview = Boolean(previewThemeId && previewUserId);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [themeId, setThemeId] = useState(searchParams.get("theme") || DEFAULT_THEME);
  const [themeInfo, setThemeInfo] = useState(null);
  const visitRecordedRef = useRef(null);

  /* fetch main website data */
  const fetchWebsite = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(isPreview
        ? `/themes/preview/${encodeURIComponent(previewThemeId)}?userId=${encodeURIComponent(previewUserId)}`
        : `/website/u/${encodeURIComponent(username)}`, { timeout: 20000 });
      const body = res?.data ?? {};
      if (body.status !== undefined && body.status !== 200) throw new Error(body.message || "Tutor website could not be found.");
      const payload = unwrap(body);
      const root = isPreview ? payload.website : payload;
      if (isPreview) {
        if (!THEME_MAP[payload.theme?.themeId]) throw new Error("This theme does not have a supported preview yet.");
        setThemeId(payload.theme.themeId);
        setThemeInfo(payload.theme);
      }
      const normalized = normalizeWebsite(root);
      if (!Object.keys(normalized.profile).length && (root.username || root.firstName || root.profilePicture)) normalized.profile = root;
      /* Resolve theme metadata before displaying the site so branding matches the selected theme. */
      const tutorId = Number(fd(normalized.profile, ["userId","user_id","userid","tutorId","tutor_id"], 0)) || null;
      if (!isPreview) {
        const requestedTheme = searchParams.get("theme");
        try {
          const themeResponse = await api.get(requestedTheme ? `/themes/${encodeURIComponent(requestedTheme)}` : tutorId ? `/themes/current/${tutorId}` : `/themes/${DEFAULT_THEME}`, { timeout: 8000 });
          const data = themeResponse?.data?.data;
          const theme = data?.theme || data;
          const tid = theme?.themeId;
          if (tid && THEME_MAP[tid]) { setThemeId(tid); setThemeInfo(theme); }
          else { setThemeId(DEFAULT_THEME); setThemeInfo(null); }
        } catch {
          setThemeId(DEFAULT_THEME);
          setThemeInfo(null);
        }
      }
      setWebsite({ ...normalized, raw: root });
    } catch (err) {
      setWebsite(null);
      setError(err?.response?.data?.message || err.message || "Unable to load this tutor website.");
    } finally {
      setLoading(false);
    }
  }, [username, searchParams, isPreview, previewThemeId, previewUserId]);

  useEffect(() => { if (username || isPreview) fetchWebsite(); }, [fetchWebsite, username, isPreview]);

  /* derived data */
  const profile = website?.profile ?? {};
  const tuition = website?.tuition ?? {};
  const achievements = website?.achievements ?? [];
  const batches = website?.batches ?? [];
  const experience = website?.experience ?? [];
  const faqs = website?.faqs ?? [];
  const gallery = website?.gallery ?? [];
  const tutorId = Number(fd(profile, ["userId","user_id","userid","tutorId","tutor_id"], 0)) || null;
  const name = [fd(profile, ["firstName","first_name"]), fd(profile, ["lastName","last_name"])].filter(Boolean).join(" ") || fd(profile, ["username"], username);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const validPages = ["about", "classes", "batches", "gallery", "achievements", "experience"];
  const currentPage = ["faqs", "contact"].includes(section) ? "about" : validPages.includes(section) ? section : "home";

  /* The 24-hour quiet period resets on every page visit, per tutor and browser. */
  useEffect(() => {
    if (isPreview || !website || !tutorId) return;
    const visitKey = `${tutorId}:${currentPage}`;
    if (visitRecordedRef.current === visitKey) return;
    visitRecordedRef.current = visitKey;
    const key = `tutorfolio:last-visit-v2:${tutorId}`;
    let notifyTutor = true;
    try {
      const now = Date.now();
      const last = Number(localStorage.getItem(key));
      notifyTutor = !last || now - last >= 24 * 60 * 60 * 1000 || now < last;
      localStorage.setItem(key, String(now));
    } catch { /* Without storage, repeat visits cannot be recognized. */ }
    let referrer = null;
    try { referrer = document.referrer || null; } catch {}
    api.post("/notifications/visit", { tutorId, referrer, section: currentPage, notifyTutor }, { timeout: 10000 }).catch(() => {});
  }, [website, tutorId, isPreview, currentPage]);

  const navigatePage = (page) => {
    const base = isPreview
      ? `/theme-preview/${encodeURIComponent(previewThemeId)}/${encodeURIComponent(previewUserId)}`
      : `/tutor/${encodeURIComponent(username)}`;
    navigate(page === "home" ? base : `${base}/${page}`);
  };
  const navigateLegacySection = (tab) => navigatePage(({ overview: "home", tuition: "classes", faqs: "about", contact: "about" })[tab] || tab);

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
  const isFreeTheme = Array.isArray(themeInfo?.planAvailability) && themeInfo.planAvailability.some((plan) => String(plan).trim().toLowerCase() === "free");
  const needsSharedIdentity = ![ThemeClassic, ThemeMinimal, ThemeLuminary, ThemeAurora, ThemeFive].includes(ThemeComponent);

  const themeProps = {
    profile,
    tuition,
    achievements,
    batches,
    experience,
    faqs,
    gallery,
    username,
    previewBasePath: isPreview ? `/theme-preview/${encodeURIComponent(previewThemeId)}/${encodeURIComponent(previewUserId)}` : undefined,
    currentPage,
    activeTab: ({ home: "overview", classes: "tuition" })[currentPage] || currentPage,
    onPageChange: navigatePage,
    onTabChange: navigateLegacySection,
    onContactClick: () => { if (!isPreview) setChatOpen(true); },
    onCopyLink: copyLink,
    copyMessage,
    sectionLoading: false,
    sectionErrors: {},
  };

  return (
    <div className="mobile-public-portfolio">
      {isPreview && (
        <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-indigo-600 px-4 py-3 text-sm text-white">
          <span>Theme preview. Your live website has not changed.</span>
          <Link to="/website" className="shrink-0 rounded-lg bg-white px-3 py-2 font-semibold text-indigo-700">Back to themes</Link>
        </div>
      )}
      {needsSharedIdentity && <TuitionLogo tuition={tuition} name={fd(tuition, ["tuitionName", "tuitionClassName"], name)} className="tf-theme-identity-logo" fallback={null} />}
      <Suspense fallback={<LoadingScreen />}><ThemeComponent {...themeProps} /></Suspense>
      {needsSharedIdentity && <TuitionLogo tuition={tuition} name={fd(tuition, ["tuitionName", "tuitionClassName"], name)} className="tf-theme-identity-logo" fallback={null} />}
      {isFreeTheme && <footer className="tf-theme-credit"><div className="tf-theme-credit-inner"><div className="tf-theme-credit-brand"><img src="/tf-logo.png" alt="" /><span>This website is built by <a className="tf-theme-credit-name" href="https://alpha.tutorfolio.site" target="_blank" rel="noopener noreferrer">TutorFolio</a></span></div><a className="tf-theme-credit-action" href="https://alpha.tutorfolio.site" target="_blank" rel="noopener noreferrer">Get your own free website now <span aria-hidden="true">↗</span></a></div></footer>}
      {!isPreview && <VisitorChatWidget tutorId={tutorId} tutorName={name} open={chatOpen} onClose={() => setChatOpen(false)} />}
    </div>
  );
}

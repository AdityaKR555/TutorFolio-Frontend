import { recoverGalleryImage } from "../../utils/galleryDelivery";
import { getTutorNavigationBase } from "../../utils/websiteUrls";
import PlatformLoader from "../../components/PlatformLoader";
import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Globe, RefreshCw } from "lucide-react";
import api from "../../api/axios";
import VisitorChatWidget from "../../components/VisitorChatWidget";
import { ThemeClassic, ThemeMinimal, ThemeLuminary, ThemeAurora, ThemeGlass } from "../../components/themes/index.js";
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
  glass: ThemeGlass,
  theme_glass: ThemeGlass,
  theme6: ThemeGlass,
  theme_6: ThemeGlass,
};
const NOT_CONFIGURED = "WEBSITE_NOT_CONFIGURED";

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
function ErrorScreen({ message, onRetry }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-tf-bg px-5 py-16">
      <section aria-labelledby="website-unavailable-title" className="w-full max-w-lg rounded-3xl border border-blue-200 dark:border-blue-500/15 bg-tf-surface p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
          <Globe size={30} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h1 id="website-unavailable-title" className="mt-6 text-2xl font-bold tracking-tight text-tf-ink">This tutor website is unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-tf-copy">{message || "We couldn’t load this page. Please try again, or come back a little later."}</p>
        <div className="mt-6 rounded-2xl bg-blue-50/70 p-4 text-left text-sm leading-6 text-tf-copy dark:bg-blue-500/5 sm:p-5">
          <p><span className="font-semibold text-tf-ink">Visiting this tutor?</span> If this continues, contact the tutor directly for class details.</p>
          <p className="mt-3"><span className="font-semibold text-tf-ink">Is this your website?</span> Open your TutorFolio dashboard, verify your email if needed, and choose an available theme to publish your website.</p>
        </div>
        <button type="button" onClick={onRetry} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
          <RefreshCw size={16} aria-hidden="true" /> Try again
        </button>
        <div><Link to="/" className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-medium text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 dark:text-blue-300">Go to TutorFolio <ArrowRight size={16} aria-hidden="true" /></Link></div>
      </section>
    </main>
  );
}

/* ─── main component ────────────────────────────────────────────────────────── */
export default function PublicTutorWebsite() {
  const { username = "", section = "", previewThemeId, previewUserId } = useParams();
  const isPreview = Boolean(previewThemeId && previewUserId);
  const navigate = useNavigate();

  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [themeId, setThemeId] = useState("");
  const [themeInfo, setThemeInfo] = useState(null);
  const visitRecordedRef = useRef(null);

  /* fetch main website data */
  const fetchWebsite = useCallback(async () => {
    setLoading(true);
    setError("");
    setWebsite(null);
    setThemeId("");
    setThemeInfo(null);
    try {
      const res = await api.get(isPreview
        ? `/themes/preview/${encodeURIComponent(previewThemeId)}?userId=${encodeURIComponent(previewUserId)}`
        : `/website/u/${encodeURIComponent(username)}`, { timeout: 20000 });
      const body = res?.data ?? {};
      if (body.status !== undefined && body.status !== 200) throw new Error(body.code || "Tutor website could not be found.");
      const payload = unwrap(body);
      const root = isPreview ? payload.website : payload;
      if (isPreview) {
        const pTid = String(payload.theme?.themeId || payload.theme?.id || previewThemeId || "").trim().toLowerCase();
        if (!THEME_MAP[pTid]) throw new Error("This theme does not have a supported preview yet.");
        setThemeId(pTid);
        setThemeInfo(payload.theme || { themeId: pTid });
      }
      const normalized = normalizeWebsite(root);
      if (!Object.keys(normalized.profile).length && (root.username || root.firstName || root.profilePicture)) normalized.profile = root;
      if (!isPreview) {
        // Public websites use only the saved, active theme confirmed by the backend.
        const selection = root?.theme;
        const theme = selection?.theme;
        const tid = String(selection?.themeId || "").trim().toLowerCase();
        if (selection?.isDefaultFallback !== false || theme?.isActive !== true || !THEME_MAP[tid]) {
          throw new Error(NOT_CONFIGURED);
        }
        setThemeId(tid);
        setThemeInfo(theme);
      }
      setWebsite({ ...normalized, raw: root });
    } catch (err) {
      setWebsite(null);
      setError(err?.response?.data?.code || err.message || "Unable to load this tutor website.");
    } finally {
      setLoading(false);
    }
  }, [username, isPreview, previewThemeId, previewUserId]);

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
      : getTutorNavigationBase(username);
    navigate(page === "home" ? (base || "/") : `${base}/${page}`);
  };
  const navigateLegacySection = (tab) => navigatePage(({ overview: "home", tuition: "classes", faqs: "about", contact: "about" })[tab] || tab);

  /* copy link */
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopyMessage("Link copied"); }
    catch { setCopyMessage(shareUrl); }
    setTimeout(() => setCopyMessage(""), 2500);
  };

  /* ── render ── */
  if (section && ![...validPages, "faqs", "contact"].includes(section)) return <ErrorScreen message="This page could not be found. Try returning to the tutor’s home page." onRetry={() => navigatePage("home")} />;
  if (loading) return <LoadingScreen />;
  if (error || !website) return <ErrorScreen message={error === NOT_CONFIGURED ? "This tutor hasn’t published a website yet. Please check back later." : undefined} onRetry={fetchWebsite} />;

  /* Render only a supported, explicitly resolved theme. */
  const activeKey = String(themeId || "").trim().toLowerCase();
  const ThemeComponent = THEME_MAP[activeKey];
  if (!ThemeComponent) return <ErrorScreen onRetry={fetchWebsite} />;
  const isFreeTheme = Array.isArray(themeInfo?.planAvailability) && themeInfo.planAvailability.some((plan) => String(plan).trim().toLowerCase() === "free");
  const needsSharedIdentity = ![ThemeClassic, ThemeMinimal, ThemeLuminary, ThemeAurora, ThemeFive, ThemeGlass].includes(ThemeComponent);

  const themeProps = {
    profile,
    tuition,
    achievements,
    batches,
    experience,
    faqs,
    gallery,
    username,
    previewBasePath: isPreview ? `/theme-preview/${encodeURIComponent(previewThemeId)}/${encodeURIComponent(previewUserId)}` : getTutorNavigationBase(username),
    currentPage,
    activeTab: ({ home: "overview", classes: "tuition" })[currentPage] || currentPage,
    onPageChange: navigatePage,
    onTabChange: navigateLegacySection,
    onContactClick: () => setChatOpen(true),
    onCopyLink: copyLink,
    copyMessage,
    sectionLoading: false,
    sectionErrors: {},
  };

  return (
    <div className="mobile-public-portfolio" onErrorCapture={(event) => recoverGalleryImage(event, gallery, api.defaults.baseURL)}>
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
      <VisitorChatWidget key={`${isPreview ? "preview" : "live"}:${tutorId}`} preview={isPreview} theme={activeKey} tutorId={tutorId} tutorName={name} open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

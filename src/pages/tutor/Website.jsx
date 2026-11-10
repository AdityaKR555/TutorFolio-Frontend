import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { getStoredUser } from "../../utils/auth";
import { THEMES } from "../../components/themes/index.js";
import {
  UserRound,
  MessageCircle,
  Trophy,
  AlertTriangle,
  Check,
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

/* ─── ThemePreviewMini – visual swatch for picker ─────────────────────────── */
function ThemePreviewMini({ theme, isSelected, onClick, disabled }) {
  const p = theme.primaryColor || "#4F46E5";
  const s = theme.secondaryColor || "#818CF8";
  const bg = theme.backgroundColor || "#F8FAFC";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative w-full overflow-hidden rounded-2xl border-2 transition-all ${
        isSelected
          ? "border-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900/60"
          : "border-tf-line hover:border-slate-400 dark:hover:border-slate-500"
      } disabled:cursor-not-allowed disabled:opacity-60`}
      aria-pressed={isSelected}
    >
      {/* mini visual preview */}
      <div
        className="relative h-32 overflow-hidden p-3"
        style={{ backgroundColor: bg }}
      >
        <div className="flex h-full gap-2">
          <div
            className="w-1/4 rounded-lg p-1.5"
            style={{ backgroundColor: p }}
          >
            <div className="mb-2 h-3 w-3 rounded-full bg-white/80" />
            <div className="mb-1.5 h-1.5 rounded bg-white/70" />
            <div className="h-1.5 w-3/4 rounded bg-white/40" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between">
              <div
                className="h-2 w-16 rounded"
                style={{ backgroundColor: p }}
              />
              <div
                className="h-4 w-10 rounded-lg"
                style={{ backgroundColor: s }}
              />
            </div>
            <div className="flex-1 rounded-lg border border-white/30 bg-white/60 p-2">
              <div
                className="mb-1.5 h-1.5 w-2/3 rounded"
                style={{ backgroundColor: p, opacity: 0.8 }}
              />
              <div className="mb-1.5 h-1 w-full rounded bg-slate-300/60" />
              <div className="h-1 w-3/4 rounded bg-slate-300/60" />
            </div>
            <div className="flex gap-1">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-5 flex-1 rounded-lg"
                  style={{
                    backgroundColor: i === 0 ? p : s,
                    opacity: i === 0 ? 1 : 0.55,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* info */}
      <div className="p-3 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-tf-ink text-sm">
            {theme.label}
          </span>
          {isSelected && (
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
              Active
            </span>
          )}
          {!isSelected && theme.isPlanAllowed === false && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
              Upgrade to unlock
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-tf-muted line-clamp-2">
          {theme.description}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          {[p, s, bg].map((c, i) => (
            <span
              key={`${c}-${i}`}
              title={c}
              className="h-4 w-4 rounded-full border border-tf-line"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </button>
  );
}

/* ─── main component ────────────────────────────────────────────────────────── */
export default function Website() {
  const userId = getUserId();
  const username = getUsername();
  const websiteUrl = username
    ? `${window.location.origin}/tutor/${encodeURIComponent(username)}`
    : "";

  const [activeThemeId, setActiveThemeId] = useState("");
  const [availableThemes, setAvailableThemes] = useState([]);
  const [userPlan, setUserPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

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
      const registry = new Map(THEMES.map((theme) => [theme.id, theme]));
      const backendThemes = (themesData?.themes || [])
        .map((theme) => {
          const visual = registry.get(theme.themeId) || THEMES[0];
          return {
            ...visual,
            ...theme,
            id: theme.themeId,
            label: theme.title || visual.label,
            primaryColor: theme.primaryColor || visual.primaryColor,
            secondaryColor: theme.secondaryColor || visual.secondaryColor,
            backgroundColor: theme.backgroundColor || visual.backgroundColor,
            description: theme.description || visual.description,
            isPlanAllowed: theme.isPlanAllowed !== false,
          };
        });
      setAvailableThemes(backendThemes);
      const selected = backendThemes.find((theme) => theme.isSelected);
      if (selected) setActiveThemeId(selected.id);
      setUserPlan(themesData?.userPlan || "free");
    } catch (err) {
      console.error("Could not load themes from API:", err.message);
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
    if (!userId || saving || themeId === activeThemeId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/themes/select", {
        userId: Number(userId),
        themeId,
      });
      checkApiResponse(res, "Unable to select theme.");
      setActiveThemeId(themeId);
      const t = THEMES.find((x) => x.id === themeId);
      setSuccess(
        `Theme "${t?.label || themeId}" applied! Your website now uses this look.`,
      );
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to apply theme. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  /* Copy link */
  const handleCopyLink = async () => {
    if (!websiteUrl) return;
    try {
      await navigator.clipboard.writeText(websiteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-full bg-tf-bg px-4 py-6 text-tf-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* ── Page header ── */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
            Your Public Website
          </p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-tf-ink sm:text-3xl">
                Website Settings
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-tf-copy">
                Customize how your public tutor portfolio looks. Changes apply
                immediately to your live website.
              </p>
            </div>

            {/* View website button */}
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {username ? (
                <>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-2 rounded-xl border border-tf-line bg-tf-surface px-4 py-2.5 text-sm font-semibold text-tf-copy transition hover:bg-tf-surface-soft"
                  >
                    {copied ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Check size={16} />
                        Copied!
                      </span>
                    ) : (
                      "Copy link"
                    )}
                  </button>
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    View your website
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </>
              ) : (
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                >
                  ⚠ Set a username first
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Website URL card ── */}
        {username && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-tf-line bg-tf-surface px-5 py-4">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-tf-muted uppercase tracking-wider">
                Your website URL
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-tf-ink">
                {websiteUrl}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              Live
            </span>
          </div>
        )}

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
        <section className="rounded-2xl border border-tf-line bg-tf-surface p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-tf-ink">Choose a Theme</h2>
              <p className="mt-1 text-sm text-tf-copy">
                Select a visual style for your public website. The change is
                saved instantly.
              </p>
            </div>
            <div className="shrink-0 rounded-xl border border-tf-line px-3 py-2 text-xs text-tf-copy">
              Plan:{" "}
              <span className="font-bold text-tf-ink">
                {formatPlan(userPlan)}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-2xl border border-tf-line bg-tf-surface"
                >
                  <div className="h-32 bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-2 p-3">
                    <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {availableThemes.map((theme) => (
                <ThemePreviewMini
                  key={theme.id}
                  theme={theme}
                  isSelected={activeThemeId === theme.id}
                  onClick={() => handleApplyTheme(theme.id)}
                  disabled={saving || !theme.isPlanAllowed}
                />
              ))}
            </div>
          )}

          {saving && (
            <p className="mt-4 text-center text-sm text-tf-muted">
              Applying theme…
            </p>
          )}
        </section>

        {/* ── Quick links ── */}
        {/* ── Quick links ── */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              label: "Add Achievements",
              desc: "Showcase student success stories.",
              href: "/achievements",
              icon: Trophy,
            },
          ].map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-start gap-3 rounded-2xl border border-tf-line bg-tf-surface p-4 transition hover:border-indigo-300 hover:shadow-sm dark:hover:border-indigo-700"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center text-tf-copy">
                <item.icon size={22} strokeWidth={1.8} />
              </span>

              <div>
                <p className="font-semibold text-tf-ink text-sm">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-tf-muted">{item.desc}</p>
              </div>
            </Link>
          ))}
        </section>

        <p className="mt-6 text-xs text-tf-muted">
          Your public website is accessible at{" "}
          {username ? (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {websiteUrl}
            </a>
          ) : (
            "— set a username to activate your website."
          )}
        </p>
      </div>
    </div>
  );
}

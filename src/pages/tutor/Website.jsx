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

/* ─── ThemePreviewMini – visual swatch for picker ─────────────────────────── */
function ThemePreviewMini({ theme, userId, userPlan, isSelected, onApply, disabled }) {
  const p = theme.primaryColor || "#4F46E5";
  const s = theme.secondaryColor || "#818CF8";
  const bg = theme.backgroundColor || "#F8FAFC";
  return (
    <article
      className={`group relative w-full overflow-hidden rounded-xl sm:rounded-2xl border-2 transition-all ${
        isSelected
          ? "border-indigo-500 ring-2 sm:ring-4 ring-indigo-100 dark:ring-indigo-900/60"
          : "border-tf-line hover:border-slate-400 dark:hover:border-slate-500"
      }`}
    >
      {/* mini visual preview */}
      <div
        className="relative h-20 sm:h-32 overflow-hidden p-2 sm:p-3"
        style={{ backgroundColor: bg }}
      >
        <div className="flex h-full gap-1.5 sm:gap-2">
          <div
            className="w-1/4 rounded sm:rounded-lg p-1 sm:p-1.5"
            style={{ backgroundColor: p }}
          >
            <div className="mb-1 sm:mb-2 h-2 sm:h-3 w-2 sm:w-3 rounded-full bg-white/80" />
            <div className="mb-1 sm:mb-1.5 h-1 sm:h-1.5 rounded bg-white/70" />
            <div className="h-1 sm:h-1.5 w-3/4 rounded bg-white/40" />
          </div>
          <div className="flex flex-1 flex-col gap-1.5 sm:gap-2">
            <div className="flex items-center justify-between">
              <div
                className="h-1.5 sm:h-2 w-10 sm:w-16 rounded"
                style={{ backgroundColor: p }}
              />
              <div
                className="h-3 sm:h-4 w-6 sm:w-10 rounded sm:rounded-lg"
                style={{ backgroundColor: s }}
              />
            </div>
            <div className="flex-1 rounded sm:rounded-lg border border-white/30 bg-white/60 p-1 sm:p-2">
              <div
                className="mb-1 sm:mb-1.5 h-1 sm:h-1.5 w-2/3 rounded"
                style={{ backgroundColor: p, opacity: 0.8 }}
              />
              <div className="mb-1 sm:mb-1.5 h-0.5 sm:h-1 w-full rounded bg-slate-300/60" />
              <div className="h-0.5 sm:h-1 w-3/4 rounded bg-slate-300/60" />
            </div>
            <div className="flex gap-1">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-3 sm:h-5 flex-1 rounded sm:rounded-lg"
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
      <div className="p-2 sm:p-3 text-center sm:text-left flex flex-col items-center sm:items-stretch">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-1 sm:gap-2 w-full">
          <span className="font-semibold text-tf-ink text-xs sm:text-sm text-center sm:text-left">
            {theme.title}
          </span>
          {isSelected && (
            <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 sm:px-2 text-[9px] sm:text-[10px] font-bold text-white shrink-0">
              Active
            </span>
          )}
          {!isSelected && theme.isPlanAllowed === false && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 sm:px-2 text-[9px] sm:text-[10px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 text-center shrink-0">
              {getPlanRequirement(theme.planAvailability, userPlan)}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[10px] sm:text-[11px] text-tf-muted line-clamp-2 text-center sm:text-left">
          {theme.description}
        </p>
        <div className="mt-1.5 sm:mt-2 flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5">
          {[p, s, bg].map((c, i) => (
            <span
              key={`${c}-${i}`}
              title={c}
              className="h-3 w-3 sm:h-4 sm:w-4 rounded-full border border-tf-line"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="mt-3 flex w-full flex-wrap gap-2">
          {theme.previewUrl ? (
            <a
              href={`${theme.previewUrl}/${encodeURIComponent(userId)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Preview ${theme.title} (opens in a new tab)`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-tf-line px-3 py-2 text-xs font-semibold text-tf-copy hover:bg-tf-surface-soft"
            >
              Preview <ExternalLink size={13} />
            </a>
          ) : (
            <span className="flex-1 px-3 py-2 text-xs text-tf-muted">Preview unavailable</span>
          )}
          <button
            type="button"
            onClick={onApply}
            disabled={disabled || isSelected}
            aria-label={isSelected ? `${theme.title} is active` : `Use ${theme.title}`}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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
      const themes = themesData?.themes || [];
      setAvailableThemes(themes);
      setActiveThemeId(
        themes.find((theme) => theme.isSelected)?.themeId ||
          themesData?.selectedThemeId || "",
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
    const targetTheme = availableThemes.find((theme) => theme.themeId === themeId);
    if (!userId || saving || emailVerified !== true || themeId === activeThemeId || !targetTheme ||
        targetTheme.isPlanAllowed === false) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/themes/select", {
        userId: Number(userId),
        themeId: targetTheme.themeId,
      });
      const selected = checkApiResponse(res, "Unable to select theme.");
      setActiveThemeId(selected?.themeId || targetTheme.themeId);
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
              {username ? (
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
                  ⚠ Set a username first
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Website URL card ── */}
        {username && (
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
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

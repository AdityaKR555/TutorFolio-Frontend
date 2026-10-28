
import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
import { getStoredUser } from "../../utils/auth";

const getUserId = () => {
  const user = getStoredUser();

  return (
    user?.userId ??
    user?.userid ??
    user?.user_id ??
    user?.id ??
    user?.user?.userId ??
    user?.user?.id ??
    null
  );
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const checkApiResponse = (response, fallback) => {
  const result = response?.data;

  // These endpoints may return application-level errors in the response body.
  if (result?.status >= 400) {
    throw new Error(result.message || fallback);
  }

  return result?.data;
};

const formatPlan = (plan) => {
  if (!plan) return "Free";
  return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
};

const ThemePreview = ({ theme }) => {
  const primary = theme.primaryColor || "#4F46E5";
  const secondary = theme.secondaryColor || "#818CF8";
  const background = theme.backgroundColor || "#F8FAFC";

  if (theme.previewImage) {
    return (
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img
          src={theme.previewImage}
          alt={`${theme.title} theme preview`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <div className="absolute inset-0 -z-0 flex items-center justify-center">
          <div
            className="h-full w-full"
            style={{ backgroundColor: background }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-44 overflow-hidden p-4"
      style={{ backgroundColor: background }}
    >
      <div className="flex h-full gap-3">
        <div
          className="w-1/4 rounded-xl p-2"
          style={{ backgroundColor: primary }}
        >
          <div className="mb-3 h-5 w-5 rounded-full bg-white/80" />
          <div className="mb-2 h-2 rounded bg-white/70" />
          <div className="mb-2 h-2 rounded bg-white/40" />
          <div className="h-2 w-3/4 rounded bg-white/40" />
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between">
            <div
              className="h-3 w-24 rounded"
              style={{ backgroundColor: primary }}
            />
            <div
              className="h-6 w-16 rounded-lg"
              style={{ backgroundColor: secondary }}
            />
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-white/90 p-3">
            <div
              className="mb-2 h-2.5 w-2/3 rounded"
              style={{ backgroundColor: primary, opacity: 0.8 }}
            />
            <div className="mb-2 h-2 w-full rounded bg-slate-200" />
            <div className="h-2 w-3/4 rounded bg-slate-200" />
          </div>

          <div className="flex gap-2">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-7 flex-1 rounded-lg"
                style={{
                  backgroundColor: item === 0 ? primary : secondary,
                  opacity: item === 0 ? 1 : 0.55,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ThemeCard = ({ theme, onSelect, selecting }) => {
  const isSelected = Boolean(theme.isSelected);
  const isAllowed = theme.isPlanAllowed !== false;
  const features = Array.isArray(theme.features) ? theme.features : [];

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white transition ${
        isSelected
          ? "border-indigo-500 ring-2 ring-indigo-100"
          : "border-slate-200 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className="relative">
        <ThemePreview theme={theme} />

        {isSelected && (
          <span className="absolute left-3 top-3 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow">
            ✓ Current theme
          </span>
        )}

        {!isAllowed && (
          <span className="absolute right-3 top-3 rounded-full bg-slate-900/90 px-3 py-1 text-xs font-semibold text-white">
            {theme.planAvailability?.map(formatPlan).join(" / ") || "Paid plan"}
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900">
              {theme.title}
            </h3>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              {theme.themeId}
            </p>
          </div>

          {theme.isDefault && (
            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Default
            </span>
          )}
        </div>

        {theme.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
            {theme.description}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2">
          {[theme.primaryColor, theme.secondaryColor, theme.backgroundColor]
            .filter(Boolean)
            .map((color, index) => (
              <div
                key={`${color}-${index}`}
                title={color}
                className="h-7 w-7 rounded-full border border-slate-200"
                style={{ backgroundColor: color }}
              />
            ))}

          {theme.fontFamily && (
            <span className="ml-1 truncate text-xs text-slate-500">
              {theme.fontFamily}
            </span>
          )}
        </div>

        {features.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Highlights
            </p>
            <ul className="space-y-2">
              {features.slice(0, 3).map((feature, index) => (
                <li
                  key={`${feature}-${index}`}
                  className="flex items-start gap-2 text-sm text-slate-600"
                >
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {theme.previewUrl && (
            <a
              href={theme.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Preview ↗
            </a>
          )}

          {isSelected ? (
            <button
              type="button"
              disabled
              className="flex-1 cursor-default rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700"
            >
              ✓ Selected
            </button>
          ) : !isAllowed ? (
            <button
              type="button"
              disabled
              title="Your current plan does not include this theme."
              className="flex-1 cursor-not-allowed rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400"
            >
              🔒 Upgrade to unlock
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelect(theme)}
              disabled={selecting}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {selecting ? "Applying..." : "Select Theme"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default function Themes() {
  const userId = getUserId();

  const [themes, setThemes] = useState([]);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [userPlan, setUserPlan] = useState("free");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectingThemeId, setSelectingThemeId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadThemes = useCallback(async () => {
    if (!userId) {
      setError("Your user ID could not be found. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [themesResponse, currentResponse] = await Promise.all([
        api.get("/themes", {
          params: { userId },
        }),
        api.get(`/themes/current/${userId}`),
      ]);

      const themesData = checkApiResponse(
        themesResponse,
        "Unable to fetch available themes."
      );

      const currentData = checkApiResponse(
        currentResponse,
        "Unable to fetch your current theme."
      );

      setThemes(themesData?.themes || []);
      setCurrentTheme(currentData || null);
      setUserPlan(themesData?.userPlan || currentData?.userPlan || "free");
    } catch (err) {
      setError(
        getErrorMessage(err, "Something went wrong while loading themes.")
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  const handleSelectTheme = async (theme) => {
    if (!userId || !theme?.themeId) return;

    setSelectingThemeId(theme.themeId);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/themes/select", {
        userId: Number(userId),
        themeId: theme.themeId,
      });

      const result = checkApiResponse(
        response,
        "Unable to select this theme."
      );

      setSuccess(result?.message || `Theme "${theme.title}" selected successfully.`);

      // Refresh selected-theme state and plan eligibility from the backend.
      await loadThemes();
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to select this theme. Please try again.")
      );
    } finally {
      setSelectingThemeId(null);
    }
  };

  const filteredThemes = themes.filter((theme) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    return (
      theme.title?.toLowerCase().includes(query) ||
      theme.themeId?.toLowerCase().includes(query) ||
      theme.description?.toLowerCase().includes(query) ||
      theme.features?.some((feature) =>
        feature.toLowerCase().includes(query)
      )
    );
  });

  const selectedTheme =
    currentTheme?.theme ||
    themes.find((theme) => theme.isSelected) ||
    null;

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <p className="text-sm font-semibold text-indigo-600">
            PERSONALIZE YOUR WEBSITE
          </p>
          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Website Themes
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Choose a design that matches your teaching style. You can
                change your selected theme whenever you want.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-600">
                Your plan:
              </span>
              <span className="text-sm font-bold text-slate-900">
                {formatPlan(userPlan)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="font-bold"
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {selectedTheme && (
          <section className="mb-7 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl text-white"
                  style={{
                    backgroundColor:
                      selectedTheme.primaryColor || "#4F46E5",
                  }}
                >
                  ✓
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    Currently selected
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {selectedTheme.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {currentTheme?.isDefaultFallback
                      ? "You're using the platform's default theme."
                      : "This is your saved website theme."}
                  </p>
                </div>
              </div>

              {currentTheme?.selectedAt && (
                <p className="text-xs text-slate-400">
                  Last selected:{" "}
                  {new Date(currentTheme.selectedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </section>
        )}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Explore themes
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading available themes..."
                : `${filteredThemes.length} ${
                    filteredThemes.length === 1 ? "theme" : "themes"
                  } available`}
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search themes..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="h-44 bg-slate-200" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-1/2 rounded bg-slate-200" />
                  <div className="h-3 w-full rounded bg-slate-100" />
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                  <div className="h-10 rounded-xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredThemes.length > 0 ? (
          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredThemes.map((theme) => (
              <ThemeCard
                key={theme.themeId}
                theme={theme}
                onSelect={handleSelectTheme}
                selecting={selectingThemeId === theme.themeId}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              ◇
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              No themes found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "Try another search term."
                : "There are no active themes available right now."}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        <p className="mt-6 text-xs leading-5 text-slate-400">
          Some themes may require a higher subscription plan. Selecting a
          theme saves your preference for your public tutor website.
        </p>
      </div>
    </div>
  );
}

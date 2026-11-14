import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ExpandableText from "../../components/ExpandableText";
import "./discover-filters.css";

const blankFilters = {
  city: "",
  district: "",
  state: "",
  subject: "",
  eligible_class: "",
  service: "",
  tag: "",
  language: "",
  gender: "",
  min_experience: "",
  max_experience: "",
  min_established_year: "",
  max_established_year: "",
  min_rating: "",
};

const fieldClass = "tf-field";
const labelClass = "tf-label";
const buttonClass = "tf-button-primary whitespace-nowrap";
const secondaryButtonClass = "tf-button-secondary whitespace-nowrap";

function getCurrentUserId() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null")?.user_id ?? null;
  } catch {
    return null;
  }
}

function getResponseRoot(response) {
  const body = response?.data ?? response ?? {};
  return body?.data ?? body?.details ?? body;
}

function getTutorName(tutor) {
  const fullName = [tutor?.firstName, tutor?.lastName].filter(Boolean).join(" ").trim();
  return fullName || tutor?.username || "Tutor";
}

function getLocation(tutor) {
  return [tutor?.city, tutor?.district, tutor?.state].filter(Boolean).join(", ");
}

function Avatar({ src, name, size = "h-14 w-14" }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "T").trim().charAt(0).toUpperCase() || "T";
  return src && !failed ? (
    <img
      src={src}
      alt={name || "Tutor"}
      onError={() => setFailed(true)}
      className={`${size} shrink-0 rounded-2xl border border-[var(--tf-line)] bg-[#eaf6ff] object-cover [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[#193852]`}
    />
  ) : (
    <div className={`${size} flex shrink-0 items-center justify-center rounded-2xl border border-[var(--tf-line)] bg-[#eaf6ff] text-lg font-bold text-[#1875d1] [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[#193852] [[data-theme=dark]_&]:text-[#4aa8ee]`}>
      {initial}
    </div>
  );
}

function InfoChip({ children }) {
  if (children === undefined || children === null || children === "") return null;
  return (
    <span className="rounded-[7px] border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-2 py-1 text-[10px] text-[var(--tf-copy)] [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[var(--tf-surface-soft)] [[data-theme=dark]_&]:text-[var(--tf-copy)]">
      {children}
    </span>
  );
}

function DetailIcon({ type }) {
  const paths = {
    location: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    money: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
    class: <path d="M3 5h18M5 5v14h14V5M8 9h8M8 13h5" />,
  };
  return (
    <svg className="h-[14px] w-[14px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

export default function DiscoverTutors() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(blankFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelRef = useRef(null);
  const filtersButtonRef = useRef(null);
  useEffect(() => {
    if (!filtersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    filtersPanelRef.current?.querySelector("button")?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") setFiltersOpen(false);
      if (event.key === "Tab" && window.matchMedia("(max-width: 760px)").matches) {
        const items = [...filtersPanelRef.current.querySelectorAll("button, input, select")].filter(el => !el.disabled);
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const onResize = () => { if (window.innerWidth > 760) setFiltersOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); filtersButtonRef.current?.focus(); };
  }, [filtersOpen]);
  const [options, setOptions] = useState({ cities: [], districts: [], states: [], genders: ["Male", "Female", "Other"] });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [tutors, setTutors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [sortBy, setSortBy] = useState("relevance");
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState("");
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const filterCount = useMemo(
    () => Object.values(filters).filter((value) => String(value).trim() !== "").length,
    [filters]
  );

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await api.get("/search/tutors/filters", { timeout: 15000 });
      const body = response?.data;
      if (body?.status !== undefined && body.status !== 200) return;
      const data = getResponseRoot(response) || {};
      setOptions((previous) => ({
        ...previous,
        cities: Array.isArray(data.cities) ? data.cities : previous.cities,
        districts: Array.isArray(data.districts) ? data.districts : previous.districts,
        states: Array.isArray(data.states) ? data.states : previous.states,
        genders: Array.isArray(data.genders) && data.genders.length ? data.genders : previous.genders,
      }));
    } catch (err) {
      // Filter options are optional; manual text filters still work if this endpoint fails.
      console.warn("Unable to load tutor filter options", err);
    }
  }, []);

  const fetchTutors = useCallback(
    async (requestedPage = 1, overrides = {}) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError("");
      const activeFilters = { ...filters, ...overrides };
      const activeQuery = overrides.__query !== undefined ? overrides.__query : query;
      const activeSort = overrides.__sortBy ?? sortBy;
      const userId = getCurrentUserId();
      const params = {
        query: String(activeQuery || "").trim() || undefined,
        city: activeFilters.city.trim() || undefined,
        district: activeFilters.district.trim() || undefined,
        state: activeFilters.state.trim() || undefined,
        subject: activeFilters.subject.trim() || undefined,
        eligible_class: activeFilters.eligible_class.trim() || undefined,
        service: activeFilters.service.trim() || undefined,
        tag: activeFilters.tag.trim() || undefined,
        language: activeFilters.language.trim() || undefined,
        gender: activeFilters.gender || undefined,
        min_experience: activeFilters.min_experience !== "" ? Number(activeFilters.min_experience) : undefined,
        max_experience: activeFilters.max_experience !== "" ? Number(activeFilters.max_experience) : undefined,
        min_established_year: activeFilters.min_established_year !== "" ? Number(activeFilters.min_established_year) : undefined,
        max_established_year: activeFilters.max_established_year !== "" ? Number(activeFilters.max_established_year) : undefined,
        min_rating: activeFilters.min_rating !== "" ? Number(activeFilters.min_rating) : undefined,
        sort_by: activeSort,
        page: requestedPage,
        limit: 12,
      };
      if (userId !== null) {
        // Backends that use either naming convention will receive the current tutor ID.
        params.caller_user_id = userId;
        params.user_id = userId;
      }

      try {
        const response = await api.get("/search/tutors", { params, timeout: 20000 });
        const body = response?.data ?? {};
        if (body.status !== undefined && body.status !== 200) {
          throw new Error(body.message || "Could not load tutors.");
        }
        if (requestId !== requestIdRef.current) return;
        const root = body?.data && !Array.isArray(body.data) ? body.data : body;
        const rows = Array.isArray(body.data)
          ? body.data
          : Array.isArray(body.details)
            ? body.details
            : Array.isArray(root?.results)
              ? root.results
              : Array.isArray(root?.tutors)
                ? root.tutors
                : [];
        const pageInfo = body.pagination || root.pagination || {};
        setTutors(rows);
        setPagination({
          page: Number(pageInfo.page ?? requestedPage),
          limit: Number(pageInfo.limit ?? 12),
          total: Number(pageInfo.total ?? rows.length),
          totalPages: Number(pageInfo.totalPages ?? (rows.length ? 1 : 0)),
        });
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setTutors([]);
        setPagination({ page: requestedPage, limit: 12, total: 0, totalPages: 0 });
        setError(err?.response?.data?.message || err.message || "Unable to load tutors. Please try again.");
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [filters, query, sortBy]
  );

  useEffect(() => {
    fetchFilterOptions();
    fetchTutors(1);
    return () => {
      requestIdRef.current += 1;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []); // Initial fetch only.

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) {
      setSuggestions([]);
      setSuggesting(false);
      return undefined;
    }
    debounceRef.current = setTimeout(async () => {
      setSuggesting(true);
      try {
        const response = await api.get("/search/tutors/suggest", {
          params: { query: cleanQuery, limit: 8 },
          timeout: 12000,
        });
        const body = response?.data ?? {};
        if (body.status !== undefined && body.status !== 200) {
          setSuggestions([]);
          return;
        }
        const rows = Array.isArray(body.data) ? body.data : Array.isArray(body.details) ? body.details : [];
        setSuggestions(rows);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggesting(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const submitSearch = async (event) => {
    event?.preventDefault();
    setShowSuggestions(false);
    setFiltersOpen(false);
    await fetchTutors(1);
  };

  const chooseSuggestion = (tutor) => {
    const selectedQuery = tutor.username || getTutorName(tutor);
    setQuery(selectedQuery);
    setShowSuggestions(false);
    fetchTutors(1, { __query: selectedQuery });
  };

  const resetFilters = () => {
    setFilters(blankFilters);
    setQuery("");
    setSortBy("relevance");
    setShowSuggestions(false);
    // Pass the cleared query, filters, and sort directly so state timing cannot send stale values.
    fetchTutors(1, { ...blankFilters, __query: "", __sortBy: "relevance" });
  };

  const openTutorDetails = async (tutor) => {
    if (!tutor?.username) return;
    setSelectedTutor(tutor);
    setDetailLoading(true);
    setDetailError("");
    try {
      const response = await api.get(`/search/tutors/${encodeURIComponent(tutor.username)}`, { timeout: 15000 });
      const body = response?.data ?? {};
      if (body.status !== undefined && body.status !== 200) throw new Error(body.message || "Unable to load tutor details.");
      const details = body.data ?? body.details ?? body;
      setSelectedTutor((current) => current?.username === tutor.username ? { ...current, ...details } : current);
    } catch (err) {
      setDetailError(err?.response?.data?.message || err.message || "Could not load the full tutor card.");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="mobile-page mobile-discovertutors min-h-full bg-[var(--tf-bg)] text-[var(--tf-ink)] [[data-theme=dark]_&]:bg-[var(--tf-bg)] [[data-theme=dark]_&]:text-[var(--tf-ink)]">
      <main className="mx-auto max-w-[1240px] px-[38px] pb-[58px] pt-9 max-[900px]:px-[22px] max-[900px]:pb-11 max-[900px]:pt-7 max-[680px]:px-[14px] max-[680px]:pb-9 max-[680px]:pt-[22px]">
        <header className="mobile-heading mb-[25px] flex items-end justify-between gap-6 max-[680px]:flex-col max-[680px]:items-start">
          <div>
            <h1 className="tf-page-title mb-2">Find the right tutor</h1>
            <p className="m-0 text-[var(--tf-copy)] [[data-theme=dark]_&]:text-[var(--tf-copy)]">
              Explore tutor profiles by location, subjects, experience and teaching preferences.
            </p>
          </div>
        </header>

        <form onSubmit={submitSearch} className="relative m-0 border-0 bg-transparent p-0 shadow-none">
          <div className="discovery-search mb-[18px] rounded-[13px] border border-[var(--tf-line)] bg-white p-[15px] shadow-[0_8px_26px_rgba(32,70,111,0.05)] [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[var(--tf-surface)]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-[10px]">
              <div className="relative flex h-12 min-w-0 items-center gap-[10px] rounded-[9px] border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-[14px] text-[var(--tf-muted)] [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[var(--tf-surface-soft)] [[data-theme=dark]_&]:text-[var(--tf-muted)]">
                <label htmlFor="tutor-search" className="sr-only">Search tutors</label>
                <svg className="h-[19px] w-[19px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5" strokeLinecap="round"/></svg>
                <input
                  id="tutor-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={() => suggestions.length && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Search by tutor, username, subject, tuition or city…"
                  autoComplete="off"
                  className="w-full min-w-0 border-0 bg-transparent text-[var(--tf-ink)] outline-none placeholder:text-[var(--tf-muted)] [[data-theme=dark]_&]:text-[var(--tf-ink)] [[data-theme=dark]_&]:placeholder:text-[var(--tf-muted)]"
                />
                {showSuggestions && (suggesting || suggestions.length > 0) && (
                  <div className="absolute inset-x-0 top-[calc(100%+8px)] z-[3] overflow-hidden rounded-[10px] border border-[var(--tf-line)] bg-white shadow-[0_12px_30px_rgba(32,70,111,0.13)] [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[var(--tf-surface)]">
                    {suggesting && <p className="m-0 px-[14px] py-3 text-[13px] text-[var(--tf-copy)] [[data-theme=dark]_&]:text-[var(--tf-copy)]">Finding suggestions…</p>}
                    {!suggesting && suggestions.map((item) => (
                      <button
                        key={item.userId ?? item.username}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => chooseSuggestion(item)}
                        className="flex w-full items-center gap-[10px] bg-white px-3 py-[10px] text-left text-[var(--tf-ink)] hover:bg-[var(--tf-surface-soft)] [[data-theme=dark]_&]:bg-[var(--tf-surface)] [[data-theme=dark]_&]:text-[var(--tf-ink)] [[data-theme=dark]_&]:hover:bg-[var(--tf-surface-soft)]"
                      >
                        <Avatar src={item.profilePicture || item.profile_picture || item.profilepicture} name={getTutorName(item)} size="h-[38px] w-[38px] rounded-[9px]" />
                        <span className="grid min-w-0 flex-1">
                          <strong className="text-sm">{getTutorName(item)}</strong>
                          <small className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--tf-muted)] [[data-theme=dark]_&]:text-[var(--tf-muted)]">@{item.username}{item.tuitionName ? ` · ${item.tuitionName}` : ""}</small>
                        </span>
                        <b className="text-[11px] text-[#1875d1] [[data-theme=dark]_&]:text-[#4aa8ee]">Select</b>
                      </button>
                    ))}
                    {!suggesting && !suggestions.length && <p className="m-0 px-[14px] py-3 text-[13px] text-[var(--tf-copy)] [[data-theme=dark]_&]:text-[var(--tf-copy)]">No suggestions found.</p>}
                  </div>
                )}
              </div>
              <button type="submit" className={`${buttonClass} min-h-[46px] px-[19px] text-sm max-[420px]:px-3 max-[420px]:text-xs`} disabled={loading}><span className="hidden min-[761px]:inline">Search tutors</span><span className="min-[761px]:hidden">Search</span></button>
            </div>
          </div>


          {filtersOpen && <button type="button" aria-label="Close filters" className="discovery-filters-backdrop" onClick={() => setFiltersOpen(false)} />}
          <div className="mobile-discovery-layout grid grid-cols-1 items-start gap-[18px] min-[901px]:grid-cols-[258px_minmax(0,1fr)] max-[900px]:grid-cols-[220px_minmax(0,1fr)] max-[900px]:gap-[13px] max-[680px]:grid-cols-1">
            <aside ref={filtersPanelRef} id="tutor-filters-panel" data-open={filtersOpen} role={filtersOpen ? "dialog" : undefined} aria-modal={filtersOpen || undefined} className="discovery-filters-panel sticky top-[18px] rounded-[13px] border border-[var(--tf-line)] bg-white p-[17px] shadow-[0_8px_26px_rgba(32,70,111,0.05)] max-[900px]:p-[14px] max-[680px]:static [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[var(--tf-surface)]" aria-label="Tutor filters">
              <div className="discovery-filters-heading mb-[14px] flex items-start justify-between gap-2">
                <div><h2 className="tf-section-title m-0">Filters</h2><p className="mt-[3px] text-[11px] text-[var(--tf-muted)] [[data-theme=dark]_&]:text-[var(--tf-muted)]">{filterCount ? `${filterCount} active` : "Refine your search"}</p></div>
                {filterCount > 0 && <button type="button" className="cursor-pointer border-0 bg-transparent py-0.5 text-[11px] text-[#1875d1] [[data-theme=dark]_&]:text-[#4aa8ee]" onClick={resetFilters}>Clear all</button>}
                <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)} className="discovery-filters-close shrink-0 items-center justify-center rounded-lg text-tf-copy hover:bg-tf-surface-soft hover:text-tf-ink">
                  <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-1 gap-[11px] max-[680px]:grid-cols-2 max-[420px]:grid-cols-1">
                <div><label className={labelClass}>City</label>{options.cities.length ? <select className={fieldClass} value={filters.city} onChange={(e) => updateFilter("city", e.target.value)}><option value="">Any city</option>{options.cities.map((v) => <option key={v} value={v}>{v}</option>)}</select> : <input className={fieldClass} value={filters.city} onChange={(e) => updateFilter("city", e.target.value)} placeholder="Enter city" />}</div>
                <div><label className={labelClass}>District</label>{options.districts.length ? <select className={fieldClass} value={filters.district} onChange={(e) => updateFilter("district", e.target.value)}><option value="">Any district</option>{options.districts.map((v) => <option key={v} value={v}>{v}</option>)}</select> : <input className={fieldClass} value={filters.district} onChange={(e) => updateFilter("district", e.target.value)} placeholder="Enter district" />}</div>
                <div><label className={labelClass}>State</label>{options.states.length ? <select className={fieldClass} value={filters.state} onChange={(e) => updateFilter("state", e.target.value)}><option value="">Any state</option>{options.states.map((v) => <option key={v} value={v}>{v}</option>)}</select> : <input className={fieldClass} value={filters.state} onChange={(e) => updateFilter("state", e.target.value)} placeholder="Enter state" />}</div>
                <div><label className={labelClass}>Gender</label><select className={fieldClass} value={filters.gender} onChange={(e) => updateFilter("gender", e.target.value)}><option value="">Any gender</option>{options.genders.map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
                <div><label className={labelClass}>Teaching subject</label><input className={fieldClass} value={filters.subject} onChange={(e) => updateFilter("subject", e.target.value)} placeholder="e.g. Mathematics" /></div>
                <div><label className={labelClass}>Eligible classes</label><input className={fieldClass} value={filters.eligible_class} onChange={(e) => updateFilter("eligible_class", e.target.value)} placeholder="e.g. Class 8" /></div>
                <div><label className={labelClass}>Service</label><input className={fieldClass} value={filters.service} onChange={(e) => updateFilter("service", e.target.value)} placeholder="e.g. Online tuition" /></div>
                <div><label className={labelClass}>Language</label><input className={fieldClass} value={filters.language} onChange={(e) => updateFilter("language", e.target.value)} placeholder="e.g. Hindi" /></div>
                <div><label className={labelClass}>Tag</label><input className={fieldClass} value={filters.tag} onChange={(e) => updateFilter("tag", e.target.value)} placeholder="e.g. CBSE" /></div>
                <div><label className={labelClass}>Minimum experience (years)</label><input type="number" min="0" className={fieldClass} value={filters.min_experience} onChange={(e) => updateFilter("min_experience", e.target.value)} placeholder="Any" /></div>
                <div><label className={labelClass}>Maximum experience (years)</label><input type="number" min="0" className={fieldClass} value={filters.max_experience} onChange={(e) => updateFilter("max_experience", e.target.value)} placeholder="Any" /></div>
                <div><label className={labelClass}>Minimum rating</label><select className={fieldClass} value={filters.min_rating} onChange={(e) => updateFilter("min_rating", e.target.value)}><option value="">Any rating</option><option value="3">3+ stars</option><option value="4">4+ stars</option><option value="4.5">4.5+ stars</option></select></div>
                <div><label className={labelClass}>Established from</label><input type="number" min="1900" max={new Date().getFullYear()} className={fieldClass} value={filters.min_established_year} onChange={(e) => updateFilter("min_established_year", e.target.value)} placeholder="Year" /></div>
                <div><label className={labelClass}>Established until</label><input type="number" min="1900" max={new Date().getFullYear()} className={fieldClass} value={filters.max_established_year} onChange={(e) => updateFilter("max_established_year", e.target.value)} placeholder="Year" /></div>
              </div>
              <div className="discovery-filters-actions mt-3 flex gap-2">
                <button type="button" className={`${secondaryButtonClass} flex-1`} onClick={resetFilters}>Clear</button>
                <button type="submit" className={`${buttonClass} flex-1`}>Apply</button>
              </div>
            </aside>

            <section className="min-w-0" aria-label="Tutor search results">
              <div className="discovery-results-toolbar my-[1px] mb-[14px] flex items-center justify-between gap-4 max-[680px]:mt-1 max-[680px]:items-start max-[420px]:flex-col">
                <p className="m-0 text-[13px] text-[var(--tf-copy)] [[data-theme=dark]_&]:text-[var(--tf-copy)]">{loading ? "Searching tutors…" : <><strong>{pagination.total}</strong> {pagination.total === 1 ? "tutor found" : "tutors found"}</>}</p>
                <div className="discovery-results-controls flex items-center gap-[9px] max-[680px]:flex-wrap max-[680px]:justify-end max-[420px]:self-end">
                  <button ref={filtersButtonRef} type="button" aria-expanded={filtersOpen} aria-controls="tutor-filters-panel" onClick={() => setFiltersOpen(true)} className="discovery-filters-trigger rounded-xl border border-tf-line bg-tf-surface px-4 py-2.5 text-sm font-semibold text-tf-blue"><svg className="discovery-filter-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/><circle cx="8" cy="6" r="2" fill="var(--tf-sky)"/><circle cx="16" cy="12" r="2" fill="var(--tf-sky)"/><circle cx="8" cy="18" r="2" fill="var(--tf-sky)"/></svg>Filters{filterCount ? ` (${filterCount})` : ""}</button>
                  <label className="flex items-center gap-[9px] text-xs text-[var(--tf-muted)] [[data-theme=dark]_&]:text-[var(--tf-muted)]"><span className="discovery-sort-label">Sort:</span>
                    <select aria-label="Sort tutors" className="h-[39px] min-w-[130px] rounded-lg border border-[var(--tf-line)] bg-white px-[10px] text-xs text-[var(--tf-ink)] outline-none focus:border-[#1875d1] focus:ring-[3px] focus:ring-blue-500/10 [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[var(--tf-surface)] [[data-theme=dark]_&]:text-[var(--tf-ink)]" value={sortBy} onChange={(e) => { const value = e.target.value; setSortBy(value); fetchTutors(1, { __sortBy: value }); }}>
                      <option value="newest">Newest profiles</option><option value="relevance">Relevance</option><option value="name">Name</option><option value="experience">Experience</option><option value="rating">Rating</option>
                    </select>
                  </label>
                  <div className="flex gap-0.5 rounded-[9px] border border-[var(--tf-line)] bg-white p-[3px] [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[var(--tf-surface)]" role="group" aria-label="Result layout">
                    <button type="button" className={`grid h-[31px] w-[33px] place-items-center rounded-md ${viewMode === "grid" ? "bg-[#eaf6ff] text-[#0c5fb7] [[data-theme=dark]_&]:bg-[#193852] [[data-theme=dark]_&]:text-[#8bcdf7]" : "text-[var(--tf-muted)] [[data-theme=dark]_&]:text-[var(--tf-muted)]"}`} onClick={() => setViewMode("grid")} aria-pressed={viewMode === "grid"} aria-label="Grid view" title="Grid view"><svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 2h7v7H2zM11 2h7v7h-7zM2 11h7v7H2zM11 11h7v7h-7z" /></svg></button>
                    <button type="button" className={`grid h-[31px] w-[33px] place-items-center rounded-md ${viewMode === "list" ? "bg-[#eaf6ff] text-[#0c5fb7] [[data-theme=dark]_&]:bg-[#193852] [[data-theme=dark]_&]:text-[#8bcdf7]" : "text-[var(--tf-muted)] [[data-theme=dark]_&]:text-[var(--tf-muted)]"}`} onClick={() => setViewMode("list")} aria-pressed={viewMode === "list"} aria-label="List view" title="List view"><svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3h2v2H2zM6 3h12v2H6zM2 9h2v2H2zM6 9h12v2H6zM2 15h2v2H2zM6 15h12v2H6z" /></svg></button>
                  </div>
                </div>
              </div>

        {error && <div role="alert" className="mb-[14px] flex items-center justify-between gap-3 rounded-[9px] border border-[var(--tf-line)] bg-[#fff2f3] px-[14px] py-3 text-[13px] text-[#b93849] [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[#45232d] [[data-theme=dark]_&]:text-[#ff9aa4]"><span>{error}</span><button className="cursor-pointer border-0 bg-transparent font-semibold text-[#b93849] underline [[data-theme=dark]_&]:text-[#ff9aa4]" type="button" onClick={() => fetchTutors(pagination.page || 1)}>Try again</button></div>}

        {loading ? (
          <div className={`grid grid-cols-1 ${viewMode === "grid" ? "gap-[15px] min-[901px]:grid-cols-2" : "gap-2"}`}>{[1, 2, 3, 4, 5, 6].map((key) => <div key={key} className={`${viewMode === "list" ? "min-h-[82px]" : "min-h-[250px]"} animate-pulse rounded-[13px] border border-[var(--tf-line)] bg-gradient-to-r from-white via-[var(--tf-surface-soft)] to-white [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:from-[var(--tf-surface)] [[data-theme=dark]_&]:via-[var(--tf-surface-soft)] [[data-theme=dark]_&]:to-[var(--tf-surface)]`} />)}</div>
        ) : tutors.length ? (
          <div className={`grid grid-cols-1 ${viewMode === "list" ? "gap-2" : "gap-[15px] min-[901px]:grid-cols-2"}`}>
            {tutors.map((tutor, index) => {
              const name = getTutorName(tutor);
              const location = getLocation(tutor);
              const subjects = tutor.teachingSubjects || tutor.subjects;
              return (
                <article key={tutor.userId ?? tutor.username ?? index} data-view={viewMode} className={`discovery-tutor-card min-w-0 rounded-[13px] border border-[var(--tf-line)] bg-white p-4 shadow-[0_2px_9px_rgba(29,64,101,0.025)] [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[var(--tf-surface)] ${viewMode === "list" ? "grid min-h-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 min-[1101px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] max-[520px]:grid-cols-1" : "flex min-h-[250px] flex-col"}`}>
                  <div className={`flex min-w-0 items-start gap-[13px] ${viewMode === "list" ? "col-start-1 row-start-1" : ""}`}>
                    <Avatar src={tutor.profilePicture || tutor.profile_picture || tutor.profilepicture} name={name} size={viewMode === "list" ? "h-12 w-12 rounded-[14px]" : "h-[58px] w-[58px] rounded-[14px]"} />
                    <div className="grid min-w-0"><h2 className={`my-[2px] mb-1 break-words text-base leading-[1.3] ${viewMode === "list" ? "text-sm" : ""}`}>{name}</h2><span className="overflow-hidden text-xs text-[var(--tf-muted)] text-ellipsis [[data-theme=dark]_&]:text-[var(--tf-muted)]">@{tutor.username || "username unavailable"}</span>{location && <span className="mt-[6px] flex items-center gap-[5px] text-[11px] text-[var(--tf-copy)] [[data-theme=dark]_&]:text-[var(--tf-copy)]"><DetailIcon type="location" />{location}</span>}{tutor.averageRating != null && <span className="mt-[6px] text-[11px] text-[#93621a] [[data-theme=dark]_&]:text-[#f3c567]">★ {Number(tutor.averageRating).toFixed(1)} <small className="ml-1 text-[var(--tf-muted)] [[data-theme=dark]_&]:text-[var(--tf-muted)]">({Number(tutor.totalReviews || 0)} reviews)</small></span>}</div>
                  </div>
                  {viewMode === "list" ? (
                    <div className="col-span-full row-start-2 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] leading-relaxed text-[var(--tf-muted)] min-[1101px]:col-start-2 min-[1101px]:col-span-1 min-[1101px]:row-start-1 [[data-theme=dark]_&]:text-[var(--tf-muted)]">
                      {subjects && <p className="m-0 min-w-0 break-words"><strong className="text-[var(--tf-copy)] [[data-theme=dark]_&]:text-[var(--tf-copy)]">Subjects:</strong> {subjects}</p>}
                      {tutor.tuitionName && <p className="m-0 font-semibold text-[#0c5fb7] [[data-theme=dark]_&]:text-[#8bcdf7]">{tutor.tuitionName}</p>}
                      {tutor.qualification && <p className="m-0">{tutor.qualification}</p>}
                      {tutor.teachingYOE !== null && tutor.teachingYOE !== undefined && <p className="m-0">{tutor.teachingYOE} yrs experience</p>}
                      {tutor.establishedYear && <p className="m-0">Established {tutor.establishedYear}</p>}
                      {tutor.about && <ExpandableText lines={2} containerClassName="basis-full" className="m-0 whitespace-pre-line">{tutor.about}</ExpandableText>}
                    </div>
                  ) : (
                    <>
                      {tutor.tuitionName && <p className="mb-[5px] mt-[15px] text-xs font-semibold text-[#0c5fb7] [[data-theme=dark]_&]:text-[#8bcdf7]">{tutor.tuitionName}</p>}
                      {tutor.about && <ExpandableText lines={2} className="mb-3 text-xs leading-[1.55] text-[var(--tf-copy)] [[data-theme=dark]_&]:text-[var(--tf-copy)]">{tutor.about}</ExpandableText>}
                      <div className="mb-[11px] flex flex-wrap gap-[6px]"><InfoChip>{tutor.qualification}</InfoChip><InfoChip>{tutor.teachingYOE !== null && tutor.teachingYOE !== undefined ? `${tutor.teachingYOE} yrs experience` : ""}</InfoChip>{tutor.establishedYear && <InfoChip>Established {tutor.establishedYear}</InfoChip>}</div>
                      {subjects && <p className="mb-[15px] overflow-hidden text-ellipsis whitespace-nowrap text-[11px] leading-[1.5] text-[var(--tf-muted)] [[data-theme=dark]_&]:text-[var(--tf-muted)]"><strong className="text-[var(--tf-copy)] [[data-theme=dark]_&]:text-[var(--tf-copy)]">Subjects:</strong> {subjects}</p>}
                    </>
                  )}
                  <div className={`grid grid-cols-2 gap-[9px] ${viewMode === "list" ? "col-start-2 row-start-1 mt-0 self-center min-[1101px]:col-start-3 min-[1101px]:row-start-1 max-[520px]:col-start-1 max-[520px]:row-start-3 max-[520px]:w-full" : "mt-auto"}`}><button type="button" onClick={() => openTutorDetails(tutor)} className={secondaryButtonClass}>Quick view</button><button type="button" onClick={() => tutor.username && navigate(`/tutor/${encodeURIComponent(tutor.username)}`)} disabled={!tutor.username} className={buttonClass}>Portfolio <span aria-hidden="true">↗</span></button></div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="col-span-full rounded-xl border border-dashed border-[var(--tf-line)] bg-white p-[38px] text-center text-[var(--tf-copy)] shadow-[0_8px_26px_rgba(32,70,111,0.05)] [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[var(--tf-surface)] [[data-theme=dark]_&]:text-[var(--tf-copy)]"><span className="mb-[9px] block text-[30px] text-[#1875d1] [[data-theme=dark]_&]:text-[#4aa8ee]" aria-hidden="true">⌕</span><strong className="mb-[5px] block text-[15px] text-[var(--tf-ink)] [[data-theme=dark]_&]:text-[var(--tf-ink)]">No tutors found</strong><p className="mb-4">Try a broader search or remove some filters to see more tutor profiles.</p><button type="button" onClick={resetFilters} className={buttonClass}>Clear search and filters</button></div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="mt-[22px] flex items-center justify-between gap-3 rounded-[10px] border border-[var(--tf-line)] bg-white px-3 py-[10px] shadow-[0_8px_26px_rgba(32,70,111,0.05)] max-[420px]:gap-2 max-[420px]:px-2 [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[var(--tf-surface)]">
            <p className="m-0 whitespace-nowrap text-xs text-[var(--tf-muted)] [[data-theme=dark]_&]:text-[var(--tf-muted)]">Page <strong className="text-[var(--tf-ink)] [[data-theme=dark]_&]:text-[var(--tf-ink)]">{pagination.page}</strong> of <strong className="text-[var(--tf-ink)] [[data-theme=dark]_&]:text-[var(--tf-ink)]">{pagination.totalPages}</strong></p>
            <div className="flex shrink-0 gap-[7px] max-[420px]:gap-1 max-[420px]:text-xs"><button className="min-h-[34px] rounded-lg border border-[var(--tf-line)] bg-white px-[11px] text-[var(--tf-copy)] disabled:cursor-not-allowed disabled:opacity-45 [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[var(--tf-surface)] [[data-theme=dark]_&]:text-[var(--tf-copy)]" type="button" disabled={pagination.page <= 1} onClick={() => fetchTutors(pagination.page - 1)}>← Previous</button><button className="min-h-[34px] rounded-lg border border-[var(--tf-line)] bg-white px-[11px] text-[var(--tf-copy)] disabled:cursor-not-allowed disabled:opacity-45 [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[var(--tf-surface)] [[data-theme=dark]_&]:text-[var(--tf-copy)]" type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchTutors(pagination.page + 1)}>Next →</button></div>
          </div>
        )}
            </section>
          </div>
        </form>
      </main>

      {selectedTutor && (
        <div className="tf-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[var(--tf-surface)]/50 p-[18px] backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedTutor(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="tutor-quick-view-title" className="tf-modal-panel tf-modal-padded max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl border border-[var(--tf-line)] bg-white p-[23px] text-[var(--tf-ink)] shadow-[0_18px_50px_rgba(17,44,75,0.22)] [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[var(--tf-surface)] [[data-theme=dark]_&]:text-[var(--tf-ink)] max-[420px]:p-[18px]">
            <header className="mb-[18px] flex items-start justify-between gap-3">
              <div><p className="mb-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#1875d1]">Tutor preview</p><h2 className="m-0 text-[21px]" id="tutor-quick-view-title">{getTutorName(selectedTutor)}</h2></div>
              <button type="button" onClick={() => setSelectedTutor(null)} className="h-[34px] w-[34px] rounded-lg border-0 bg-transparent text-[25px] leading-none text-[var(--tf-muted)] hover:bg-[var(--tf-surface-soft)] hover:text-[var(--tf-ink)] [[data-theme=dark]_&]:text-[var(--tf-muted)] [[data-theme=dark]_&]:hover:bg-[var(--tf-surface-soft)] [[data-theme=dark]_&]:hover:text-[var(--tf-ink)]" aria-label="Close preview">×</button>
            </header>
            {detailLoading ? <p className="py-[30px] text-center text-[13px] text-[var(--tf-copy)] [[data-theme=dark]_&]:text-[var(--tf-copy)]">Loading tutor profile…</p> : (
              <>
                <div className="flex items-center gap-[14px] rounded-xl border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] p-[14px] [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[var(--tf-surface-soft)]">
                  <Avatar src={selectedTutor.profilePicture || selectedTutor.profile_picture || selectedTutor.profilepicture} name={getTutorName(selectedTutor)} size="h-[60px] w-[60px] rounded-[13px]" />
                  <div className="grid min-w-0 gap-1"><p className="m-0 text-xs text-[var(--tf-muted)] [[data-theme=dark]_&]:text-[var(--tf-muted)]">@{selectedTutor.username || "username unavailable"}</p><span className="flex items-center gap-[5px] text-xs text-[var(--tf-copy)] [[data-theme=dark]_&]:text-[var(--tf-copy)]"><DetailIcon type="location" />{getLocation(selectedTutor) || "Location not provided"}</span>{selectedTutor.tuitionName && <strong className="text-xs text-[#0c5fb7] [[data-theme=dark]_&]:text-[#8bcdf7]">{selectedTutor.tuitionName}</strong>}</div>
                </div>
                <div className="mt-[14px] grid grid-cols-2 gap-[9px]">
                  {[["Qualification", selectedTutor.qualification], ["Experience", selectedTutor.teachingYOE != null ? `${selectedTutor.teachingYOE} years` : "Not provided"], ["Rating", selectedTutor.averageRating != null ? `★ ${Number(selectedTutor.averageRating).toFixed(1)}` : "Not rated"], ["Reviews", selectedTutor.totalReviews ?? "No reviews yet"], ["Languages", selectedTutor.languages]].map(([label, value]) => <div key={label} className="grid gap-1 rounded-[10px] border border-[var(--tf-line)] bg-white p-[11px] [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[var(--tf-surface)]"><span className="text-[11px] text-[var(--tf-copy)] [[data-theme=dark]_&]:text-[var(--tf-copy)]">{label}</span><strong className="break-words text-[13px] text-[var(--tf-ink)] [[data-theme=dark]_&]:text-[var(--tf-ink)]">{value || "Not provided"}</strong></div>)}
                </div>
                {selectedTutor.about && <section className="mt-4"><h3 className="mb-[5px] mt-0 text-[13px]">About</h3><ExpandableText lines={5} className="m-0 text-[13px] leading-[1.6] text-[var(--tf-copy)] [[data-theme=dark]_&]:text-[var(--tf-copy)]" preserveWhitespace>{selectedTutor.about}</ExpandableText></section>}
                {selectedTutor.teachingSubjects && <section className="mt-4"><h3 className="mb-[5px] mt-0 text-[13px]">Teaching subjects</h3><ExpandableText lines={3} className="m-0 text-[13px] leading-[1.6] text-[var(--tf-copy)] [[data-theme=dark]_&]:text-[var(--tf-copy)]" preserveWhitespace>{selectedTutor.teachingSubjects}</ExpandableText></section>}
              </>
            )}
            {detailError && <p role="alert" className="mt-[14px] rounded-[9px] border border-[var(--tf-line)] bg-[#fff2f3] px-3 py-[10px] text-xs text-[#b93849] [[data-theme=dark]_&]:border-[var(--tf-line)] [[data-theme=dark]_&]:bg-[#45232d] [[data-theme=dark]_&]:text-[#ff9aa4]">{detailError}</p>}
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setSelectedTutor(null)} className={secondaryButtonClass}>Close</button><button type="button" disabled={!selectedTutor.username} onClick={() => navigate(`/tutor/${encodeURIComponent(selectedTutor.username)}`)} className={buttonClass}>View portfolio ↗</button></div>
          </section>
        </div>
      )}
    </div>
  );
}

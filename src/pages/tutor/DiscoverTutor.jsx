import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

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

const fieldClass =
  "w-full rounded-xl border border-blue-500/15 bg-[#0a1628] px-3.5 py-3 text-sm text-white outline-none placeholder:text-[#617391] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10";
const labelClass = "mb-1.5 block text-xs font-medium text-[#94a8c7]";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

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
      className={`${size} shrink-0 rounded-2xl border border-blue-500/15 bg-[#0a1628] object-cover`}
    />
  ) : (
    <div className={`${size} flex shrink-0 items-center justify-center rounded-2xl border border-blue-500/15 bg-blue-500/10 text-lg font-bold text-blue-300`}>
      {initial}
    </div>
  );
}

function InfoChip({ children }) {
  if (children === undefined || children === null || children === "") return null;
  return (
    <span className="rounded-lg border border-blue-500/10 bg-[#0a1628] px-2.5 py-1 text-xs text-[#a8bbd7]">
      {children}
    </span>
  );
}

export default function DiscoverTutors() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(blankFilters);
  const [options, setOptions] = useState({ cities: [], districts: [], states: [], genders: ["Male", "Female", "Other"] });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
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

  const resultsText = pagination.total === 1 ? "1 tutor found" : `${pagination.total} tutors found`;

  return (
    <div className="min-h-full bg-[#0a1628] p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-blue-400">Discover</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Find the right tutor</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94a8c7]">
              Explore tutor profiles by location, subjects, experience and teaching preferences.
            </p>
          </div>
          <div className="rounded-xl border border-blue-500/10 bg-[#0f1f36] px-4 py-3 text-sm text-[#94a8c7]">
            <span className="font-semibold text-white">{resultsText}</span>
            <span className="mx-2 text-[#425878]">·</span>
            Sorted by <span className="text-blue-300">{sortBy}</span>
          </div>
        </div>

        <form onSubmit={submitSearch} className="relative rounded-2xl border border-blue-500/15 bg-[#0f1f36] p-3 shadow-lg shadow-black/10 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="tutor-search" className="sr-only">Search tutors</label>
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#617391]">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
              </div>
              <input
                id="tutor-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => suggestions.length && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search by tutor, username, subject, tuition or city…"
                autoComplete="off"
                className={`${fieldClass} pl-11 pr-4 py-3.5`}
              />
              {showSuggestions && (suggesting || suggestions.length > 0) && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-blue-500/20 bg-[#101f35] shadow-2xl">
                  {suggesting && <p className="px-4 py-3 text-sm text-[#94a8c7]">Finding suggestions…</p>}
                  {!suggesting && suggestions.map((item) => (
                    <button
                      key={item.userId ?? item.username}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseSuggestion(item)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-500/10"
                    >
                      <Avatar src={item.profilePicture} name={getTutorName(item)} size="h-9 w-9" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">{getTutorName(item)}</span>
                        <span className="block truncate text-xs text-[#8197b8]">@{item.username}{item.tuitionName ? ` · ${item.tuitionName}` : ""}</span>
                      </span>
                      <span className="text-xs text-blue-300">Select</span>
                    </button>
                  ))}
                  {!suggesting && !suggestions.length && <p className="px-4 py-3 text-sm text-[#94a8c7]">No suggestions found.</p>}
                </div>
              )}
            </div>
            <button type="submit" className={`${buttonClass} min-h-[46px] px-6`} disabled={loading}>Search tutors</button>
            <button type="button" onClick={() => setShowFilters((value) => !value)} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-blue-500/20 px-4 text-sm font-medium text-[#c7d8f5] transition hover:bg-blue-500/10">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16M7 12h10m-7 7h4"/></svg>
              Filters{filterCount > 0 ? ` (${filterCount})` : ""}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 border-t border-blue-500/10 pt-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><h2 className="font-semibold text-white">Refine your search</h2><p className="mt-1 text-xs text-[#8197b8]">Combine filters to narrow down tutors.</p></div>
                <button type="button" onClick={resetFilters} className="text-xs font-semibold text-blue-300 hover:text-blue-200">Clear all</button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <div><label className={labelClass}>Sort results</label><select className={fieldClass} value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="relevance">Relevance</option><option value="name">Name A–Z</option><option value="experience">Experience</option><option value="rating">Highest rating</option><option value="newest">Newest profiles</option></select></div>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="rounded-xl border border-blue-500/20 px-5 py-2.5 text-sm font-semibold text-[#c7d8f5] hover:bg-blue-500/10" onClick={resetFilters}>Reset</button>
                <button type="submit" className={buttonClass}>Apply filters</button>
              </div>
            </div>
          )}
        </form>

        <div className="mb-4 mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#8197b8]">{loading ? "Searching tutors…" : resultsText}</p>
          <div className="flex items-center gap-2 text-sm"><label htmlFor="sort-results" className="text-[#8197b8]">Sort:</label><select id="sort-results" className="rounded-lg border border-blue-500/15 bg-[#0f1f36] px-3 py-2 text-[#d6e4f7] outline-none" value={sortBy} onChange={(e) => { const value = e.target.value; setSortBy(value); fetchTutors(1, { __sortBy: value }); }}><option value="relevance">Relevance</option><option value="name">Name A–Z</option><option value="experience">Experience</option><option value="rating">Highest rating</option><option value="newest">Newest profiles</option></select></div>
        </div>

        {error && <div role="alert" className="mb-5 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button type="button" onClick={() => fetchTutors(pagination.page || 1)} className="self-start font-semibold underline underline-offset-4">Try again</button></div>}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((key) => <div key={key} className="h-56 animate-pulse rounded-2xl border border-blue-500/10 bg-[#0f1f36]" />)}</div>
        ) : tutors.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tutors.map((tutor, index) => {
              const name = getTutorName(tutor);
              const location = getLocation(tutor);
              const subjects = tutor.teachingSubjects || tutor.subjects;
              return (
                <article key={tutor.userId ?? tutor.username ?? index} className="flex min-w-0 flex-col rounded-2xl border border-blue-500/10 bg-[#0f1f36] p-5 transition hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-xl hover:shadow-black/10">
                  <div className="flex items-start gap-3">
                    <Avatar src={tutor.profilePicture} name={name} />
                    <div className="min-w-0 flex-1"><h2 className="truncate font-semibold text-white">{name}</h2><p className="mt-1 truncate text-xs text-[#8197b8]">@{tutor.username || "username unavailable"}</p>{location && <p className="mt-2 flex items-center gap-1.5 text-xs text-[#a8bbd7]"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span className="truncate">{location}</span></p>}</div>
                  </div>
                  {tutor.tuitionName && <p className="mt-4 line-clamp-1 text-sm font-medium text-blue-200">{tutor.tuitionName}</p>}
                  {tutor.about && <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#94a8c7]">{tutor.about}</p>}
                  <div className="mt-4 flex flex-wrap gap-2"><InfoChip>{tutor.qualification}</InfoChip><InfoChip>{tutor.teachingYOE !== null && tutor.teachingYOE !== undefined ? `${tutor.teachingYOE} yrs experience` : ""}</InfoChip><InfoChip>{tutor.averageRating !== null && tutor.averageRating !== undefined ? `★ ${Number(tutor.averageRating).toFixed(1)}` : ""}</InfoChip></div>
                  {subjects && <p className="mt-4 line-clamp-2 text-xs leading-5 text-[#8197b8]"><span className="font-semibold text-[#a8bbd7]">Subjects: </span>{subjects}</p>}
                  <div className="mt-auto flex gap-2 pt-5"><button type="button" onClick={() => openTutorDetails(tutor)} className="flex-1 rounded-xl border border-blue-500/20 px-3 py-2.5 text-sm font-semibold text-[#d6e4f7] transition hover:bg-blue-500/10">Quick view</button><button type="button" onClick={() => tutor.username && navigate(`/tutor/${encodeURIComponent(tutor.username)}`)} disabled={!tutor.username} className={`${buttonClass} flex-1 px-3 py-2.5`}>Portfolio <span aria-hidden="true">↗</span></button></div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-blue-500/20 bg-[#0f1f36]/60 px-5 py-16 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg></div><h2 className="text-lg font-semibold text-white">No tutors found</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8197b8]">Try a broader search or remove some filters to see more tutor profiles.</p><button type="button" onClick={resetFilters} className={`${buttonClass} mt-5`}>Clear search and filters</button></div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="mt-7 flex flex-col gap-3 rounded-xl border border-blue-500/10 bg-[#0f1f36] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#8197b8]">Page <span className="font-semibold text-white">{pagination.page}</span> of <span className="font-semibold text-white">{pagination.totalPages}</span></p>
            <div className="flex gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => fetchTutors(pagination.page - 1)} className="rounded-lg border border-blue-500/20 px-4 py-2 text-sm text-[#c7d8f5] hover:bg-blue-500/10 disabled:opacity-40">← Previous</button><button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchTutors(pagination.page + 1)} className="rounded-lg border border-blue-500/20 px-4 py-2 text-sm text-[#c7d8f5] hover:bg-blue-500/10 disabled:opacity-40">Next →</button></div>
          </div>
        )}
      </div>

      {selectedTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedTutor(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="tutor-quick-view-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-blue-500/20 bg-[#0f1f36] p-5 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4"><div><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-400">Tutor preview</p><h2 id="tutor-quick-view-title" className="text-xl font-bold text-white">{getTutorName(selectedTutor)}</h2></div><button type="button" onClick={() => setSelectedTutor(null)} className="rounded-lg p-2 text-[#94a8c7] hover:bg-blue-500/10 hover:text-white" aria-label="Close preview">✕</button></div>
            {detailLoading ? <div className="py-12 text-center text-sm text-[#94a8c7]">Loading tutor profile…</div> : <><div className="flex items-center gap-4"><Avatar src={selectedTutor.profilePicture} name={getTutorName(selectedTutor)} size="h-16 w-16"/><div className="min-w-0"><p className="text-sm text-[#94a8c7]">@{selectedTutor.username}</p><p className="mt-1 text-sm text-[#c7d8f5]">{getLocation(selectedTutor) || "Location not provided"}</p>{selectedTutor.tuitionName && <p className="mt-1 text-sm text-blue-200">{selectedTutor.tuitionName}</p>}</div></div><div className="mt-5 grid grid-cols-2 gap-3">{[["Qualification", selectedTutor.qualification], ["Experience", selectedTutor.teachingYOE != null ? `${selectedTutor.teachingYOE} years` : "Not provided"], ["Rating", selectedTutor.averageRating != null ? `★ ${Number(selectedTutor.averageRating).toFixed(1)}` : "Not rated"], ["Reviews", selectedTutor.totalReviews ?? "—"]].map(([label, value]) => <div key={label} className="rounded-xl border border-blue-500/10 bg-[#0a1628] p-3"><p className="text-xs text-[#8197b8]">{label}</p><p className="mt-1 text-sm font-semibold text-white">{value || "Not provided"}</p></div>)}</div>{selectedTutor.about && <div className="mt-5"><h3 className="mb-2 text-sm font-semibold text-white">About</h3><p className="whitespace-pre-line text-sm leading-6 text-[#a8bbd7]">{selectedTutor.about}</p></div>}{selectedTutor.teachingSubjects && <div className="mt-4"><h3 className="mb-2 text-sm font-semibold text-white">Teaching subjects</h3><p className="text-sm text-[#a8bbd7]">{selectedTutor.teachingSubjects}</p></div>}</>}
            {detailError && <p role="alert" className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-200">{detailError}</p>}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setSelectedTutor(null)} className="rounded-xl border border-blue-500/20 px-4 py-2.5 text-sm font-semibold text-[#c7d8f5] hover:bg-blue-500/10">Close</button><button type="button" disabled={!selectedTutor.username} onClick={() => navigate(`/tutor/${encodeURIComponent(selectedTutor.username)}`)} className={buttonClass}>Open public website ↗</button></div>
          </section>
        </div>
      )}
    </div>
  );
}

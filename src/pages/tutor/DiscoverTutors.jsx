import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "./DiscoverTutors.css";

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

const fieldClass = "discover-input";
const labelClass = "discover-label";
const buttonClass = "discover-button discover-button--primary";

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
    <span className="discover-chip">
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

export default function DiscoverTutors() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(blankFilters);
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
    <div className="discover-page">
      <main className="discover-content">
        <header className="discover-heading">
          <div>
            <h1>Find the right tutor</h1>
            <p>
              Explore tutor profiles by location, subjects, experience and teaching preferences.
            </p>
          </div>
        </header>

        <form onSubmit={submitSearch} className="discover-form">
          <div className="discover-search-panel">
            <div className="discover-search-row">
              <div className="discover-searchbox">
                <label htmlFor="tutor-search" className="sr-only">Search tutors</label>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5" strokeLinecap="round"/></svg>
                <input
                  id="tutor-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={() => suggestions.length && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Search by tutor, username, subject, tuition or city…"
                  autoComplete="off"
                />
                {showSuggestions && (suggesting || suggestions.length > 0) && (
                  <div className="discover-suggestions">
                    {suggesting && <p>Finding suggestions…</p>}
                    {!suggesting && suggestions.map((item) => (
                      <button
                        key={item.userId ?? item.username}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => chooseSuggestion(item)}
                        className="discover-suggestion"
                      >
                        <Avatar src={item.profilePicture} name={getTutorName(item)} size="discover-suggestion-avatar" />
                        <span>
                          <strong>{getTutorName(item)}</strong>
                          <small>@{item.username}{item.tuitionName ? ` · ${item.tuitionName}` : ""}</small>
                        </span>
                        <b>Select</b>
                      </button>
                    ))}
                    {!suggesting && !suggestions.length && <p>No suggestions found.</p>}
                  </div>
                )}
              </div>
              <button type="submit" className={`${buttonClass} discover-search-button`} disabled={loading}>Search tutors</button>
            </div>
          </div>

          <div className="discover-layout">
            <aside className="discover-filter-panel" aria-label="Tutor filters">
              <div className="discover-filter-head">
                <div><h2>Filters</h2><p>{filterCount ? `${filterCount} active` : "Refine your search"}</p></div>
                {filterCount > 0 && <button type="button" onClick={resetFilters}>Clear all</button>}
              </div>
              <div className="discover-filter-grid">
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
              <div className="discover-filter-actions">
                <button type="button" className="discover-button" onClick={resetFilters}>Clear</button>
                <button type="submit" className={buttonClass}>Apply</button>
              </div>
            </aside>

            <section className="discover-results" aria-label="Tutor search results">
              <div className="discover-resultsbar">
                <p className="discover-count">{loading ? "Searching tutors…" : <><strong>{pagination.total}</strong> {pagination.total === 1 ? "tutor found" : "tutors found"}</>}</p>
                <div className="discover-result-controls">
                  <label className="discover-sort">Sort:
                    <select value={sortBy} onChange={(e) => { const value = e.target.value; setSortBy(value); fetchTutors(1, { __sortBy: value }); }}>
                      <option value="newest">Newest profiles</option><option value="relevance">Relevance</option><option value="name">Name</option><option value="experience">Experience</option><option value="rating">Rating</option>
                    </select>
                  </label>
                  <div className="discover-view-toggle" role="group" aria-label="Result layout">
                    <button type="button" className={viewMode === "grid" ? "is-active" : ""} onClick={() => setViewMode("grid")} aria-label="Grid view" title="Grid view"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 2h7v7H2zM11 2h7v7h-7zM2 11h7v7H2zM11 11h7v7h-7z" /></svg></button>
                    <button type="button" className={viewMode === "list" ? "is-active" : ""} onClick={() => setViewMode("list")} aria-label="List view" title="List view"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 3h2v2H2zM6 3h12v2H6zM2 9h2v2H2zM6 9h12v2H6zM2 15h2v2H2zM6 15h12v2H6z" /></svg></button>
                  </div>
                </div>
              </div>

        {error && <div role="alert" className="discover-error"><span>{error}</span><button type="button" onClick={() => fetchTutors(pagination.page || 1)}>Try again</button></div>}

        {loading ? (
          <div className={`discover-cards ${viewMode === "list" ? "is-list" : ""}`}>{[1, 2, 3, 4, 5, 6].map((key) => <div key={key} className="discover-skeleton" />)}</div>
        ) : tutors.length ? (
          <div className={`discover-cards ${viewMode === "list" ? "is-list" : ""}`}>
            {tutors.map((tutor, index) => {
              const name = getTutorName(tutor);
              const location = getLocation(tutor);
              const subjects = tutor.teachingSubjects || tutor.subjects;
              return (
                <article key={tutor.userId ?? tutor.username ?? index} className="discover-tutor-card">
                  <div className="discover-identity">
                    <Avatar src={tutor.profilePicture} name={name} size="discover-avatar" />
                    <div className="discover-who"><h2>{name}</h2><span className="discover-handle">@{tutor.username || "username unavailable"}</span>{location && <span className="discover-location"><DetailIcon type="location" />{location}</span>}{tutor.averageRating != null && <span className="discover-rating">★ {Number(tutor.averageRating).toFixed(1)} <small>({Number(tutor.totalReviews || 0)} reviews)</small></span>}</div>
                  </div>
                  {tutor.tuitionName && <p className="discover-tuition">{tutor.tuitionName}</p>}
                  {tutor.about && <p className="discover-about">{tutor.about}</p>}
                  <div className="discover-meta-pills"><InfoChip>{tutor.qualification}</InfoChip><InfoChip>{tutor.teachingYOE !== null && tutor.teachingYOE !== undefined ? `${tutor.teachingYOE} yrs experience` : ""}</InfoChip>{tutor.establishedYear && <InfoChip>Established {tutor.establishedYear}</InfoChip>}</div>
                  {subjects && <p className="discover-subjects"><strong>Subjects:</strong> {subjects}</p>}
                  <div className="discover-actions"><button type="button" onClick={() => openTutorDetails(tutor)} className="discover-button">Quick view</button><button type="button" onClick={() => tutor.username && navigate(`/tutor/${encodeURIComponent(tutor.username)}`)} disabled={!tutor.username} className="discover-button discover-button--primary">Portfolio <span aria-hidden="true">↗</span></button></div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="discover-empty"><span aria-hidden="true">⌕</span><strong>No tutors found</strong><p>Try a broader search or remove some filters to see more tutor profiles.</p><button type="button" onClick={resetFilters} className={buttonClass}>Clear search and filters</button></div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="discover-pagination">
            <p>Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong></p>
            <div><button type="button" disabled={pagination.page <= 1} onClick={() => fetchTutors(pagination.page - 1)}>← Previous</button><button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchTutors(pagination.page + 1)}>Next →</button></div>
          </div>
        )}
            </section>
          </div>
        </form>
      </main>

      {selectedTutor && (
        <div className="discover-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedTutor(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="tutor-quick-view-title" className="discover-modal">
            <header className="discover-modal-head">
              <div><p className="discover-modal-eyebrow">Tutor preview</p><h2 id="tutor-quick-view-title">{getTutorName(selectedTutor)}</h2></div>
              <button type="button" onClick={() => setSelectedTutor(null)} className="discover-modal-close" aria-label="Close preview">×</button>
            </header>
            {detailLoading ? <p className="discover-modal-loading">Loading tutor profile…</p> : (
              <>
                <div className="discover-modal-identity">
                  <Avatar src={selectedTutor.profilePicture} name={getTutorName(selectedTutor)} size="discover-modal-avatar" />
                  <div><p>@{selectedTutor.username || "username unavailable"}</p><span><DetailIcon type="location" />{getLocation(selectedTutor) || "Location not provided"}</span>{selectedTutor.tuitionName && <strong>{selectedTutor.tuitionName}</strong>}</div>
                </div>
                <div className="discover-modal-facts">
                  {[["Qualification", selectedTutor.qualification], ["Experience", selectedTutor.teachingYOE != null ? `${selectedTutor.teachingYOE} years` : "Not provided"], ["Rating", selectedTutor.averageRating != null ? `★ ${Number(selectedTutor.averageRating).toFixed(1)}` : "Not rated"], ["Reviews", selectedTutor.totalReviews ?? "—"], ["Languages", selectedTutor.languages]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || "Not provided"}</strong></div>)}
                </div>
                {selectedTutor.about && <section className="discover-modal-section"><h3>About</h3><p>{selectedTutor.about}</p></section>}
                {selectedTutor.teachingSubjects && <section className="discover-modal-section"><h3>Teaching subjects</h3><p>{selectedTutor.teachingSubjects}</p></section>}
              </>
            )}
            {detailError && <p role="alert" className="discover-modal-error">{detailError}</p>}
            <div className="discover-modal-actions"><button type="button" onClick={() => setSelectedTutor(null)} className="discover-button">Close</button><button type="button" disabled={!selectedTutor.username} onClick={() => navigate(`/tutor/${encodeURIComponent(selectedTutor.username)}`)} className="discover-button discover-button--primary">View portfolio ↗</button></div>
          </section>
        </div>
      )}
    </div>
  );
}

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  createIssueReport,
  DEFAULT_ISSUE_TYPES,
  getIssueTypes,
  getUserIssueReports,
} from "../../api/issueReports";
import { getStoredUser } from "../../utils/auth";
import ExpandableText from "../../components/ExpandableText";

const MAX_TITLE_LENGTH = 200;
const MAX_DESC_LENGTH = 10000;
const MAX_URL_LENGTH = 2048;

function ReportBug() {
  const user = getStoredUser();
  const userId = user?.userId ?? user?.user_id ?? user?.id ?? null;

  const [activeTab, setActiveTab] = useState("submit"); // "submit" | "history"

  // Form State
  const [issueTypes, setIssueTypes] = useState(DEFAULT_ISSUE_TYPES);
  const [issueType, setIssueType] = useState(DEFAULT_ISSUE_TYPES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pageUrl, setPageUrl] = useState(() => {
    try {
      return window.location.href || "";
    } catch {
      return "";
    }
  });

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // History state
  const [reports, setReports] = useState([]);
  const [totalReports, setTotalReports] = useState(null);
  const [historyError, setHistoryError] = useState("");
  const [localCount, setLocalCount] = useState(0);
  const historyRequest = useRef(0);

  // Load issue types on mount
  useEffect(() => {
    let mounted = true;
    getIssueTypes().then((types) => {
      if (mounted && Array.isArray(types) && types.length > 0) {
        setIssueTypes(types);
        setIssueType((current) => types.includes(current) ? current : types[0]);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Load user issue reports
  const fetchReports = useCallback(async () => {
    const request = ++historyRequest.current;
    if (!userId) return;
    try {
      const res = await getUserIssueReports(userId);
      if (request !== historyRequest.current) return;
      setHistoryError("");
      setLocalCount(res.localCount || 0);
      setReports(res?.issueReports || []);
      setTotalReports(res?.total ?? (res?.issueReports?.length || 0));
    } catch (err) {
      if (request === historyRequest.current) setHistoryError(err.message || "Unable to load your reports. Please try again.");
    } finally {
      if (request === historyRequest.current) setLoadingHistory(false);
    }
  }, [userId]);

  const refreshReports = () => {
    setLoadingHistory(true);
    setHistoryError("");
    fetchReports();
  };

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => { if (mounted) fetchReports(); });
    return () => {
      mounted = false;
      historyRequest.current += 1;
    };
  }, [fetchReports]);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!userId) {
      setError("Please log in to submit an issue report.");
      return;
    }

    const cleanTitle = title.trim();
    const cleanDesc = description.trim();
    const cleanType = issueType.trim();
    const cleanUrl = pageUrl.trim();

    if (!cleanType) {
      setError("Please select an issue type.");
      return;
    }

    if (!cleanTitle) {
      setError("Please provide a concise title for the issue.");
      return;
    }

    if (cleanTitle.length > MAX_TITLE_LENGTH) {
      setError(`Title must be ${MAX_TITLE_LENGTH} characters or less.`);
      return;
    }

    if (!cleanDesc) {
      setError("Please describe the issue or bug in detail.");
      return;
    }

    if (cleanDesc.length > MAX_DESC_LENGTH) {
      setError(`Description exceeds maximum length (${MAX_DESC_LENGTH} characters).`);
      return;
    }

    if (cleanUrl.length > MAX_URL_LENGTH) {
      setError(`Page URL must be under ${MAX_URL_LENGTH} characters.`);
      return;
    }

    try {
      setSubmitting(true);

      const created = await createIssueReport({
        userId,
        issueType: cleanType,
        title: cleanTitle,
        description: cleanDesc,
        pageUrl: cleanUrl || null,
      });

      setSuccess(
        `Thank you! Your issue report has been submitted successfully (Reference: ${
          created.issueReportId || "TICKET-SAVED"
        }). Our team will review it.`
     );

      // Reset form
      setTitle("");
      setDescription("");

      // Update history list
      refreshReports();
    } catch (err) {
      setError(
        err.message || "Something went wrong while submitting your report. Please try again."
     );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Just now";
    try {
      return new Date(dateStr).toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("resolve") || s.includes("close") || s.includes("fix")) {
      return "bg-[#eaf8f1] text-[#147d5a] border border-emerald-700/25 [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#183d37] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#69d4a8]";
    }
    if (s.includes("progress") || s.includes("investigat") || s.includes("review")) {
      return "bg-[#eaf6ff] text-[#1875d1] border border-blue-600/25 [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#193852] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#4aa8ee]";
    }
    return "bg-[#fff7e9] text-[#93621a] border border-amber-800/25 [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#3e3426] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#f3c567]";
  };

  return (
    <div className="mobile-page mobile-reportbug min-h-full bg-[var(--tf-bg)] px-5 pt-[30px] pb-[60px] text-[var(--tf-ink)] transition-colors duration-200 sm:px-8 sm:pt-9 sm:pb-[72px] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-bg)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]">
      <div className="mx-auto max-w-[1080px]">
        {/* ================= HEADING ================= */}
        <header className="mobile-heading mb-6 flex items-start justify-between gap-[18px]">
          <div>
            <h1 className="tf-page-title mb-2">Report a Bug or Issue</h1>
            <p className="text-[13px] text-[var(--tf-copy)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-copy)]">
              Found a bug, styling issue, or unexpected behavior? Let us know and we'll fix it promptly.
            </p>
          </div>
        </header>

        {/* ================= TABS ================= */}
        <div className="mb-6 inline-flex items-center rounded-[14px] border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] p-1 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-surface-soft)]">
          <button
            type="button"
            onClick={() => setActiveTab("submit")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-[10px] border-0 px-[18px] py-2 text-[13px] font-semibold transition-all ${
              activeTab === "submit"
                ? "bg-[#1875d1] text-white shadow-[0_4px_12px_rgba(24,117,209,0.25)]"
                : "bg-transparent text-[var(--tf-copy)] hover:text-[var(--tf-ink)] [&:where([data-theme=dark],[data-theme=dark])]:text-[var(--tf-copy)] [&:where([data-theme=dark],[data-theme=dark])]:hover:text-[var(--tf-ink)]"
            }`}
          >
            <span>Submit a Report</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              refreshReports();
            }}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-[10px] border-0 px-[18px] py-2 text-[13px] font-semibold transition-all ${
              activeTab === "history"
                ? "bg-[#1875d1] text-white shadow-[0_4px_12px_rgba(24,117,209,0.25)]"
                : "bg-transparent text-[var(--tf-copy)] hover:text-[var(--tf-ink)] [&:where([data-theme=dark],[data-theme=dark])]:text-[var(--tf-copy)] [&:where([data-theme=dark],[data-theme=dark])]:hover:text-[var(--tf-ink)]"
            }`}
          >
            <span>My Reports</span>
            <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${activeTab === "history" ? "bg-white/25 text-white" : "bg-black/10 text-inherit"}`}>{loadingHistory ? "…" : totalReports ?? "—"}</span>
          </button>
        </div>

        {/* ================= NOTICES ================= */}
        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-700/25 bg-[#fff2f3] px-4 py-3 text-[13px] text-[#b93849] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#45232d] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#ff9aa4]" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="cursor-pointer border-0 bg-transparent text-lg leading-none opacity-70 hover:opacity-100"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
       )}

        {success && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-700/25 bg-[#eaf8f1] px-4 py-3 text-[13px] text-[#147d5a] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#183d37] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#69d4a8]" role="status">
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="cursor-pointer border-0 bg-transparent text-lg leading-none opacity-70 hover:opacity-100"
              aria-label="Dismiss message"
            >
              &times;
            </button>
          </div>
       )}

        {/* ================= TAB 1: SUBMIT REPORT ================= */}
        {activeTab === "submit" && (
          <>
            {/* Quick Tips */}
            <div className="mb-6 rounded-2xl border border-[var(--tf-line)] bg-[#eaf6ff] px-5 py-[18px] text-[var(--tf-ink)] [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#193852] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]">
              <div className="mb-2 flex items-center gap-2 text-[13px] font-bold text-[#1875d1] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#4aa8ee]">
                <span aria-hidden="true">💡</span>
                <span>Tips for faster resolution:</span>
              </div>
              <ul className="m-0 list-disc pl-5 text-xs leading-[1.6] text-[var(--tf-copy)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-copy)]">
                <li>Specify what you were doing right before the issue occurred.</li>
                <li>Include any error message shown on the screen.</li>
                <li>Verify the page URL where the problem happened.</li>
              </ul>
            </div>

            <section className="mb-6 rounded-[20px] border border-[var(--tf-line)] bg-white px-6 py-[26px] shadow-[var(--tf-shadow)] sm:px-[30px] sm:py-8 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-surface)]">
              <h2 className="tf-section-title mb-1.5">Describe the issue</h2>
              <p className="mb-6 text-[13px] text-[var(--tf-copy)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-copy)]">
                Fill in the details below. Our engineering team reviews all submitted tickets.
              </p>

              <form onSubmit={handleSubmit}>
                {/* Issue Type */}
                <div className="mb-5">
                  <label className="mb-2 flex items-center justify-between text-[13px] font-semibold text-[var(--tf-ink)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]" htmlFor="issueType">
                    <span>Issue Type <span className="text-red-500">*</span></span>
                  </label>
                  <select
                    id="issueType"
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full rounded-xl border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-3.5 py-[11px] text-[13px] text-[var(--tf-ink)] outline-none transition focus:border-[#1875d1] focus:ring-[3px] focus:ring-blue-500/15 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-surface-soft)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]"
                    required
                  >
                    {issueTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                   ))}
                  </select>
                </div>

                {/* Title */}
                <div className="mb-5">
                  <label className="mb-2 flex items-center justify-between text-[13px] font-semibold text-[var(--tf-ink)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]" htmlFor="title">
                    <span>Title / Short Summary <span className="text-red-500">*</span></span>
                    <span className="text-[11px] font-medium text-[var(--tf-muted)]">
                      {title.length}/{MAX_TITLE_LENGTH}
                    </span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={MAX_TITLE_LENGTH}
                    placeholder="e.g. Cannot upload image in Batch creation"
                    className="w-full rounded-xl border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-3.5 py-[11px] text-[13px] text-[var(--tf-ink)] outline-none transition focus:border-[#1875d1] focus:ring-[3px] focus:ring-blue-500/15 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-surface-soft)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]"
                    required
                  />
                </div>

                {/* Description */}
                <div className="mb-5">
                  <label className="mb-2 flex items-center justify-between text-[13px] font-semibold text-[var(--tf-ink)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]" htmlFor="description">
                    <span>Detailed Description <span className="text-red-500">*</span></span>
                    <span className="text-[11px] font-medium text-[var(--tf-muted)]">
                      {description.length}/{MAX_DESC_LENGTH}
                    </span>
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={MAX_DESC_LENGTH}
                    placeholder="What happened? What did you expect to happen instead? Please include any relevant steps to reproduce."
                    className="min-h-[140px] w-full resize-y rounded-xl border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-3.5 py-[11px] text-[13px] leading-[1.55] text-[var(--tf-ink)] outline-none transition focus:border-[#1875d1] focus:ring-[3px] focus:ring-blue-500/15 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-surface-soft)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]"
                    required
                  />
                  <p className="mt-1.5 text-xs text-[var(--tf-muted)]">
                    Markdown formatting is supported. Feel free to paste error text or URLs.
                  </p>
                </div>

                {/* Page URL */}
                <div className="mb-5">
                  <label className="mb-2 flex items-center justify-between text-[13px] font-semibold text-[var(--tf-ink)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]" htmlFor="pageUrl">
                    <span>Affected Page URL</span>
                    <span className="text-[11px] font-medium text-[var(--tf-muted)]">Optional</span>
                  </label>
                  <input
                    id="pageUrl"
                    type="url"
                    value={pageUrl}
                    onChange={(e) => setPageUrl(e.target.value)}
                    maxLength={MAX_URL_LENGTH}
                    placeholder="https://alpha.tutorfolio.site/batches"
                    className="w-full rounded-xl border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-3.5 py-[11px] text-[13px] text-[var(--tf-ink)] outline-none transition focus:border-[#1875d1] focus:ring-[3px] focus:ring-blue-500/15 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-surface-soft)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]"
                  />
                  <p className="mt-1.5 text-xs text-[var(--tf-muted)]">
                    Auto-detected from your current location. You can update this to the exact page where the bug occurred.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !title.trim() || !description.trim()}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1875d1] px-6 py-3 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(24,117,209,0.25)] transition-colors hover:bg-[#0c5fb7] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting Report...</span>
                      </>
                   ) : (
                      <>
                        <span>Submit Issue Report</span>
                        <span aria-hidden="true">&rarr;</span>
                      </>
                   )}
                  </button>
                </div>
              </form>
            </section>
          </>
       )}

        {/* ================= TAB 2: MY REPORTS ================= */}
        {activeTab === "history" && (
          <section className="mb-6 rounded-[20px] border border-[var(--tf-line)] bg-white px-6 py-[26px] shadow-[var(--tf-shadow)] sm:px-[30px] sm:py-8 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-surface)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="tf-section-title mb-1.5">Submitted Issue Reports</h2>
                <p className="mb-0 text-[13px] text-[var(--tf-copy)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-copy)]">
                  Track the status of bugs and feedback you've previously reported.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshReports}
                disabled={loadingHistory}
                className="cursor-pointer rounded-xl border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-3.5 py-1.5 text-xs font-semibold text-[var(--tf-ink)] transition-all [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-surface-soft)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]"
              >
                {loadingHistory ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>

            {historyError && <p role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{historyError} Use Refresh to try again.</p>}
            {localCount > 0 && <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{localCount} older report(s) were saved only in this browser and were never submitted to support. Copy their details into Submit a Report to send them.</p>}
            {loadingHistory ? (
              <div className="py-12 text-center text-sm text-[var(--tf-muted)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-muted)]">
                Loading your reports...
              </div>
           ) : historyError && reports.length === 0 ? null : reports.length === 0 ? (
              <div className="px-5 py-12 text-center text-[var(--tf-muted)]">
                <div className="mb-3 text-4xl">🎉</div>
                <h3 className="mb-1.5 text-base font-bold text-[var(--tf-ink)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]">No issues reported yet</h3>
                <p className="mx-auto max-w-[400px] text-[13px] text-[var(--tf-copy)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-copy)]">
                  You haven't submitted any bug reports yet. If you ever run into any problem, let us know!
                </p>
              </div>
           ) : (
              <div>
                {reports.map((item, idx) => {
                  const id = item.issueReportId ?? item.id ?? idx;
                  const status = item.isLocal ? "Not submitted (saved locally)" : item.status || "Pending";

                  return (
                    <article key={id} className="mb-4 rounded-2xl border border-[var(--tf-line)] bg-white p-5 shadow-[var(--tf-shadow)] transition-colors hover:border-[#1875d1] [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-surface)]">
                      <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <h3 className="text-[15px] font-bold text-[var(--tf-ink)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]">{item.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--tf-muted)]">
                            <span className="inline-block rounded-md border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--tf-copy)] [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-surface-soft)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-copy)]">
                              {item.issueType || "Bug"}
                            </span>
                            <span>Submitted {formatDate(item.createdAt)}</span>
                            {id && (
                              <span className="font-mono text-[11px] opacity-75">
                                #{id}
                              </span>
                           )}
                          </div>
                        </div>

                        <div>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-bold uppercase tracking-[0.5px] ${getStatusClass(status)}`}>
                            {status}
                          </span>
                        </div>
                      </div>

                      <ExpandableText lines={4} className="mb-2.5 text-[13px] leading-[1.6] text-[var(--tf-copy)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-copy)]" preserveWhitespace>{item.description}</ExpandableText>

                      {item.pageUrl && (
                        <div>
                          <a
                            href={item.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex break-all text-xs text-[#1875d1] no-underline hover:underline"
                          >
                            <span aria-hidden="true">🔗</span>
                            <span>{item.pageUrl}</span>
                          </a>
                        </div>
                     )}
                    </article>
                 );
                })}
              </div>
           )}
          </section>
       )}
      </div>
    </div>
 );
}

export default ReportBug;

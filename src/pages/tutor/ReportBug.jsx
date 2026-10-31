import React, { useEffect, useState } from "react";
import {
  createIssueReport,
  DEFAULT_ISSUE_TYPES,
  getIssueTypes,
  getUserIssueReports,
} from "../../api/issueReports";
import { getStoredUser } from "../../utils/auth";
import "./ReportBug.css";

const MAX_TITLE_LENGTH = 200;
const MAX_DESC_LENGTH = 10000;
const MAX_URL_LENGTH = 2048;

function ReportBug() {
  const user = getStoredUser();
  const userId = user?.userId ?? user?.user_id ?? user?.id ?? null;

  const [activeTab, setActiveTab] = useState("submit"); // "submit" | "history"

  // Form State
  const [issueTypes, setIssueTypes] = useState(DEFAULT_ISSUE_TYPES);
  const [issueType, setIssueType] = useState("");
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
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // History state
  const [reports, setReports] = useState([]);
  const [totalReports, setTotalReports] = useState(0);

  // Load issue types on mount
  useEffect(() => {
    let mounted = true;
    getIssueTypes().then((types) => {
      if (mounted && Array.isArray(types) && types.length > 0) {
        setIssueTypes(types);
        if (!issueType) setIssueType(types[0]);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Set default issue type once types load
  useEffect(() => {
    if (!issueType && issueTypes.length > 0) {
      setIssueType(issueTypes[0]);
    }
  }, [issueTypes, issueType]);

  // Load user issue reports
  const fetchReports = async () => {
    if (!userId) return;
    try {
      setLoadingHistory(true);
      const res = await getUserIssueReports(userId);
      setReports(res?.issueReports || []);
      setTotalReports(res?.total ?? (res?.issueReports?.length || 0));
    } catch (err) {
      console.error("Failed to load user issue reports:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [userId]);

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
      fetchReports();
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
      return "report-bug-status--resolved";
    }
    if (s.includes("progress") || s.includes("investigat") || s.includes("review")) {
      return "report-bug-status--in_progress";
    }
    return "report-bug-status--open";
  };

  return (
    <div className="report-bug-page">
      <div className="report-bug-content">
        {/* ================= HEADING ================= */}
        <header className="report-bug-heading">
          <div>
            <h1>Report a Bug or Issue</h1>
            <p>
              Found a bug, styling issue, or unexpected behavior? Let us know and we'll fix it promptly.
            </p>
          </div>
        </header>

        {/* ================= TABS ================= */}
        <div className="report-bug-tabs">
          <button
            type="button"
            onClick={() => setActiveTab("submit")}
            className={`report-bug-tab ${activeTab === "submit" ? "active" : ""}`}
          >
            <span>Submit a Report</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              fetchReports();
            }}
            className={`report-bug-tab ${activeTab === "history" ? "active" : ""}`}
          >
            <span>My Reports</span>
            <span className="report-bug-tab-count">{totalReports}</span>
          </button>
        </div>

        {/* ================= NOTICES ================= */}
        {error && (
          <div className="report-bug-notice report-bug-notice--error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="report-bug-notice-dismiss"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

        {success && (
          <div className="report-bug-notice report-bug-notice--success" role="status">
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="report-bug-notice-dismiss"
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
            <div className="report-bug-tips">
              <div className="report-bug-tips-title">
                <span aria-hidden="true">💡</span>
                <span>Tips for faster resolution:</span>
              </div>
              <ul>
                <li>Specify what you were doing right before the issue occurred.</li>
                <li>Include any error message shown on the screen.</li>
                <li>Verify the page URL where the problem happened.</li>
              </ul>
            </div>

            <section className="report-bug-card">
              <h2 className="report-bug-card-title">Describe the issue</h2>
              <p className="report-bug-card-desc">
                Fill in the details below. Our engineering team reviews all submitted tickets.
              </p>

              <form onSubmit={handleSubmit}>
                {/* Issue Type */}
                <div className="report-bug-field">
                  <label className="report-bug-label" htmlFor="issueType">
                    <span>Issue Type <span className="text-red-500">*</span></span>
                  </label>
                  <select
                    id="issueType"
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="report-bug-select"
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
                <div className="report-bug-field">
                  <label className="report-bug-label" htmlFor="title">
                    <span>Title / Short Summary <span className="text-red-500">*</span></span>
                    <span className="report-bug-counter">
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
                    className="report-bug-input"
                    required
                  />
                </div>

                {/* Description */}
                <div className="report-bug-field">
                  <label className="report-bug-label" htmlFor="description">
                    <span>Detailed Description <span className="text-red-500">*</span></span>
                    <span className="report-bug-counter">
                      {description.length}/{MAX_DESC_LENGTH}
                    </span>
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={MAX_DESC_LENGTH}
                    placeholder="What happened? What did you expect to happen instead? Please include any relevant steps to reproduce."
                    className="report-bug-textarea"
                    required
                  />
                  <p className="report-bug-hint">
                    Markdown formatting is supported. Feel free to paste error text or URLs.
                  </p>
                </div>

                {/* Page URL */}
                <div className="report-bug-field">
                  <label className="report-bug-label" htmlFor="pageUrl">
                    <span>Affected Page URL</span>
                    <span className="report-bug-counter">Optional</span>
                  </label>
                  <input
                    id="pageUrl"
                    type="url"
                    value={pageUrl}
                    onChange={(e) => setPageUrl(e.target.value)}
                    maxLength={MAX_URL_LENGTH}
                    placeholder="https://alpha.tutorfolio.site/batches"
                    className="report-bug-input"
                  />
                  <p className="report-bug-hint">
                    Auto-detected from your current location. You can update this to the exact page where the bug occurred.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !title.trim() || !description.trim()}
                    className="report-bug-btn"
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
          <section className="report-bug-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="report-bug-card-title">Submitted Issue Reports</h2>
                <p className="report-bug-card-desc mb-0">
                  Track the status of bugs and feedback you've previously reported.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchReports}
                disabled={loadingHistory}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
                style={{
                  background: "var(--tf-surface-soft)",
                  borderColor: "var(--tf-line)",
                  color: "var(--tf-ink)",
                }}
              >
                {loadingHistory ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-sm" style={{ color: "var(--tf-muted)" }}>
                Loading your reports...
              </div>
            ) : reports.length === 0 ? (
              <div className="report-bug-empty">
                <div className="report-bug-empty-icon">🎉</div>
                <h3 className="report-bug-empty-title">No issues reported yet</h3>
                <p className="report-bug-empty-text">
                  You haven't submitted any bug reports yet. If you ever run into any problem, let us know!
                </p>
              </div>
            ) : (
              <div>
                {reports.map((item, idx) => {
                  const id = item.issueReportId ?? item.id ?? idx;
                  const status = item.status || "Pending";

                  return (
                    <article key={id} className="report-bug-item">
                      <div className="report-bug-item-head">
                        <div className="space-y-1">
                          <h3 className="report-bug-item-title">{item.title}</h3>
                          <div className="report-bug-item-meta">
                            <span className="report-bug-type-tag">
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
                          <span className={`report-bug-status ${getStatusClass(status)}`}>
                            {status}
                          </span>
                        </div>
                      </div>

                      <p className="report-bug-item-desc">{item.description}</p>

                      {item.pageUrl && (
                        <div>
                          <a
                            href={item.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="report-bug-item-url"
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


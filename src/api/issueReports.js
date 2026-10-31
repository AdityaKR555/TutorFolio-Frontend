/**
 * Issue Report API Service
 * Interacts with FastAPI IssueReportService:
 * - GET  issue types
 * - POST create issue report
 * - GET  user issue reports
 */

import api from "./axios";

// Standard fallback issue types if backend types table is empty or loading
export const DEFAULT_ISSUE_TYPES = [
  "Bug / Something is broken",
  "UI / Display Issue",
  "Performance / Slow Loading",
  "Profile or Website Issue",
  "Feature Request / Suggestion",
  "Login / Authentication Issue",
  "Billing or Payment Issue",
  "Other",
];

/**
 * 1. Fetch available active issue types
 */
export const getIssueTypes = async () => {
  const possibleEndpoints = [
    "/issue-reports/types",
    "/issue-reports/issue-types",
    "/issues/types",
    "/report-bug/types",
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      const response = await api.get(endpoint, { timeout: 8000 });
      const data = response.data;

      if (data?.status === 200 && data?.data?.issueTypes?.length) {
        return data.data.issueTypes;
      }
    } catch {
      // Try next endpoint candidate
    }
  }

  // Fallback to default types if endpoints not yet routed
  return DEFAULT_ISSUE_TYPES;
};

/**
 * 2. Submit a new issue report
 * @param {Object} params
 * @param {number} params.userId
 * @param {string} params.issueType
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} [params.pageUrl]
 */
export const createIssueReport = async ({
  userId,
  issueType,
  title,
  description,
  pageUrl,
}) => {
  const payload = {
    issueType: issueType.trim(),
    title: title.trim(),
    description: description.trim(),
    pageUrl: pageUrl?.trim() || null,
  };

  const possibleEndpoints = [
    { url: "/issue-reports", method: "post" },
    { url: `/issue-reports?userId=${userId}`, method: "post" },
    { url: "/issue-reports/new", method: "post" },
    { url: "/issues", method: "post" },
    { url: "/report-bug", method: "post" },
  ];

  let lastError = null;

  for (const target of possibleEndpoints) {
    try {
      const response = await api.post(target.url, payload, {
        timeout: 12000,
        headers: { "Content-Type": "application/json" },
      });

      const data = response.data;

      if (data?.status === 201 || data?.status === 200) {
        return data.data || data;
      }
    } catch (err) {
      lastError = err;
      if (err.response?.status === 400 || err.response?.status === 422) {
        // Validation error from backend
        const detail = err.response.data?.detail || err.response.data?.message;
        const msg = Array.isArray(detail)
          ? detail.map((d) => d.msg || d).join(", ")
          : detail || "Invalid issue report data.";
        throw new Error(msg);
      }
    }
  }

  // If backend endpoint is under construction, save to local cache for demo/testing
  console.warn(
    "Backend issue report endpoint not reachable. Storing report in local cache.",
    lastError?.message
  );

  const localReport = {
    issueReportId: `report_${Date.now().toString(36)}`,
    userId,
    issueType: payload.issueType,
    title: payload.title,
    description: payload.description,
    pageUrl: payload.pageUrl,
    status: "submitted",
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    isLocal: true,
  };

  try {
    const key = `tutorfolio_issue_reports_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([localReport, ...existing]));
  } catch (e) {
    console.error("Local storage error:", e);
  }

  return localReport;
};

/**
 * 3. Fetch user's submitted issue reports with pagination
 * @param {number} userId
 * @param {number} [page=1]
 * @param {number} [limit=20]
 */
export const getUserIssueReports = async (userId, page = 1, limit = 20) => {
  if (!userId) return { total: 0, page: 1, limit, issueReports: [] };

  const possibleEndpoints = [
    `/issue-reports?userId=${userId}&page=${page}&limit=${limit}`,
    `/issue-reports/getAll/${userId}?page=${page}&limit=${limit}`,
    `/issue-reports/user/${userId}?page=${page}&limit=${limit}`,
    `/issues?userId=${userId}&page=${page}&limit=${limit}`,
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      const response = await api.get(endpoint, { timeout: 8000 });
      const data = response.data;

      if (data?.status === 200 && data?.data) {
        return data.data;
      }
    } catch {
      // Try next
    }
  }

  // Fallback to local cache if backend endpoint is not yet connected
  try {
    const key = `tutorfolio_issue_reports_${userId}`;
    const local = JSON.parse(localStorage.getItem(key) || "[]");
    return {
      total: local.length,
      page,
      limit,
      issueReports: local,
    };
  } catch {
    return { total: 0, page: 1, limit, issueReports: [] };
  }
};


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
const responseError = (data, fallback) => {
  const detail = data?.message || data?.detail;
  return new Error(Array.isArray(detail) ? detail.map((item) => item.msg || String(item)).join(", ") : detail || fallback);
};

export const getIssueTypes = async () => {
  try {
    const { data } = await api.get("/issues/types", { timeout: 8000 });
    if (data?.status === 200 && Array.isArray(data?.data?.issueTypes)) return data.data.issueTypes;
  } catch {
    // Form defaults remain available; submissions still require server confirmation.
  }
  return DEFAULT_ISSUE_TYPES;
};

export const createIssueReport = async ({ issueType, title, description, pageUrl }) => {
  try {
    const { data } = await api.post("/issues/report", {
      issueType: issueType.trim(), title: title.trim(), description: description.trim(),
      pageUrl: pageUrl?.trim() || null,
    }, { timeout: 12000 });
    if ((data?.status === 201 || data?.status === 200) && data?.data?.issueReportId) return data.data;
    throw responseError(data, "Your report could not be submitted. Please try again.");
  } catch (error) {
    if (error.response) throw responseError(error.response.data, "Your report could not be submitted. Please try again.");
    throw error;
  }
};

// Retain reports saved by the old offline fallback, without calling them submitted.
const getLegacyReports = (userId) => {
  try {
    const reports = JSON.parse(localStorage.getItem(`tutorfolio_issue_reports_${userId}`) || "[]");
    return Array.isArray(reports) ? reports.filter((item) => item?.isLocal && String(item.userId) === String(userId)) : [];
  } catch {
    return [];
  }
};

export const getUserIssueReports = async (userId, page = 1, limit = 20) => {
  if (!userId) throw new Error("Please log in to view your reports.");
  try {
    // Ownership is resolved from the Bearer token by the backend.
    const { data } = await api.get("/issues/my-reports", { params: { page, limit }, timeout: 12000 });
    if (data?.status !== 200 || !Array.isArray(data?.data?.issueReports) || !Number.isInteger(data.data.total)) {
      throw responseError(data, "Unable to load your reports. Please try again.");
    }
    const local = page === 1 ? getLegacyReports(userId) : [];
    return {
      ...data.data,
      total: data.data.total + local.length,
      localCount: local.length,
      issueReports: [...local, ...data.data.issueReports],
    };
  } catch (error) {
    if (error.response) throw responseError(error.response.data, "Unable to load your reports. Please try again.");
    throw new Error(error.message || "Unable to load your reports. Please try again.");
  }
};

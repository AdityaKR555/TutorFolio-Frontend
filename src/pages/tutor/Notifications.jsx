import { confirmAction } from "../../components/PlatformDialog";
import PlatformLoader from "../../components/PlatformLoader";
import "./notifications-mobile.css";
import KpiState from "../../components/KpiState";
import { Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import ExpandableText from "../../components/ExpandableText";

const panel = "rounded-2xl border border-tf-line bg-tf-surface";
const button = "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50";
const secondary = "inline-flex items-center justify-center gap-2 rounded-xl border border-tf-line bg-tf-bg px-3 py-2 text-sm font-medium text-tf-copy transition hover:bg-tf-surface-soft disabled:opacity-50";
const typeLabels = { new_chat: "New chat", new_message: "New message", website_visit: "Profile visit" };

function getTutorId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const id = Number(user?.user_id ?? user?.userId ?? user?.id);
    return id > 0 && Number.isFinite(id) ? id : null;
  } catch { return null; }
}
function getData(response) {
  const body = response?.data ?? response ?? {};
  if (body.status !== undefined && ![200, 201].includes(Number(body.status))) throw new Error(body.message || "Request failed.");
  return body.data ?? body.details ?? body;
}
function dateLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
function Notice({ children, type = "error" }) {
  if (!children) return null;
  const style = type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-200" : "border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-200";
  return <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${style}`}>{children}</p>;
}
function IconForType({ type }) {
  const cls = type === "website_visit" ? "bg-violet-50 text-violet-800 dark:bg-violet-500/10 dark:text-violet-200" : type === "new_chat" ? "bg-blue-50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200" : "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200";
  const icon = type === "website_visit" ? "↗" : type === "new_chat" ? "✉" : "↩";
  return <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ${cls}`}>{icon}</div>;
}

export default function Notifications() {
  const tutorId = getTutorId();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "visits" ? "visits" : "notifications";
  const [tab, setTab] = useState(initialTab);
  const [items, setItems] = useState([]);
  const [visits, setVisits] = useState([]);
  const [counts, setCounts] = useState({ totalUnread: 0, breakdown: { new_chat: 0, new_message: 0, website_visit: 0 } });
  const [typeFilter, setTypeFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [limit] = useState(20);
  const [visitDetail, setVisitDetail] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const focusedNotificationId = searchParams.get("notificationId");

  useEffect(() => {
    if (!focusedNotificationId || !tutorId) { setVisitDetail(null); setDetailError(""); return; }
    let cancelled = false;
    setDetailLoading(true); setDetailError(""); setVisitDetail(null);
    api.get(`/notifications/visit-details/${encodeURIComponent(focusedNotificationId)}`, { params: { tutorId }, timeout: 12000 })
      .then(response => { const data = getData(response); if (!cancelled) setVisitDetail(data); })
      .catch(err => { if (!cancelled) setDetailError(err?.response?.data?.message || err.message || "Unable to load visit details."); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [focusedNotificationId, tutorId]);

  const loadCounts = useCallback(async () => {
    if (!tutorId) return;
    try {
      const response = await api.get("/notifications/unread-count", { params: { tutorId }, timeout: 12000 });
      const data = getData(response);
      setCounts({ totalUnread: Number(data?.totalUnread ?? 0), breakdown: data?.breakdown ?? {} });
    } catch (err) { console.warn("Unable to refresh notification counts", err); }
  }, [tutorId]);

  const loadNotifications = useCallback(async () => {
    if (!tutorId) { setError("Your login session could not be found. Please log in again."); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const params = { tutorId, page, limit, unreadOnly };
      if (typeFilter !== "all") params.type = typeFilter;
      const response = await api.get("/notifications", { params, timeout: 15000 });
      const data = getData(response);
      setItems(Array.isArray(data?.notifications) ? data.notifications : []);
      setTotal(Number(data?.total ?? 0));
    } catch (err) {
      setItems([]); setTotal(0);
      setError(err?.response?.data?.message || err.message || "Unable to load notifications.");
    } finally { setLoading(false); }
  }, [tutorId, page, limit, unreadOnly, typeFilter]);

  const loadVisits = useCallback(async () => {
    if (!tutorId) { setError("Your login session could not be found. Please log in again."); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const response = await api.get("/notifications/visits", { params: { tutorId, page, limit }, timeout: 15000 });
      const data = getData(response);
      setVisits(Array.isArray(data?.visits) ? data.visits : []);
      setTotal(Number(data?.total ?? 0));
    } catch (err) {
      setVisits([]); setTotal(0);
      setError(err?.response?.data?.message || err.message || "Unable to load profile visits.");
    } finally { setLoading(false); }
  }, [tutorId, page, limit]);

  useEffect(() => { if (tab === "visits") loadVisits(); else loadNotifications(); }, [tab, loadNotifications, loadVisits]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  const updateTab = (nextTab) => {
    setTab(nextTab); setPage(1); setError(""); setNotice("");
    const params = new URLSearchParams(searchParams);
    if (nextTab === "visits") params.set("tab", "visits"); else params.delete("tab");
    setSearchParams(params, { replace: true });
  };

  const markOneRead = async (item) => {
    if (item.isRead || busyId === item.notificationId) return;
    setBusyId(item.notificationId); setError(""); setNotice("");
    try {
      const response = await api.patch("/notifications/mark-read", { tutorId, notificationId: Number(item.notificationId) }, { timeout: 12000 });
      getData(response);
      setItems((current) => current.map((n) => n.notificationId === item.notificationId ? { ...n, isRead: true } : n));
      setNotice("Notification marked as read.");
      await loadCounts();
      window.dispatchEvent(new CustomEvent("tutorfolio-notifications-updated"));
    } catch (err) { setError(err?.response?.data?.message || err.message || "Unable to mark notification as read."); }
    finally { setBusyId(null); }
  };

  const markAllRead = async () => {
    if (!tutorId || !counts.totalUnread) return;
    setBusyId("all"); setError(""); setNotice("");
    try {
      const response = await api.patch("/notifications/mark-all-read", { tutorId }, { timeout: 12000 });
      getData(response);
      setItems((current) => current.map((n) => ({ ...n, isRead: true })));
      setNotice("All notifications marked as read.");
      await loadCounts();
      window.dispatchEvent(new CustomEvent("tutorfolio-notifications-updated"));
    } catch (err) { setError(err?.response?.data?.message || err.message || "Unable to mark all notifications as read."); }
    finally { setBusyId(null); }
  };

  const deleteNotification = async (item) => {
    if (!tutorId || busyId === item.notificationId) return;
    setBusyId(item.notificationId); setError(""); setNotice("");
    try {
      const response = await api.delete(`/notifications/${encodeURIComponent(item.notificationId)}`, { params: { tutorId }, timeout: 12000 });
      getData(response);
      setItems((current) => current.filter((n) => n.notificationId !== item.notificationId));
      setTotal((value) => Math.max(0, value - 1));
      setNotice("Notification deleted.");
      await loadCounts();
      window.dispatchEvent(new CustomEvent("tutorfolio-notifications-updated"));
    } catch (err) { setError(err?.response?.data?.message || err.message || "Unable to delete notification."); }
    finally { setBusyId(null); }
  };

  const clearRead = async () => {
    if (!tutorId || !items.some((item) => item.isRead)) return;
    if (!await confirmAction("Clear all read notifications? This will remove them from the notification list.")) return;
    setBusyId("clear"); setError(""); setNotice("");
    try {
      const response = await api.delete("/notifications/clear-read", { params: { tutorId }, timeout: 12000 });
      getData(response);
      setItems((current) => current.filter((item) => !item.isRead));
      setNotice("Read notifications cleared.");
      await loadCounts();
      window.dispatchEvent(new CustomEvent("tutorfolio-notifications-updated"));
    } catch (err) { setError(err?.response?.data?.message || err.message || "Unable to clear read notifications."); }
    finally { setBusyId(null); }
  };

  const openNotification = async (item) => {
    if (!item.isRead) await markOneRead(item);
    if (item.type === "new_chat" || item.type === "new_message") {
      navigate(item.relatedId ? `/conversations?conversationId=${encodeURIComponent(item.relatedId)}` : "/conversations");
    } else if (item.type === "website_visit") {
      const params = new URLSearchParams();
      params.set("notificationId", String(item.notificationId));
      setSearchParams(params);
    }
  };

  const maxPages = Math.max(1, Math.ceil(total / limit));
  const hasReadItems = useMemo(() => items.some((item) => item.isRead), [items]);

  return (
    <div className="mobile-page mobile-notifications min-h-screen bg-tf-bg p-4 text-tf-ink sm:p-7">
      <div className="mx-auto max-w-5xl">
        <div className="notifications-heading mobile-dashboard-heading mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-tf-copy">Keep up with your portfolio</p><h1 className="tf-page-title mt-1">Notifications & visits</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-tf-copy">See new enquiries, messages and activity on your public tutor website.</p></div><button type="button" onClick={() => { if (tab === "visits") loadVisits(); else loadNotifications(); loadCounts(); }} className={secondary}>↻ Refresh</button></div>
        <div className="mobile-summary mobile-summary-three mobile-notification-summary mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[["Unread notifications", Number(counts.totalUnread || 0), "You're all caught up", "messages"],
            ["Chats & messages", Number(counts.breakdown?.new_chat || 0) + Number(counts.breakdown?.new_message || 0), "No unread conversations", "messages"],
            ["Profile visits", Number(counts.breakdown?.website_visit || 0), "No unread visit alerts", "people"]].map(([label,value,message,kind]) => (
            <div key={label} className={`notification-kpi ${label === "Chats & messages" ? "notification-chat-kpi" : ""} ${panel} p-4`}>
              <KpiState loading={loading} unavailable={Boolean(error) && value === 0} empty={value === 0} label={label} message={message} kind={kind}>
                <p className="text-xs text-tf-muted">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p>
              </KpiState>
            </div>
          ))}
        </div>
        <div className={`notifications-panel ${panel} overflow-hidden`}>
          <div className="notifications-controls flex flex-col justify-between gap-3 border-b border-tf-line p-4 sm:flex-row sm:items-center sm:p-5"><div className="flex gap-2"><button type="button" onClick={() => updateTab("notifications")} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === "notifications" ? "bg-blue-600 text-white" : "text-tf-copy hover:bg-tf-surface-soft"}`}>Notifications</button><button type="button" onClick={() => updateTab("visits")} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === "visits" ? "bg-blue-600 text-white" : "text-tf-copy hover:bg-tf-surface-soft"}`}>Recent visits</button></div>
            {tab === "notifications" && <div className="notifications-filters flex flex-wrap gap-2"><select aria-label="Filter notification type" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }} className="rounded-xl border border-tf-line bg-tf-bg px-3 py-2 text-sm text-tf-ink outline-none"><option value="all">All types</option><option value="new_chat">New chats</option><option value="new_message">New messages</option><option value="website_visit">Profile visits</option></select><label className="flex items-center gap-2 rounded-xl border border-tf-line bg-tf-bg px-3 py-2 text-xs text-tf-copy"><input type="checkbox" checked={unreadOnly} onChange={(event) => { setUnreadOnly(event.target.checked); setPage(1); }} className="accent-blue-500"/>Unread only</label></div>}
          </div>
          {tab === "notifications" && <div className="notifications-actions flex flex-wrap justify-between gap-2 border-b border-tf-line px-4 py-3 sm:px-5"><p className="self-center text-xs text-tf-muted">{total} notification{total === 1 ? "" : "s"}</p><div className="flex gap-2"><button type="button" onClick={markAllRead} disabled={!counts.totalUnread || busyId === "all"} className={secondary}>{busyId === "all" ? "Updating…" : "Mark all read"}</button><button type="button" onClick={clearRead} disabled={!hasReadItems || busyId === "clear"} className={secondary}>{busyId === "clear" ? "Clearing…" : "Clear read"}</button></div></div>}
          {error && <div className="p-4 sm:p-5"><Notice>{error}</Notice></div>}{notice && <div className="px-4 pt-4 sm:px-5"><Notice type="success">{notice}</Notice></div>}
          {loading ? <div className="p-12 text-center"><PlatformLoader label={tab === "visits" ? "Loading recent visits…" : "Loading notifications…"} /></div> : tab === "notifications" ? <div className="divide-y divide-tf-line">{!items.length && <div className="p-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-tf-sky text-xl text-tf-blue-pressed">♧</div><p className="mt-3 font-semibold">Nothing to show</p><p className="mt-2 text-sm text-tf-copy">New chats, messages and profile visits will appear here.</p></div>}{items.map((item) => <article key={item.notificationId} className={`notification-item flex gap-3 p-4 transition hover:bg-tf-surface-soft sm:p-5 ${item.isRead ? "" : "bg-tf-sky"}`}><IconForType type={item.type}/><div className="min-w-0 flex-1"><button type="button" onClick={() => openNotification(item)} className="block w-full text-left"><span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-tf-ink">{item.title || typeLabels[item.type] || "Notification"}</span>{!item.isRead && <span className="h-2 w-2 rounded-full bg-blue-400"/>}</span>{item.message && <span className="mt-1 block line-clamp-3 whitespace-pre-line break-words text-sm leading-6 text-tf-copy">{item.message}</span>}<span className="mt-2 block text-[11px] text-tf-muted">{typeLabels[item.type] || item.type} · {dateLabel(item.createdAt)}</span></button><div className="notification-item-actions mt-3 flex flex-wrap gap-2">{!item.isRead && <button type="button" onClick={() => markOneRead(item)} disabled={busyId === item.notificationId} className={secondary}>Mark read</button>}<button type="button" onClick={() => deleteNotification(item)} disabled={busyId === item.notificationId} className="mobile-icon-action rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-500/15 dark:text-red-200 dark:hover:bg-red-500/10" aria-label="Delete notification"><Trash2 className="mobile-only-action-icon" size={20}/><span className="mobile-action-label">Delete</span></button></div></div><button type="button" onClick={() => openNotification(item)} className="hidden shrink-0 self-center text-sm text-tf-blue-pressed hover:text-tf-blue sm:block">Open →</button></article>)}</div> : <div className="divide-y divide-tf-line">{!visits.length && <div className="p-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-xl text-violet-800 dark:bg-violet-500/10 dark:text-violet-200">↗</div><p className="mt-3 font-semibold">No visits recorded yet</p><p className="mt-2 text-sm text-tf-copy">Visits will appear after someone loads your public tutor website.</p></div>}{visits.map((visit) => <article key={visit.visitId} className="flex gap-3 p-4 sm:p-5"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-lg text-violet-800 dark:bg-violet-500/10 dark:text-violet-200">↗</div><div className="min-w-0 flex-1"><p className="[overflow-wrap:anywhere] font-semibold text-tf-ink">{visit.visitorName || "Anonymous visitor"}</p><p className="mt-1 break-all text-sm text-tf-copy">{visit.visitorEmail || "No contact details provided"}</p><p className="mt-2 text-xs text-tf-muted">Visited {dateLabel(visit.createdAt)}</p>{visit.referrer && <p className="mt-2 break-all text-xs text-tf-muted">Referrer: {visit.referrer}</p>}</div></article>)}</div>}
          <div className="flex items-center justify-between border-t border-tf-line p-4 sm:px-5"><p className="text-xs text-tf-muted">Page {page} of {maxPages}</p><div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className={secondary}>← Previous</button><button type="button" disabled={page >= maxPages || loading} onClick={() => setPage((value) => value + 1)} className={secondary}>Next →</button></div></div>
        </div>
      </div>
    </div>
  );
}

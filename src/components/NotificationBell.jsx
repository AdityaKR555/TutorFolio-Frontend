import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function currentTutorId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const id = Number(user?.user_id ?? user?.userId ?? user?.id);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch { return null; }
}
function getData(response) {
  const body = response?.data ?? response ?? {};
  if (body.status !== undefined && ![200, 201].includes(Number(body.status))) throw new Error(body.message || "Request failed.");
  return body.data ?? body.details ?? body;
}
function timeAgo(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

export default function NotificationBell() {
  const tutorId = currentTutorId();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadConversations, setUnreadConversations] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);
  const rootRef = useRef(null);

  const refreshCounts = useCallback(async () => {
    if (!tutorId) return;
    const [notificationResult, chatResult] = await Promise.allSettled([
      api.get("/notifications/unread-count", { params: { tutorId }, timeout: 10000 }),
      api.get("/chat/tutor/unread-count", { params: { tutorId }, timeout: 10000 }),
    ]);
    if (notificationResult.status === "fulfilled") {
      try { setUnreadNotifications(Number(getData(notificationResult.value)?.totalUnread ?? 0)); } catch { /* leave previous count */ }
    }
    if (chatResult.status === "fulfilled") {
      try { setUnreadConversations(Number(getData(chatResult.value)?.unreadConversations ?? 0)); } catch { /* leave previous count */ }
    }
  }, [tutorId]);

  const loadRecent = useCallback(async () => {
    if (!tutorId) return;
    setLoading(true); setError("");
    try {
      const response = await api.get("/notifications", { params: { tutorId, page: 1, limit: 7 }, timeout: 12000 });
      const data = getData(response);
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Could not load notifications.");
    } finally { setLoading(false); }
  }, [tutorId]);

  useEffect(() => {
    refreshCounts();
    const refresh = () => refreshCounts();
    window.addEventListener("focus", refresh);
    window.addEventListener("tutorfolio-notifications-updated", refresh);
    window.addEventListener("tutorfolio-chat-updated", refresh);
    const timer = window.setInterval(refresh, 45000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("tutorfolio-notifications-updated", refresh);
      window.removeEventListener("tutorfolio-chat-updated", refresh);
      window.clearInterval(timer);
    };
  }, [refreshCounts]);

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) { loadRecent(); refreshCounts(); }
  };

  const handleOpenNotification = async (item) => {
    setActingId(item.notificationId);
    try {
      if (!item.isRead) {
        const response = await api.patch("/notifications/mark-read", { tutorId, notificationId: Number(item.notificationId) }, { timeout: 10000 });
        getData(response);
        setNotifications((current) => current.map((n) => n.notificationId === item.notificationId ? { ...n, isRead: true } : n));
      }
      await refreshCounts();
      setOpen(false);
      if (item.type === "new_chat" || item.type === "new_message") {
        navigate(item.relatedId ? `/conversations?conversationId=${encodeURIComponent(item.relatedId)}` : "/conversations");
      } else if (item.type === "website_visit") {
        navigate("/notifications?tab=visits");
      } else {
        navigate("/notifications");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Could not open this notification.");
    } finally {
      setActingId(null);
      window.dispatchEvent(new CustomEvent("tutorfolio-notifications-updated"));
    }
  };

  const countLabel = unreadNotifications > 99 ? "99+" : unreadNotifications;
  const chatLabel = unreadConversations > 99 ? "99+" : unreadConversations;

  return (
    <div ref={rootRef} className="relative flex items-center gap-2">
      <button type="button" onClick={() => { setOpen(false); navigate("/conversations"); }} title="Conversations" aria-label={`Open conversations${unreadConversations ? `, ${unreadConversations} unread` : ""}`} className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/15 bg-[#0a1628] text-[#c7d8f5] transition hover:bg-blue-500/10 hover:text-white">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></svg>
        {unreadConversations > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">{chatLabel}</span>}
      </button>
      <button type="button" onClick={toggle} aria-expanded={open} aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ""}`} title="Notifications" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/15 bg-[#0a1628] text-[#c7d8f5] transition hover:bg-blue-500/10 hover:text-white">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
        {unreadNotifications > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{countLabel}</span>}
      </button>

      {open && <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-blue-500/15 bg-[#0f1f36] shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-blue-500/10 px-4 py-3.5"><div><h3 className="font-semibold text-white">Notifications</h3><p className="mt-0.5 text-xs text-[#8197b8]">{unreadNotifications} unread</p></div><button type="button" onClick={() => { setOpen(false); navigate("/notifications"); }} className="text-xs font-semibold text-blue-300 hover:text-blue-200">View all →</button></div>
        {error && <p className="m-3 rounded-lg bg-red-500/5 p-2 text-xs text-red-200">{error}</p>}
        <div className="max-h-[390px] overflow-y-auto">{loading && <p className="p-6 text-center text-sm text-[#94a8c7]">Loading…</p>}{!loading && !notifications.length && <p className="p-7 text-center text-sm text-[#8197b8]">You're all caught up. New activity will appear here.</p>}{!loading && notifications.map((item) => <button type="button" key={item.notificationId} onClick={() => handleOpenNotification(item)} disabled={actingId === item.notificationId} className={`flex w-full gap-3 border-b border-blue-500/10 p-4 text-left transition hover:bg-blue-500/5 disabled:opacity-50 ${item.isRead ? "" : "bg-blue-500/[0.035]"}`}><span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.isRead ? "bg-transparent" : "bg-blue-400"}`}/><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#e2eaf7]">{item.title || item.type || "Notification"}</span>{item.message && <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[#94a8c7]">{item.message}</span>}<span className="mt-1.5 block text-[10px] text-[#617391]">{timeAgo(item.createdAt)}</span></span></button>)}</div>
        <div className="grid grid-cols-2 border-t border-blue-500/10"><button type="button" onClick={() => { setOpen(false); navigate("/conversations"); }} className="px-3 py-3 text-xs font-semibold text-blue-200 hover:bg-blue-500/5">Inbox{unreadConversations ? ` · ${unreadConversations} unread` : ""}</button><button type="button" onClick={() => { setOpen(false); navigate("/notifications?tab=visits"); }} className="border-l border-blue-500/10 px-3 py-3 text-xs font-semibold text-blue-200 hover:bg-blue-500/5">Recent profile visits</button></div>
      </div>}
    </div>
  );
}

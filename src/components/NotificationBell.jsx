import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function currentTutorId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const id = Number(user?.user_id ?? user?.userId ?? user?.id);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

function getData(response) {
  const body = response?.data ?? response ?? {};
  if (body.status !== undefined && ![200, 201].includes(Number(body.status)))
    throw new Error(body.message || "Request failed.");
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
  const [markingAll, setMarkingAll] = useState(false);
  const rootRef = useRef(null);

  const refreshCounts = useCallback(async () => {
    const tid = currentTutorId();
    if (!tid) return;
    const [notificationResult, chatResult] = await Promise.allSettled([
      api.get("/notifications/unread-count", { params: { tutorId: tid }, timeout: 10000 }),
      api.get("/chat/tutor/unread-count", { params: { tutorId: tid }, timeout: 10000 }),
    ]);
    if (notificationResult.status === "fulfilled") {
      try {
        setUnreadNotifications(Number(getData(notificationResult.value)?.totalUnread ?? 0));
      } catch {
        /* leave previous count */
      }
    }
    if (chatResult.status === "fulfilled") {
      try {
        setUnreadConversations(Number(getData(chatResult.value)?.unreadConversations ?? 0));
      } catch {
        /* leave previous count */
      }
    }
  }, []);

  const loadRecent = useCallback(async () => {
    const tid = currentTutorId();
    if (!tid) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/notifications", {
        params: { tutorId: tid, page: 1, limit: 7 },
        timeout: 12000,
      });
      const data = getData(response);
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

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
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      loadRecent();
      refreshCounts();
    }
  };

  const handleOpenNotification = async (item) => {
    const tid = currentTutorId();
    setActingId(item.notificationId);
    try {
      if (!item.isRead && tid) {
        const response = await api.patch(
          "/notifications/mark-read",
          { tutorId: tid, notificationId: Number(item.notificationId) },
          { timeout: 10000 }
        );
        getData(response);
        setNotifications((current) =>
          current.map((n) =>
            n.notificationId === item.notificationId ? { ...n, isRead: true } : n
          )
        );
      }
      await refreshCounts();
      setOpen(false);
      if (item.type === "new_chat" || item.type === "new_message") {
        navigate(
          item.relatedId
            ? `/conversations?conversationId=${encodeURIComponent(item.relatedId)}`
            : "/conversations"
        );
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

  const handleMarkAllRead = async () => {
    const tid = currentTutorId();
    if (!tid || markingAll) return;
    setMarkingAll(true);
    setError("");
    try {
      const response = await api.patch(
        "/notifications/mark-all-read",
        { tutorId: tid },
        { timeout: 12000 }
      );
      getData(response);
      setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifications(0);
      window.dispatchEvent(new CustomEvent("tutorfolio-notifications-updated"));
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Unable to mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const countLabel = unreadNotifications > 99 ? "99+" : unreadNotifications;
  const chatLabel = unreadConversations > 99 ? "99+" : unreadConversations;
  const hasUnread = unreadNotifications > 0 || notifications.some((n) => !n.isRead);

  return (
    <div ref={rootRef} className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          navigate("/conversations");
        }}
        title="Conversations"
        aria-label={`Open conversations${unreadConversations ? `, ${unreadConversations} unread` : ""}`}
        className="relative inline-flex h-10 w-10 items-center justify-center text-tf-copy transition hover:text-tf-ink"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
        </svg>
        {unreadConversations > 0 && (
          <span className="absolute right-1 top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
            {chatLabel}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ""}`}
        title="Notifications"
        className="relative inline-flex h-10 w-10 items-center justify-center text-tf-copy transition hover:text-tf-ink"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        {unreadNotifications > 0 && (
          <span className="absolute right-1 top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {countLabel}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-[90] bg-black/25 backdrop-blur-[1px] sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Notifications container: responsive on mobile & desktop */}
          <div className="fixed inset-x-3.5 top-[76px] z-[100] flex max-h-[calc(100vh-95px)] flex-col overflow-hidden rounded-2xl border border-tf-line bg-tf-surface text-tf-ink shadow-2xl shadow-black/15 dark:shadow-black/40 sm:absolute sm:inset-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-[380px] sm:max-h-[520px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-tf-line px-4 py-3 sm:py-3.5">
              <div>
                <h3 className="text-sm font-semibold text-tf-ink sm:text-base">Notifications</h3>
                <p className="mt-0.5 text-xs text-tf-muted">{unreadNotifications} unread</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate("/notifications");
                  }}
                  className="text-xs font-semibold text-tf-blue-pressed transition hover:text-tf-blue"
                >
                  View all →
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-tf-muted transition hover:bg-tf-surface-soft hover:text-tf-ink sm:hidden"
                  aria-label="Close notifications"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <p className="m-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-200">
                {error}
              </p>
            )}

            {/* Notifications scroll list */}
            <div className="flex-1 overflow-y-auto divide-y divide-tf-line overscroll-contain">
              {loading && <p className="p-6 text-center text-sm text-tf-copy">Loading…</p>}
              {!loading && !notifications.length && (
                <p className="p-7 text-center text-sm text-tf-muted">
                  You're all caught up. New activity will appear here.
                </p>
              )}
              {!loading &&
                notifications.map((item) => (
                  <button
                    type="button"
                    key={item.notificationId}
                    onClick={() => handleOpenNotification(item)}
                    disabled={actingId === item.notificationId}
                    className={`flex w-full gap-3 p-3.5 text-left transition hover:bg-tf-surface-soft disabled:opacity-50 sm:p-4 ${
                      item.isRead ? "" : "bg-tf-sky/40"
                    }`}
                  >
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        item.isRead ? "bg-transparent" : "bg-blue-500"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-tf-ink break-words">
                        {item.title || item.type || "Notification"}
                      </span>
                      {item.message && (
                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-tf-copy break-words">
                          {item.message}
                        </span>
                      )}
                      <span className="mt-1.5 block text-[10px] text-tf-muted">
                        {timeAgo(item.createdAt)}
                      </span>
                    </span>
                  </button>
                ))}
            </div>

            {/* Footer action buttons */}
            <div className="grid grid-cols-2 divide-x divide-tf-line border-t border-tf-line bg-tf-surface">
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll || !hasUnread}
                className="flex items-center justify-center gap-1.5 px-3 py-3 text-center text-xs font-semibold text-tf-blue-pressed transition hover:bg-tf-surface-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                {markingAll ? (
                  "Marking…"
                ) : (
                  <>
                    <svg
                      className="h-3.5 w-3.5 shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="truncate">Mark all as read</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/notifications?tab=visits");
                }}
                className="px-3 py-3 text-center text-xs font-semibold text-tf-blue-pressed transition hover:bg-tf-surface-soft truncate"
              >
                Recent profile visits
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

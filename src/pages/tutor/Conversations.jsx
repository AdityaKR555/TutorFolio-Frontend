import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
const validStatuses = ["open", "closed", "archived"];

function currentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const id = Number(user?.user_id ?? user?.userId ?? user?.id);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
function payloadOf(response) {
  const body = response?.data ?? response ?? {};
  if (body?.status !== undefined && ![200, 201].includes(Number(body.status))) {
    throw new Error(body.message || "The request could not be completed.");
  }
  return body?.data ?? body?.details ?? body;
}
function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
function shortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString([], { month: "short", day: "numeric" });
}
function Initial({ name }) {
  return <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] border border-[#dfe9f3] bg-[#eaf6ff] text-[15px] font-bold text-[#1875d1] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#193852] [[data-theme=dark]_&]:text-[#4aa8ee]">{(name || "V").trim().charAt(0).toUpperCase()}</div>;
}
function StatusPill({ status }) {
  const value = status || "open";
  const stateClass = value === "closed"
    ? "bg-[#f8fbff] text-[#8394a9] [[data-theme=dark]_&]:bg-[#1b2d44] [[data-theme=dark]_&]:text-[#91a5bf]"
    : value === "archived"
      ? "bg-[#f8fbff] text-[#0c5fb7] [[data-theme=dark]_&]:bg-[#1b2d44] [[data-theme=dark]_&]:text-[#8bcdf7]"
      : "";
  return <span className={`inline-flex items-center rounded-[20px] px-2 py-[3px] text-[10px] font-bold capitalize ${value === "open" ? "bg-[#eaf8f1] text-[#147d5a] [[data-theme=dark]_&]:bg-[#183d37] [[data-theme=dark]_&]:text-[#69d4a8]" : ""} ${stateClass}`}>{value}</span>;
}
function ErrorNotice({ children }) {
  if (!children) return null;
  return <div role="alert" className="mb-[14px] rounded-[9px] border border-[#dfe9f3] bg-[#fff2f3] px-[14px] py-[11px] text-[13px] text-[#b93849] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#45232d] [[data-theme=dark]_&]:text-[#ff9aa4]">{children}</div>;
}

export default function Conversations() {
  const tutorId = currentUserId();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [inbox, setInbox] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(() => searchParams.get("conversationId") || "");
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState("");
  const [inboxLoading, setInboxLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [threadError, setThreadError] = useState("");
  const [notice, setNotice] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const requestedFromQueryRef = useRef(false);

  const loadUnreadCount = useCallback(async () => {
    if (!tutorId) return;
    try {
      const response = await api.get("/chat/tutor/unread-count", { params: { tutorId }, timeout: 12000 });
      const data = payloadOf(response);
      setUnreadCount(Number(data?.unreadConversations ?? data?.unread ?? 0));
    } catch (err) {
      console.warn("Unable to refresh unread conversation count", err);
    }
  }, [tutorId]);

  const loadInbox = useCallback(async () => {
    if (!tutorId) {
      setError("Your login session could not be found. Please log in again.");
      setInboxLoading(false);
      return [];
    }
    setInboxLoading(true);
    setError("");
    try {
      const params = { tutorId, page, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      const response = await api.get("/chat/tutor/inbox", { params, timeout: 15000 });
      const data = payloadOf(response);
      const rows = Array.isArray(data?.conversations) ? data.conversations : Array.isArray(data?.items) ? data.items : [];
      setInbox(rows);
      setTotal(Number(data?.total ?? rows.length));
      return rows;
    } catch (err) {
      setInbox([]);
      setTotal(0);
      setError(err?.response?.data?.message || err.message || "Unable to load your inbox.");
      return [];
    } finally {
      setInboxLoading(false);
    }
  }, [tutorId, page, statusFilter]);

  const loadThread = useCallback(async (conversationId, quiet = false) => {
    if (!tutorId || !conversationId) return null;
    if (!quiet) setThreadLoading(true);
    setThreadError("");
    try {
      const response = await api.get(`/chat/tutor/thread/${encodeURIComponent(conversationId)}`, {
        params: { tutorId }, timeout: 15000,
      });
      const data = payloadOf(response);
      setThread(data);
      setInbox((previous) => previous.map((item) => String(item.conversationId) === String(conversationId)
        ? { ...item, unreadCount: 0, isReadByTutor: true }
        : item));
      await loadUnreadCount();
      window.dispatchEvent(new CustomEvent("tutorfolio-chat-updated"));
      return data;
    } catch (err) {
      setThread(null);
      setThreadError(err?.response?.data?.message || err.message || "Unable to load this conversation.");
      return null;
    } finally {
      if (!quiet) setThreadLoading(false);
    }
  }, [tutorId, loadUnreadCount]);

  useEffect(() => { loadInbox(); }, [loadInbox]);
  useEffect(() => { loadUnreadCount(); }, [loadUnreadCount]);

  useEffect(() => {
    if (!inbox.length) {
      setSelectedId("");
      setThread(null);
      return;
    }
    if (!requestedFromQueryRef.current) {
      const target = searchParams.get("conversationId");
      requestedFromQueryRef.current = true;
      if (target && inbox.some((item) => String(item.conversationId) === String(target))) {
        setSelectedId(String(target));
        return;
      }
    }
    if (!selectedId || !inbox.some((item) => String(item.conversationId) === String(selectedId))) {
      setSelectedId(String(inbox[0].conversationId));
    }
  }, [inbox, searchParams, selectedId]);

  useEffect(() => {
    if (!selectedId) { setThread(null); return; }
    loadThread(selectedId);
  }, [selectedId, loadThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread?.messages?.length, selectedId]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredUnread = useMemo(() => inbox.reduce((sum, item) => sum + Number(item.unreadCount || 0), 0), [inbox]);

  const chooseConversation = (item) => {
    const id = String(item.conversationId);
    setSelectedId(id);
    setThread(null);
    setDraft("");
    setThreadError("");
    setNotice("");
    const next = new URLSearchParams(searchParams);
    next.set("conversationId", id);
    setSearchParams(next, { replace: true });
  };

  const sendReply = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || !tutorId || !selectedId || sending) return;
    setSending(true);
    setThreadError("");
    setNotice("");
    try {
      const response = await api.post("/chat/tutor/reply", {
        tutorId, conversationId: Number(selectedId), message,
      }, { timeout: 15000 });
      payloadOf(response);
      setDraft("");
      setNotice("Reply sent.");
      await loadThread(selectedId, true);
      await loadInbox();
      await loadUnreadCount();
      window.dispatchEvent(new CustomEvent("tutorfolio-chat-updated"));
      window.dispatchEvent(new CustomEvent("tutorfolio-notifications-updated"));
    } catch (err) {
      setThreadError(err?.response?.data?.message || err.message || "Could not send your reply.");
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (nextStatus) => {
    if (!tutorId || !selectedId || actionLoading) return;
    setActionLoading(true); setThreadError(""); setNotice("");
    try {
      const response = await api.patch("/chat/tutor/status", {
        tutorId, conversationId: Number(selectedId), status: nextStatus,
      }, { timeout: 12000 });
      payloadOf(response);
      setThread((previous) => previous ? { ...previous, status: nextStatus } : previous);
      setNotice(`Conversation marked ${nextStatus}.`);
      await loadInbox();
      await loadUnreadCount();
      window.dispatchEvent(new CustomEvent("tutorfolio-chat-updated"));
    } catch (err) {
      setThreadError(err?.response?.data?.message || err.message || "Unable to update conversation status.");
    } finally { setActionLoading(false); }
  };

  const markRead = async () => {
    if (!tutorId || !selectedId || actionLoading) return;
    setActionLoading(true); setThreadError("");
    try {
      const response = await api.patch("/chat/tutor/mark-read", {
        tutorId, conversationId: Number(selectedId),
      }, { timeout: 12000 });
      payloadOf(response);
      setInbox((previous) => previous.map((item) => String(item.conversationId) === String(selectedId)
        ? { ...item, unreadCount: 0, isReadByTutor: true } : item));
      await loadUnreadCount();
      window.dispatchEvent(new CustomEvent("tutorfolio-chat-updated"));
    } catch (err) {
      setThreadError(err?.response?.data?.message || err.message || "Unable to mark this conversation as read.");
    } finally { setActionLoading(false); }
  };

  const deleteConversation = async () => {
    if (!tutorId || !selectedId || actionLoading) return;
    const visitorName = thread?.visitorName || "this visitor";
    if (!window.confirm(`Delete the conversation with ${visitorName} from your inbox?`)) return;
    setActionLoading(true); setThreadError(""); setNotice("");
    try {
      const response = await api.delete(`/chat/tutor/conversation/${encodeURIComponent(selectedId)}`, {
        params: { tutorId }, timeout: 12000,
      });
      payloadOf(response);
      const nextRows = inbox.filter((item) => String(item.conversationId) !== String(selectedId));
      setInbox(nextRows);
      setTotal((value) => Math.max(0, value - 1));
      setSelectedId(nextRows[0] ? String(nextRows[0].conversationId) : "");
      setThread(null);
      setNotice("Conversation deleted from your inbox.");
      await loadUnreadCount();
      window.dispatchEvent(new CustomEvent("tutorfolio-chat-updated"));
    } catch (err) {
      setThreadError(err?.response?.data?.message || err.message || "Unable to delete conversation.");
    } finally { setActionLoading(false); }
  };

  const currentInboxItem = inbox.find((item) => String(item.conversationId) === String(selectedId));
  const maxPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="min-h-full bg-[#f4f8fd] text-[#172b46] [[data-theme=dark]_&]:bg-[#101b2b] [[data-theme=dark]_&]:text-[#e8f0fb]">
      <main className="mx-auto max-w-[1230px] px-[38px] pb-14 pt-9 max-[850px]:px-[22px] max-[850px]:pb-11 max-[850px]:pt-7 max-[680px]:px-[14px] max-[680px]:pb-9 max-[680px]:pt-[22px] max-[520px]:px-[13px] max-[520px]:pb-8 max-[520px]:pt-5">
        <header className="mb-6 flex items-end justify-between gap-5 max-[680px]:flex-col max-[680px]:items-start">
          <div><h1 className="tf-page-title mb-2">Conversations</h1><p className="m-0 text-[#566b84] [[data-theme=dark]_&]:text-[#b7c7db]">Manage student enquiries and reply to visitors who contact your public tutor website.</p></div>
          <div className="flex flex-wrap items-center justify-end gap-[9px] max-[680px]:justify-start max-[520px]:grid max-[520px]:w-full max-[520px]:grid-cols-2">
            <div className="inline-flex min-h-[42px] items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[#dfe9f3] bg-white px-[13px] py-[9px] text-[13px] text-[#566b84] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a] [[data-theme=dark]_&]:text-[#b7c7db]"><strong className="text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">{total}</strong> conversations</div>
            <div className="inline-flex min-h-[42px] items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[#dfe9f3] bg-white px-[13px] py-[9px] text-[13px] text-[#566b84] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a] [[data-theme=dark]_&]:text-[#b7c7db]"><strong className="text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">{unreadCount}</strong> unread</div>
            <button type="button" className="inline-flex min-h-[42px] items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[#dfe9f3] bg-white px-[13px] py-[9px] text-[13px] font-semibold text-[#566b84] hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-50 [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a] [[data-theme=dark]_&]:text-[#b7c7db] [[data-theme=dark]_&]:hover:bg-[#1b2d44]" onClick={() => { loadInbox(); loadUnreadCount(); if (selectedId) loadThread(selectedId, true); }} disabled={inboxLoading}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 9a7 7 0 0 1 12-2L20 12M4 12l2.5 5a7 7 0 0 0 12-2" strokeLinecap="round" strokeLinejoin="round"/></svg>Refresh
            </button>
          </div>
        </header>
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <div className="grid min-h-[650px] grid-cols-[minmax(265px,0.78fr)_minmax(0,2fr)] items-stretch gap-[17px] max-[850px]:grid-cols-[minmax(235px,0.8fr)_minmax(0,1.4fr)] max-[850px]:gap-3 max-[680px]:grid-cols-1">
          <section className="flex min-h-[650px] min-w-0 flex-col overflow-hidden rounded-[14px] border border-[#dfe9f3] bg-white shadow-[0_12px_30px_rgba(32,70,111,0.06)] max-[680px]:min-h-0 max-[680px]:max-h-[430px] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a]" aria-label="Inbox">
            <div className="border-b border-[#dfe9f3] p-4 [[data-theme=dark]_&]:border-[#30465f]">
              <div className="mb-[14px] flex items-center justify-between gap-2"><h2 className="tf-section-title m-0">Inbox</h2><span className="text-xs text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">{filteredUnread} unread here</span></div>
              <div className="grid grid-cols-2 gap-[6px]" role="tablist" aria-label="Filter conversations">
                {[{ value: "all", label: "All" }, { value: "open", label: "Open" }, { value: "closed", label: "Closed" }, { value: "archived", label: "Archived" }].map((option) => {
                  const active = statusFilter === option.value;
                  return (
                  <button key={option.value} type="button" role="tab" aria-selected={active} onClick={() => { setStatusFilter(option.value); setPage(1); }} className={`min-h-[35px] rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${active ? "border-tf-blue bg-tf-blue text-tf-on-primary" : "border-[#dfe9f3] bg-[#f8fbff] text-[#566b84] hover:bg-[#eaf6ff] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#1b2d44] [[data-theme=dark]_&]:text-[#b7c7db] [[data-theme=dark]_&]:hover:bg-[#193852]"}`}>{option.label}</button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 content-start overflow-auto">
              {inboxLoading && <div className="px-5 py-[38px] text-center text-[13px] text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]"><span className="mx-auto mb-2 block h-[22px] w-[22px] animate-spin rounded-full border-2 border-[#dfe9f3] border-t-[#1875d1] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:border-t-[#4aa8ee]" aria-hidden="true"/><p className="mt-2">Loading inbox…</p></div>}
              {!inboxLoading && !inbox.length && <div className="px-5 py-[38px] text-center text-[13px] text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]"><span className="mx-auto grid h-12 w-12 place-items-center rounded-[14px] bg-[#eaf6ff] text-xl text-[#1875d1] [[data-theme=dark]_&]:bg-[#193852] [[data-theme=dark]_&]:text-[#4aa8ee]" aria-hidden="true">✉</span><strong className="mt-3 block text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">No conversations yet</strong><p className="mx-auto mt-[7px] max-w-[300px] text-xs leading-[1.6] text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">When a visitor messages you from your tutor website, it will appear here.</p></div>}
              {!inboxLoading && inbox.map((item) => {
                const active = String(item.conversationId) === String(selectedId);
                const visitor = item.visitorName || "Website visitor";
                const unread = Number(item.unreadCount || 0);
                return (
                  <button key={item.conversationId} type="button" onClick={() => chooseConversation(item)} className={`grid w-full grid-cols-[auto_minmax(0,1fr)] gap-[9px] border-b border-[#dfe9f3] bg-white p-3 text-left text-inherit hover:bg-[#eaf6ff] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a] [[data-theme=dark]_&]:hover:bg-[#193852] ${active ? "bg-[#eaf6ff] [[data-theme=dark]_&]:bg-[#193852]" : ""}`}>
                    <Initial name={visitor}/>
                    <span className="grid min-w-0">
                      <span className="flex min-w-0 items-center justify-between gap-[7px]"><strong className={`overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb] ${unread > 0 ? "font-extrabold" : ""}`}>{visitor}</strong><time className="shrink-0 text-[10px] text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">{shortDate(item.modifiedAt || item.createdAt)}</time></span>
                      <span className="mt-px overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">{item.subject || "General enquiry"}</span>
                      <span className="mt-[5px] line-clamp-1 overflow-hidden text-[11px] leading-[1.45] text-[#566b84] [[data-theme=dark]_&]:text-[#b7c7db]">{item.lastMessage || "No messages"}</span>
                      <span className="mt-[7px] flex items-center justify-between gap-[7px]"><StatusPill status={item.status}/>{unread > 0 && <span className="h-2 w-2 shrink-0 rounded-full bg-[#1875d1] [[data-theme=dark]_&]:bg-[#4aa8ee]" aria-label={`${unread} unread messages`}/>}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-[#dfe9f3] px-[13px] py-[11px] text-xs text-[#8394a9] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:text-[#91a5bf]">
              <span>Page {page} of {maxPages}</span>
              <div className="flex gap-[7px]"><button className="inline-flex h-[34px] w-9 items-center justify-center rounded-lg border border-[#dfe9f3] bg-white text-[#566b84] disabled:cursor-not-allowed disabled:opacity-50 [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a] [[data-theme=dark]_&]:text-[#b7c7db]" type="button" aria-label="Previous page" disabled={page <= 1 || inboxLoading} onClick={() => setPage((value) => Math.max(1, value - 1))}>←</button><button className="inline-flex h-[34px] w-9 items-center justify-center rounded-lg border border-[#dfe9f3] bg-white text-[#566b84] disabled:cursor-not-allowed disabled:opacity-50 [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a] [[data-theme=dark]_&]:text-[#b7c7db]" type="button" aria-label="Next page" disabled={page >= maxPages || inboxLoading} onClick={() => setPage((value) => value + 1)}>→</button></div>
            </div>
          </section>
          <section className="flex min-h-[650px] min-w-0 flex-col overflow-hidden rounded-[14px] border border-[#dfe9f3] bg-white shadow-[0_12px_30px_rgba(32,70,111,0.06)] max-[680px]:min-h-[550px] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a]" aria-label="Selected conversation">
            {!selectedId && !inboxLoading && <div className="flex flex-1 flex-col items-center justify-center px-5 py-[38px] text-center text-[13px] text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]"><span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#eaf6ff] text-xl text-[#1875d1] [[data-theme=dark]_&]:bg-[#193852] [[data-theme=dark]_&]:text-[#4aa8ee]" aria-hidden="true">✉</span><h2 className="mt-[14px] text-[17px] text-[#172b46] [[data-theme=dark]_&]:text-[#e8f0fb]">Select a conversation</h2><p className="mx-auto mt-[7px] max-w-[300px] text-xs leading-[1.6] text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">Choose a visitor on the left to read their message and reply.</p></div>}
            {selectedId && <>
              <header className="flex items-center justify-between gap-[15px] border-b border-[#dfe9f3] px-[18px] py-4 max-[850px]:flex-col max-[850px]:items-start max-[520px]:p-[14px] [[data-theme=dark]_&]:border-[#30465f]">
                <div className="flex min-w-0 items-center gap-[13px]">
                  <Initial name={thread?.visitorName || currentInboxItem?.visitorName}/>
                  <div className="min-w-0"><h2 className="mb-[3px] overflow-hidden text-ellipsis whitespace-nowrap text-[17px]">{thread?.visitorName || currentInboxItem?.visitorName || "Website visitor"}</h2><p className="block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">{thread?.visitorEmail || currentInboxItem?.visitorEmail || "No email provided"}</p>{(thread?.subject || currentInboxItem?.subject) && <span className="mt-[3px] block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[#0c5fb7] [[data-theme=dark]_&]:text-[#8bcdf7]">{thread?.subject || currentInboxItem?.subject}</span>}</div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-[6px] max-[850px]:justify-start">
                  <StatusPill status={thread?.status || currentInboxItem?.status}/>
                  <button type="button" className="inline-flex h-[34px] w-9 min-h-[34px] items-center justify-center rounded-lg border border-[#dfe9f3] bg-white text-[#566b84] hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-50 [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a] [[data-theme=dark]_&]:text-[#b7c7db] [[data-theme=dark]_&]:hover:bg-[#1b2d44]" onClick={() => loadThread(selectedId)} disabled={threadLoading} aria-label="Refresh conversation">↻</button>
                  <button type="button" className="inline-flex h-9 min-h-9 w-9 items-center justify-center rounded-[9px] border border-[#dfe9f3] bg-white text-[#566b84] hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-50 [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a] [[data-theme=dark]_&]:text-[#b7c7db] [[data-theme=dark]_&]:hover:bg-[#1b2d44]" onClick={markRead} disabled={actionLoading} aria-label="Mark conversation as read" title="Mark as read">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v14H4z"/><path d="m4 7 8 6 8-6"/><path d="m9 16 2 2 4-4"/></svg>
                  </button>
                  <button type="button" className="inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[#dfe9f3] bg-white px-[10px] py-[7px] text-[11px] font-semibold text-[#b93849] hover:bg-[#fff2f3] disabled:cursor-not-allowed disabled:opacity-50 max-[520px]:px-[9px] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a] [[data-theme=dark]_&]:text-[#ff9aa4] [[data-theme=dark]_&]:hover:bg-[#45232d]" onClick={deleteConversation} disabled={actionLoading}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6m4-6v6"/><path d="m5 7 1 14h12l1-14M9 7V4h6v3"/></svg>
                    Delete
                  </button>
                </div>
              </header>
              <div className="flex items-center gap-2 border-b border-[#dfe9f3] px-5 py-[13px] text-xs text-[#8394a9] max-[520px]:flex-wrap max-[520px]:p-3 [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:text-[#91a5bf]"><span>Status</span>{validStatuses.map((value) => {
                const active = (thread?.status || currentInboxItem?.status) === value;
                return <button key={value} type="button" disabled={actionLoading || active} onClick={() => updateStatus(value)} className={`rounded-lg border px-3 py-[7px] text-[11px] font-semibold capitalize disabled:cursor-default ${active ? "border-tf-blue bg-tf-sky text-tf-blue-pressed [[data-theme=dark]_&]:border-tf-blue [[data-theme=dark]_&]:bg-tf-sky [[data-theme=dark]_&]:text-tf-blue" : "border-[#dfe9f3] bg-[#f8fbff] text-[#566b84] hover:bg-[#eaf6ff] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#1b2d44] [[data-theme=dark]_&]:text-[#b7c7db] [[data-theme=dark]_&]:hover:bg-[#193852]"}`}>{value}</button>;
              })}</div>
              <div className="flex min-h-[320px] flex-1 flex-col gap-[15px] overflow-auto bg-[#f8fbff] px-[25px] py-[22px] max-[520px]:min-h-[210px] max-[520px]:p-4 [[data-theme=dark]_&]:bg-[#1b2d44]" aria-live="polite">
                {threadError && <ErrorNotice>{threadError}</ErrorNotice>}
                {threadLoading && !thread && <div className="px-5 py-[38px] text-center text-[13px] text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">Loading conversation…</div>}
                {!threadLoading && thread && (Array.isArray(thread.messages) ? thread.messages : []).map((message, index) => {
                  const tutorMessage = String(message.senderType || "").toLowerCase() === "tutor";
                  return (
                    <div key={message.messageId ?? message.id ?? index} className={`flex w-full min-w-0 ${tutorMessage ? "justify-end" : "justify-start"}`}>
                      <div className={`min-w-0 w-fit max-w-[min(88%,520px)] rounded-[13px_13px_13px_4px] border px-[14px] py-3 max-[520px]:max-w-[94%] ${
                        tutorMessage
                          ? "rounded-[13px_13px_4px_13px] border-[#1875d1] bg-[#1875d1] text-white [[data-theme=dark]_&]:border-[#4aa8ee] [[data-theme=dark]_&]:bg-[#4aa8ee] [[data-theme=dark]_&]:text-[#101b2b]"
                          : "border-[#dfe9f3] bg-white text-[#172b46] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#17263a] [[data-theme=dark]_&]:text-[#e8f0fb]"
                      }`}>
                        <p className="m-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[13px] leading-relaxed text-inherit">{message.content}</p>
                        <span className={`mt-[7px] block text-[10px] ${
                          tutorMessage
                            ? "text-white/80 [[data-theme=dark]_&]:text-[#101b2b]/75"
                            : "text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]"
                        }`}>{tutorMessage ? "You" : thread.visitorName || "Visitor"} · {formatDate(message.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
                {!threadLoading && thread && !(thread.messages || []).length && <p className="m-auto text-center text-[13px] text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">No messages in this conversation yet.</p>}
                <div ref={messagesEndRef}/>
              </div>
              <form onSubmit={sendReply} className="border-t border-[#dfe9f3] px-5 pb-[18px] pt-4 max-[520px]:p-[14px] [[data-theme=dark]_&]:border-[#30465f]">
                <label className="mb-2 block text-xs font-semibold text-[#566b84] [[data-theme=dark]_&]:text-[#b7c7db]" htmlFor="reply-message">Your reply</label>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-[10px] max-[520px]:grid-cols-1">
                  <textarea className="min-h-[82px] w-full resize-y rounded-[10px] border border-[#dfe9f3] bg-[#f8fbff] px-[13px] py-3 text-[13px] text-[#172b46] outline-none focus:border-[#1875d1] focus:ring-[3px] focus:ring-blue-500/10 placeholder:text-[#8394a9] disabled:cursor-not-allowed disabled:opacity-[0.65] [[data-theme=dark]_&]:border-[#30465f] [[data-theme=dark]_&]:bg-[#1b2d44] [[data-theme=dark]_&]:text-[#e8f0fb] [[data-theme=dark]_&]:placeholder:text-[#91a5bf]" id="reply-message" value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} maxLength={5000} placeholder={(thread?.status || currentInboxItem?.status) === "closed" ? "Reopen this conversation to reply" : "Write a helpful reply…"} disabled={sending || threadLoading || (thread?.status || currentInboxItem?.status) === "closed"}/>
                  <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[#1875d1] bg-[#1875d1] px-[18px] py-[9px] text-[13px] font-semibold text-[#ffffff] hover:border-[#0c5fb7] hover:bg-[#0c5fb7] disabled:cursor-not-allowed disabled:opacity-50 max-[520px]:justify-self-end [[data-theme=dark]_&]:border-[#4aa8ee] [[data-theme=dark]_&]:bg-[#4aa8ee] [[data-theme=dark]_&]:text-[#101b2b] [[data-theme=dark]_&]:hover:border-[#8bcdf7] [[data-theme=dark]_&]:hover:bg-[#8bcdf7]" disabled={!draft.trim() || sending || threadLoading || (thread?.status || currentInboxItem?.status) === "closed"}>{sending ? "Sending…" : "Send"}</button>
                </div>
                <p className="mt-2 text-[10px] text-[#8394a9] [[data-theme=dark]_&]:text-[#91a5bf]">Messages are saved to this conversation. Visitors can continue the chat using their private conversation token in their browser.</p>
              </form>
            </>}
          </section>
        </div>
      </main>
      {notice && <div className="fixed bottom-5 left-1/2 z-20 max-w-[calc(100vw-28px)] -translate-x-1/2 rounded-[9px] bg-[#172b46] px-[15px] py-[10px] text-center text-[13px] text-[#ffffff] shadow-[0_8px_24px_rgba(17,44,75,0.2)] [[data-theme=dark]_&]:bg-[#e8f0fb] [[data-theme=dark]_&]:text-[#101b2b]" role="status">{notice}</div>}
    </div>
  );
}

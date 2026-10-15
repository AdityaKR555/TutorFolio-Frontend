import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";

const panel = "rounded-2xl border border-blue-500/10 bg-[#0f1f36]";
const field = "w-full rounded-xl border border-blue-500/15 bg-[#0a1628] px-3.5 py-3 text-sm text-white outline-none placeholder:text-[#617391] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10";
const button = "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50";
const subtleButton = "inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/15 bg-[#0a1628] px-3 py-2 text-sm font-medium text-[#c7d8f5] transition hover:border-blue-400/30 hover:bg-blue-500/10 disabled:opacity-50";
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
  return <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-500/15 bg-blue-500/10 font-bold text-blue-200">{(name || "V").trim().charAt(0).toUpperCase()}</div>;
}
function StatusPill({ status }) {
  const cls = status === "open" ? "bg-emerald-500/10 text-emerald-300" : status === "closed" ? "bg-slate-500/15 text-slate-300" : "bg-amber-500/10 text-amber-200";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${cls}`}>{status || "open"}</span>;
}
function ErrorNotice({ children }) {
  if (!children) return null;
  return <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">{children}</div>;
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
    <div className="min-h-screen bg-[#0a1628] p-4 text-white sm:p-7">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-sm text-[#94a8c7]">Stay connected</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">Conversations</h1><p className="mt-2 text-sm text-[#8197b8]">Manage student enquiries and reply to visitors who contact your public tutor website.</p></div>
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-xl border border-blue-500/15 bg-[#0f1f36] px-3 py-2 text-sm text-[#c7d8f5]">{total} conversations</span><span className="rounded-xl border border-blue-500/15 bg-[#0f1f36] px-3 py-2 text-sm text-[#c7d8f5]">{unreadCount} unread</span><button type="button" onClick={() => { loadInbox(); loadUnreadCount(); if (selectedId) loadThread(selectedId, true); }} className={subtleButton}>↻ Refresh</button></div>
        </div>
        <ErrorNotice>{error}</ErrorNotice>
        <div className="mt-4 grid min-h-[650px] grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className={`${panel} flex min-h-[420px] flex-col overflow-hidden`}>
            <div className="border-b border-blue-500/10 p-4">
              <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Inbox</h2><span className="text-xs text-[#8197b8]">{filteredUnread} unread here</span></div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
                {[{ value: "all", label: "All" }, { value: "open", label: "Open" }, { value: "closed", label: "Closed" }, { value: "archived", label: "Archived" }].map((option) => <button key={option.value} type="button" onClick={() => { setStatusFilter(option.value); setPage(1); }} className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${statusFilter === option.value ? "bg-blue-600 text-white" : "border border-blue-500/10 bg-[#0a1628] text-[#94a8c7] hover:text-white"}`}>{option.label}</button>)}
              </div>
            </div>
            <div className="flex-1 divide-y divide-blue-500/10">
              {inboxLoading && <div className="p-8 text-center text-sm text-[#94a8c7]"><span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-400 align-middle"/> <span className="ml-2">Loading inbox…</span></div>}
              {!inboxLoading && !inbox.length && <div className="px-5 py-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-xl">✉</div><p className="mt-3 font-semibold text-[#c7d8f5]">No conversations yet</p><p className="mt-2 text-sm leading-6 text-[#8197b8]">When a visitor sends a message from your tutor website, the conversation will show up here.</p></div>}
              {!inboxLoading && inbox.map((item) => {
                const active = String(item.conversationId) === String(selectedId);
                const visitor = item.visitorName || "Website visitor";
                return <button key={item.conversationId} type="button" onClick={() => chooseConversation(item)} className={`w-full p-4 text-left transition hover:bg-blue-500/5 ${active ? "bg-blue-500/10" : ""}`}>
                  <div className="flex items-start gap-3"><Initial name={visitor}/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-semibold text-white">{visitor}</p><span className="shrink-0 text-[11px] text-[#617391]">{shortDate(item.modifiedAt || item.createdAt)}</span></div><p className="mt-1 truncate text-xs text-[#8197b8]">{item.subject || "General enquiry"}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-[#a8bbd7]">{item.lastMessage || "No messages"}</p><div className="mt-3 flex items-center justify-between gap-2"><StatusPill status={item.status}/>{Number(item.unreadCount || 0) > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">{item.unreadCount}</span>}</div></div></div>
                </button>;
              })}
            </div>
            <div className="flex items-center justify-between border-t border-blue-500/10 p-3"><p className="text-xs text-[#8197b8]">Page {page} of {maxPages}</p><div className="flex gap-2"><button type="button" disabled={page <= 1 || inboxLoading} onClick={() => setPage((value) => Math.max(1, value - 1))} className={subtleButton}>←</button><button type="button" disabled={page >= maxPages || inboxLoading} onClick={() => setPage((value) => value + 1)} className={subtleButton}>→</button></div></div>
          </section>

          <section className={`${panel} flex min-h-[650px] flex-col overflow-hidden`}>
            {!selectedId && !inboxLoading && <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-3xl">💬</div><h2 className="mt-4 text-lg font-semibold">Select a conversation</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[#8197b8]">Choose a visitor on the left to read their message and reply.</p></div>}
            {selectedId && <>
              <div className="flex flex-col gap-4 border-b border-blue-500/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="flex min-w-0 items-center gap-3"><Initial name={thread?.visitorName || currentInboxItem?.visitorName}/><div className="min-w-0"><h2 className="truncate font-semibold">{thread?.visitorName || currentInboxItem?.visitorName || "Website visitor"}</h2><p className="mt-1 break-all text-xs text-[#8197b8]">{thread?.visitorEmail || currentInboxItem?.visitorEmail || "No email provided"}</p>{(thread?.subject || currentInboxItem?.subject) && <p className="mt-1 truncate text-xs text-blue-200">{thread?.subject || currentInboxItem?.subject}</p>}</div></div><div className="flex flex-wrap items-center gap-2"><StatusPill status={thread?.status || currentInboxItem?.status}/><button type="button" onClick={() => loadThread(selectedId)} disabled={threadLoading} className={subtleButton}>↻</button><button type="button" onClick={markRead} disabled={actionLoading} className={subtleButton}>Mark read</button><button type="button" onClick={deleteConversation} disabled={actionLoading} className="inline-flex items-center justify-center rounded-xl border border-red-500/20 px-3 py-2 text-sm font-medium text-red-200 hover:bg-red-500/10 disabled:opacity-50" title="Delete conversation">Delete</button></div></div>
              <div className="flex flex-wrap items-center gap-2 border-b border-blue-500/10 px-4 py-3 sm:px-5"><span className="mr-1 text-xs text-[#8197b8]">Status</span>{validStatuses.map((value) => <button key={value} type="button" disabled={actionLoading || (thread?.status || currentInboxItem?.status) === value} onClick={() => updateStatus(value)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${(thread?.status || currentInboxItem?.status) === value ? "bg-blue-600/20 text-blue-200" : "border border-blue-500/10 bg-[#0a1628] text-[#94a8c7] hover:text-white"}`}>{value}</button>)}</div>
              <div className="flex-1 space-y-4 overflow-y-auto bg-[#0a1628]/40 p-4 sm:p-6">
                <ErrorNotice>{threadError}</ErrorNotice>
                {notice && <p className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-2.5 text-sm text-emerald-200">{notice}</p>}
                {threadLoading && !thread && <div className="py-12 text-center text-sm text-[#94a8c7]">Loading conversation…</div>}
                {!threadLoading && thread && (Array.isArray(thread.messages) ? thread.messages : []).map((message, index) => {
                  const tutorMessage = String(message.senderType || "").toLowerCase() === "tutor";
                  return <div key={message.messageId ?? message.id ?? index} className={`flex ${tutorMessage ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[76%] ${tutorMessage ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md border border-blue-500/10 bg-[#0f1f36] text-[#e2eaf7]"}`}><p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p><p className={`mt-2 text-[10px] ${tutorMessage ? "text-blue-100/70" : "text-[#8197b8]"}`}>{tutorMessage ? "You" : thread.visitorName || "Visitor"} · {formatDate(message.createdAt)}</p></div></div>;
                })}
                {!threadLoading && thread && !(thread.messages || []).length && <p className="py-10 text-center text-sm text-[#8197b8]">No messages in this conversation yet.</p>}
                <div ref={messagesEndRef}/>
              </div>
              <form onSubmit={sendReply} className="border-t border-blue-500/10 bg-[#0f1f36] p-4 sm:p-5"><label htmlFor="reply-message" className="mb-2 block text-xs font-medium text-[#94a8c7]">Your reply</label><div className="flex items-end gap-2"><textarea id="reply-message" value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} maxLength={5000} placeholder={(thread?.status || currentInboxItem?.status) === "closed" ? "Reopen this conversation to reply" : "Write a helpful reply…"} disabled={sending || threadLoading || (thread?.status || currentInboxItem?.status) === "closed"} className={`${field} min-h-[54px] resize-y`}/><button type="submit" disabled={!draft.trim() || sending || threadLoading || (thread?.status || currentInboxItem?.status) === "closed"} className={`${button} min-h-[50px]`}>{sending ? "Sending…" : "Send"}</button></div><p className="mt-2 text-[11px] text-[#617391]">Messages are saved to this conversation. Visitors can continue the chat using their private conversation token in their browser.</p></form>
            </>}
          </section>
        </div>
      </div>
    </div>
  );
}

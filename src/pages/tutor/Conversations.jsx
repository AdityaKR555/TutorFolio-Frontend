import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import "./Conversations.css";
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
  return <div className="conversation-avatar">{(name || "V").trim().charAt(0).toUpperCase()}</div>;
}
function StatusPill({ status }) {
  return <span className={`conversation-status ${status || "open"}`}>{status || "open"}</span>;
}
function ErrorNotice({ children }) {
  if (!children) return null;
  return <div role="alert" className="conversation-error">{children}</div>;
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
    <div className="conversations-page">
      <main className="conversations-content">
        <header className="conversations-heading">
          <div><h1>Conversations</h1><p>Manage student enquiries and reply to visitors who contact your public tutor website.</p></div>
          <div className="conversations-stats">
            <div className="conversation-stat"><strong>{total}</strong> conversations</div>
            <div className="conversation-stat"><strong>{unreadCount}</strong> unread</div>
            <button type="button" className="conversation-button" onClick={() => { loadInbox(); loadUnreadCount(); if (selectedId) loadThread(selectedId, true); }} disabled={inboxLoading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 9a7 7 0 0 1 12-2L20 12M4 12l2.5 5a7 7 0 0 0 12-2" strokeLinecap="round" strokeLinejoin="round"/></svg>Refresh
            </button>
          </div>
        </header>
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <div className="conversation-workspace">
          <section className="conversation-inbox" aria-label="Inbox">
            <div className="conversation-inbox-head">
              <div className="conversation-inbox-title"><h2>Inbox</h2><span>{filteredUnread} unread here</span></div>
              <div className="conversation-tabs" role="tablist" aria-label="Filter conversations">
                {[{ value: "all", label: "All" }, { value: "open", label: "Open" }, { value: "closed", label: "Closed" }, { value: "archived", label: "Archived" }].map((option) => (
                  <button key={option.value} type="button" role="tab" aria-selected={statusFilter === option.value} onClick={() => { setStatusFilter(option.value); setPage(1); }} className={`conversation-tab ${statusFilter === option.value ? "active" : ""}`}>{option.label}</button>
                ))}
              </div>
            </div>
            <div className="conversation-list">
              {inboxLoading && <div className="conversation-empty"><span className="conversation-spinner" aria-hidden="true"/><p>Loading inbox…</p></div>}
              {!inboxLoading && !inbox.length && <div className="conversation-empty"><span aria-hidden="true">✉</span><strong>No conversations yet</strong><p>When a visitor messages you from your tutor website, it will appear here.</p></div>}
              {!inboxLoading && inbox.map((item) => {
                const active = String(item.conversationId) === String(selectedId);
                const visitor = item.visitorName || "Website visitor";
                const unread = Number(item.unreadCount || 0);
                return (
                  <button key={item.conversationId} type="button" onClick={() => chooseConversation(item)} className={`conversation-row ${active ? "selected" : ""} ${unread > 0 ? "unread" : ""}`}>
                    <Initial name={visitor}/>
                    <span className="conversation-row-body">
                      <span className="conversation-row-head"><strong>{visitor}</strong><time>{shortDate(item.modifiedAt || item.createdAt)}</time></span>
                      <span className="conversation-subject">{item.subject || "General enquiry"}</span>
                      <span className="conversation-preview">{item.lastMessage || "No messages"}</span>
                      <span className="conversation-row-meta"><StatusPill status={item.status}/>{unread > 0 && <span className="conversation-unread-dot" aria-label={`${unread} unread messages`}/>}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="conversation-pagination">
              <span>Page {page} of {maxPages}</span>
              <div><button type="button" aria-label="Previous page" disabled={page <= 1 || inboxLoading} onClick={() => setPage((value) => Math.max(1, value - 1))}>←</button><button type="button" aria-label="Next page" disabled={page >= maxPages || inboxLoading} onClick={() => setPage((value) => value + 1)}>→</button></div>
            </div>
          </section>
          <section className="conversation-detail" aria-label="Selected conversation">
            {!selectedId && !inboxLoading && <div className="conversation-no-selection"><span aria-hidden="true">✉</span><h2>Select a conversation</h2><p>Choose a visitor on the left to read their message and reply.</p></div>}
            {selectedId && <>
              <header className="conversation-detail-head">
                <div className="conversation-person">
                  <Initial name={thread?.visitorName || currentInboxItem?.visitorName}/>
                  <div><h2>{thread?.visitorName || currentInboxItem?.visitorName || "Website visitor"}</h2><p>{thread?.visitorEmail || currentInboxItem?.visitorEmail || "No email provided"}</p>{(thread?.subject || currentInboxItem?.subject) && <span>{thread?.subject || currentInboxItem?.subject}</span>}</div>
                </div>
                <div className="conversation-detail-actions">
                  <StatusPill status={thread?.status || currentInboxItem?.status}/>
                  <button type="button" className="conversation-icon-button" onClick={() => loadThread(selectedId)} disabled={threadLoading} aria-label="Refresh conversation">↻</button>
                  <button type="button" className="conversation-button" onClick={markRead} disabled={actionLoading}>Mark read</button>
                  <button type="button" className="conversation-button danger" onClick={deleteConversation} disabled={actionLoading}>Delete</button>
                </div>
              </header>
              <div className="conversation-status-controls"><span>Status</span>{validStatuses.map((value) => <button key={value} type="button" disabled={actionLoading || (thread?.status || currentInboxItem?.status) === value} onClick={() => updateStatus(value)} className={`conversation-status-button ${(thread?.status || currentInboxItem?.status) === value ? "active" : ""}`}>{value}</button>)}</div>
              <div className="conversation-messages" aria-live="polite">
                {threadError && <ErrorNotice>{threadError}</ErrorNotice>}
                {threadLoading && !thread && <div className="conversation-empty">Loading conversation…</div>}
                {!threadLoading && thread && (Array.isArray(thread.messages) ? thread.messages : []).map((message, index) => {
                  const tutorMessage = String(message.senderType || "").toLowerCase() === "tutor";
                  return <div key={message.messageId ?? message.id ?? index} className={`conversation-message ${tutorMessage ? "mine" : ""}`}><p>{message.content}</p><span>{tutorMessage ? "You" : thread.visitorName || "Visitor"} · {formatDate(message.createdAt)}</span></div>;
                })}
                {!threadLoading && thread && !(thread.messages || []).length && <p className="conversation-no-messages">No messages in this conversation yet.</p>}
                <div ref={messagesEndRef}/>
              </div>
              <form onSubmit={sendReply} className="conversation-reply">
                <label htmlFor="reply-message">Your reply</label>
                <div className="conversation-replybox">
                  <textarea id="reply-message" value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} maxLength={5000} placeholder={(thread?.status || currentInboxItem?.status) === "closed" ? "Reopen this conversation to reply" : "Write a helpful reply…"} disabled={sending || threadLoading || (thread?.status || currentInboxItem?.status) === "closed"}/>
                  <button type="submit" className="conversation-button primary" disabled={!draft.trim() || sending || threadLoading || (thread?.status || currentInboxItem?.status) === "closed"}>{sending ? "Sending…" : "Send"}</button>
                </div>
                <p>Messages are saved to this conversation. Visitors can continue the chat using their private conversation token in their browser.</p>
              </form>
            </>}
          </section>
        </div>
      </main>
      {notice && <div className="conversation-toast" role="status">{notice}</div>}
    </div>
  );
}

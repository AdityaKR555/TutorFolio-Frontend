import React, { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";

const field = "w-full rounded-xl border border-blue-500/15 bg-[#0a1628] px-3.5 py-3 text-sm text-white outline-none placeholder:text-[#617391] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10";
const button = "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

function unwrap(response) {
  const body = response?.data ?? response ?? {};
  if (body.status !== undefined && ![200, 201].includes(Number(body.status))) throw new Error(body.message || "The request could not be completed.");
  return { body, data: body.data ?? body.details ?? body };
}
function timeLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

export default function VisitorChatWidget({ tutorId, tutorName = "Tutor", open, onClose }) {
  const storageKey = `tutorfolio:visitor-chat:${tutorId}`;
  const [visitorIdentifier, setVisitorIdentifier] = useState("");
  const [thread, setThread] = useState(null);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const endRef = useRef(null);
  const loadingRef = useRef(false);

  const loadThread = useCallback(async (token, quiet = false) => {
    if (!token || !tutorId || loadingRef.current) return null;
    loadingRef.current = true;
    if (!quiet) setLoadingThread(true);
    try {
      const response = await api.get("/chat/visitor/thread", {
        params: { visitorIdentifier: token }, timeout: 12000,
      });
      const { data } = unwrap(response);
      setThread(data);
      setError("");
      return data;
    } catch (err) {
      const status = err?.response?.status;
      const messageText = err?.response?.data?.message || err.message || "Unable to load the conversation.";
      if (status === 404 || /conversation not found/i.test(messageText)) {
        localStorage.removeItem(storageKey);
        setVisitorIdentifier("");
        setThread(null);
      } else if (!quiet) {
        setError(messageText);
      }
      return null;
    } finally {
      loadingRef.current = false;
      if (!quiet) setLoadingThread(false);
    }
  }, [tutorId, storageKey]);

  useEffect(() => {
    if (!open || !tutorId) return;
    setError(""); setSuccess("");
    let token = "";
    try { token = localStorage.getItem(storageKey) || ""; } catch { /* local storage might be disabled */ }
    setVisitorIdentifier(token);
    if (token) loadThread(token);
    else { setThread(null); }
  }, [open, tutorId, storageKey, loadThread]);

  useEffect(() => {
    if (!open || !visitorIdentifier || !tutorId) return undefined;
    const timer = window.setInterval(() => loadThread(visitorIdentifier, true), 12000);
    return () => window.clearInterval(timer);
  }, [open, visitorIdentifier, tutorId, loadThread]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [thread?.messages?.length, open]);

  const startNewConversation = () => {
    try { localStorage.removeItem(storageKey); } catch { /* ignore storage issue */ }
    setVisitorIdentifier(""); setThread(null); setMessage(""); setSubject(""); setError(""); setSuccess("");
  };

  const submit = async (event) => {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage || sending || !tutorId) return;
    if (!visitorIdentifier && !visitorName.trim()) { setError("Please enter your name."); return; }
    setSending(true); setError(""); setSuccess("");
    try {
      if (visitorIdentifier) {
        const response = await api.post("/chat/visitor/message", {
          visitorIdentifier, message: cleanMessage,
        }, { timeout: 15000 });
        unwrap(response);
      } else {
        const response = await api.post("/chat/visitor/start", {
          tutorId: Number(tutorId),
          visitorName: visitorName.trim(),
          visitorEmail: visitorEmail.trim() || null,
          subject: subject.trim() || null,
          message: cleanMessage,
        }, { timeout: 15000 });
        const { data } = unwrap(response);
        if (!data?.visitorIdentifier) throw new Error("The conversation started, but no visitor token was returned. Please refresh and check before sending again.");
        localStorage.setItem(storageKey, data.visitorIdentifier);
        setVisitorIdentifier(data.visitorIdentifier);
      }
      setMessage("");
      setSuccess("Message sent. Replies will appear here while this browser keeps your conversation token.");
      const token = visitorIdentifier || localStorage.getItem(storageKey);
      if (token) await loadThread(token, true);
      window.dispatchEvent(new CustomEvent("tutorfolio-chat-updated"));
      window.dispatchEvent(new CustomEvent("tutorfolio-notifications-updated"));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to send your message. Please try again.");
    } finally { setSending(false); }
  };

  if (!open) return null;
  const isClosed = String(thread?.status || "").toLowerCase() === "closed";
  const messages = Array.isArray(thread?.messages) ? thread.messages : [];

  return <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={`Contact ${tutorName}`}>
    <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-blue-500/20 bg-[#0f1f36] shadow-2xl shadow-black/50 sm:rounded-3xl">
      <div className="flex items-center justify-between gap-4 border-b border-blue-500/10 p-4 sm:p-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">TutorFolio messages</p><h2 className="mt-1 text-lg font-bold text-white">Contact {tutorName}</h2><p className="mt-1 text-xs text-[#8197b8]">Send an enquiry directly to this tutor.</p></div><button type="button" onClick={onClose} aria-label="Close chat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/15 text-lg text-[#c7d8f5] hover:bg-blue-500/10">×</button></div>
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#0a1628]/50 p-4 sm:p-5">
        {!visitorIdentifier && <div className="rounded-xl border border-blue-500/10 bg-[#0f1f36] p-3 text-xs leading-5 text-[#94a8c7]">Your conversation token is saved only in this browser. Keep using the same browser to read replies and continue the chat.</div>}
        {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-200">{error}</p>}
        {success && <p role="status" className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2.5 text-xs leading-5 text-emerald-200">{success}</p>}
        {visitorIdentifier && loadingThread && !thread && <p className="py-8 text-center text-sm text-[#94a8c7]">Loading your conversation…</p>}
        {visitorIdentifier && thread && <><div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs text-[#8197b8]">{thread.subject || "Conversation"}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${isClosed ? "bg-slate-500/15 text-slate-300" : "bg-emerald-500/10 text-emerald-300"}`}>{thread.status || "open"}</span></div>{messages.map((item, index) => {
          const tutorMessage = String(item.senderType || "").toLowerCase() === "tutor";
          return <div key={item.messageId ?? item.id ?? index} className={`flex ${tutorMessage ? "justify-start" : "justify-end"}`}><div className={`max-w-[88%] rounded-2xl px-3.5 py-3 ${tutorMessage ? "rounded-bl-md border border-blue-500/10 bg-[#0f1f36] text-[#e2eaf7]" : "rounded-br-md bg-blue-600 text-white"}`}><p className="whitespace-pre-wrap break-words text-sm leading-6">{item.content}</p><p className={`mt-1.5 text-[10px] ${tutorMessage ? "text-[#8197b8]" : "text-blue-100/70"}`}>{tutorMessage ? tutorName : "You"} · {timeLabel(item.createdAt)}</p></div></div>;
        })}<div ref={endRef}/></>}
        {isClosed && <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3 text-sm text-amber-100">This conversation is closed, so you cannot send another message in this thread.</div>}
      </div>
      {isClosed ? <div className="flex flex-col gap-3 border-t border-blue-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-[#8197b8]">Start a new conversation to contact the tutor again.</p><button type="button" onClick={startNewConversation} className={button}>Start new conversation</button></div> : <form onSubmit={submit} className="border-t border-blue-500/10 p-4 sm:p-5">
        {!visitorIdentifier && <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2"><div><label className="mb-1.5 block text-xs text-[#94a8c7]">Your name <span className="text-red-300">*</span></label><input value={visitorName} onChange={(event) => setVisitorName(event.target.value)} required maxLength={200} className={field} placeholder="Enter your name"/></div><div><label className="mb-1.5 block text-xs text-[#94a8c7]">Email (optional)</label><input type="email" value={visitorEmail} onChange={(event) => setVisitorEmail(event.target.value)} maxLength={254} className={field} placeholder="you@example.com"/></div><div className="sm:col-span-2"><label className="mb-1.5 block text-xs text-[#94a8c7]">Subject (optional)</label><input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={500} className={field} placeholder="e.g. Maths tuition for Class 10"/></div></div>}
        <label className="mb-1.5 block text-xs font-medium text-[#94a8c7]">Message</label><div className="flex items-end gap-2"><textarea value={message} onChange={(event) => setMessage(event.target.value)} required rows={2} maxLength={5000} className={`${field} min-h-[54px] resize-y`} placeholder="Write your message…"/><button type="submit" disabled={!message.trim() || sending || !tutorId} className={`${button} min-h-[50px]`}>{sending ? "Sending…" : visitorIdentifier ? "Send" : "Start chat"}</button></div>
      </form>}
      <div className="border-t border-blue-500/10 px-4 py-2 text-center text-[10px] text-[#617391]">Please avoid sharing passwords, payment details or other sensitive information.</div>
    </div>
  </div>;
}

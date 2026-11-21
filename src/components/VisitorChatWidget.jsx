import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import api from "../api/axios";
import ExpandableText from "./ExpandableText";
import "./visitor-chat.css";

const field = "vc-field w-full rounded-xl border vc-line vc-bg px-3.5 py-3 text-sm vc-ink outline-none";
const button = "vc-button inline-flex items-center justify-center gap-2 rounded-xl vc-accent-bg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50";

const CHAT_THEMES = {
  classic: "classic", theme_classic: "classic",
  minimal: "minimal", theme_minimal: "minimal", theme_modern: "minimal",
  luminary_elite: "luminary", theme_3: "luminary", theme3: "luminary", elite: "luminary", elite_academy: "luminary", vibrant_slate: "luminary", bold_educator: "luminary", theme_bold: "luminary",
  aurora: "aurora", theme4: "aurora",
  theme5: "motion", motion_studio: "motion",
  glass: "glass", theme_glass: "glass", theme6: "glass", theme_6: "glass",
};

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

export default function VisitorChatWidget({ tutorId, tutorName = "Tutor", open, onClose, theme = "classic", preview = false }) {
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
  const formId = useId();
  const dialogRef = useRef(null);
  const modalRef = useRef(null);
  const endRef = useRef(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const previousScroll = { left: window.scrollX, top: window.scrollY };
    const modal = modalRef.current;
    if (modal && !modal.open) modal.showModal();
    document.body.style.overflow = "hidden";
    const panel = dialogRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') || []).filter((element) => element.getClientRects().length);
    const firstInput = panel?.querySelector("input, textarea");
    (firstInput || focusable()[0] || panel)?.focus({ preventScroll: true });
    window.scrollTo({ left: 0, top: 0, behavior: "instant" });
    const onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (!first) { event.preventDefault(); panel?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !panel?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panel?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      modal?.close();
      document.body.style.overflow = previousOverflow;
      window.scrollTo({ ...previousScroll, behavior: "instant" });
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open, onClose]);

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
    if (preview) { setVisitorIdentifier(""); setThread(null); return; }
    let token = "";
    try { token = localStorage.getItem(storageKey) || ""; } catch { /* local storage might be disabled */ }
    setVisitorIdentifier(token);
    if (token) loadThread(token);
    else { setThread(null); }
  }, [open, tutorId, storageKey, loadThread, preview]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [thread?.messages?.length, open]);

  const startNewConversation = () => {
    try { localStorage.removeItem(storageKey); } catch { /* ignore storage issue */ }
    setVisitorIdentifier(""); setThread(null); setMessage(""); setSubject(""); setError(""); setSuccess("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (preview) return;
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
      setSuccess("Message sent. Keep using this browser to read replies and continue the conversation.");
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

  return <dialog ref={modalRef} onCancel={(event) => { event.preventDefault(); onClose(); }} data-chat-theme={CHAT_THEMES[String(theme).trim().toLowerCase()] || "classic"} className="visitor-chat fixed inset-0 z-[120] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby={`${formId}-title`} aria-describedby={`${formId}-description`} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialogRef} tabIndex={-1} className={`vc-panel ${!visitorIdentifier ? "vc-start" : ""} flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border vc-line vc-surface shadow-2xl shadow-black/20 dark:shadow-black/50 sm:rounded-3xl`}>
      <div className="vc-header flex items-start justify-between gap-4 border-b vc-line p-4 sm:p-5"><div><h2 id={`${formId}-title`} className="vc-title font-bold vc-ink">Contact {tutorName}</h2><p id={`${formId}-description`} className="vc-subtitle vc-copy">Send an enquiry directly to this tutor.</p><p className="vc-browser-note vc-muted">Use this browser to continue your conversation.</p>{preview && <p className="vc-preview-note vc-muted">Preview only. Messages won’t be sent.</p>}</div><button type="button" onClick={onClose} aria-label="Close chat" className="vc-close flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border vc-line text-lg vc-copy">×</button></div>
      {(visitorIdentifier || error || success || isClosed) && <div className="vc-history flex-1 space-y-3 overflow-y-auto vc-bg p-4 sm:p-5">
        {error && <p role="alert" className="vc-error rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-200">{error}</p>}
        {success && <p role="status" className="vc-success rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-800 dark:border-emerald-500/15 dark:bg-emerald-500/5 dark:text-emerald-200">{success}</p>}
        {visitorIdentifier && loadingThread && !thread && <p className="py-8 text-center text-sm vc-copy">Loading your conversation…</p>}
        {visitorIdentifier && thread && <><div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs vc-muted">{thread.subject || "Conversation"}</p><span className={`vc-status rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${isClosed ? "bg-slate-200 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>{thread.status || "open"}</span></div>{messages.map((item, index) => {
          const tutorMessage = String(item.senderType || "").toLowerCase() === "tutor";
          return <div key={item.messageId ?? item.id ?? index} className={`flex ${tutorMessage ? "justify-start" : "justify-end"}`}><div className={`vc-bubble max-w-[88%] rounded-2xl px-3.5 py-3 ${tutorMessage ? "vc-received rounded-bl-md border vc-line vc-surface vc-ink" : "vc-sent rounded-br-md vc-accent-bg"}`}><ExpandableText lines={5} className="text-sm leading-6" preserveWhitespace>{item.content}</ExpandableText><p className={`mt-1.5 text-[10px] ${tutorMessage ? "vc-muted" : "vc-sent-meta"}`}>{tutorMessage ? tutorName : "You"} · {timeLabel(item.createdAt)}</p></div></div>;
        })}<div ref={endRef}/></>}
        {isClosed && <div className="vc-notice rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/15 dark:bg-amber-500/5 dark:text-amber-100">This conversation is closed, so you cannot send another message in this thread.</div>}
      </div>}
      {isClosed ? <div className="flex flex-col gap-3 border-t vc-line p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 vc-copy">Start a new conversation to contact the tutor again.</p><button type="button" onClick={startNewConversation} className={button}>Start new conversation</button></div> : <form onSubmit={submit} className="vc-compose border-t vc-line p-4 sm:p-5">
        {!visitorIdentifier && <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2"><div><label htmlFor={`${formId}-name`} className="mb-1.5 block text-xs vc-copy">Your name <span className="vc-required">*</span></label><input id={`${formId}-name`} autoComplete="name" value={visitorName} onChange={(event) => setVisitorName(event.target.value)} required maxLength={200} className={field} placeholder="Enter your name"/></div><div><label htmlFor={`${formId}-email`} className="mb-1.5 block text-xs vc-copy">Email (optional)</label><input id={`${formId}-email`} type="email" autoComplete="email" value={visitorEmail} onChange={(event) => setVisitorEmail(event.target.value)} maxLength={254} className={field} placeholder="you@example.com"/></div><div className="sm:col-span-2"><label htmlFor={`${formId}-subject`} className="mb-1.5 block text-xs vc-copy">Subject (optional)</label><input id={`${formId}-subject`} value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={500} className={field} placeholder="e.g. Maths tuition for Class 10"/></div></div>}
        <label htmlFor={`${formId}-message`} className="mb-1.5 block text-xs font-medium vc-copy">Message <span className="vc-required">*</span></label>
        <textarea id={`${formId}-message`} value={message} onChange={(event) => setMessage(event.target.value)} required rows={visitorIdentifier ? 3 : 5} maxLength={5000} className={`${field} vc-message resize-y`} placeholder="Write your message…"/>
        <div className="vc-actions flex justify-end"><button type="submit" disabled={preview || !message.trim() || sending || !tutorId} className={`${button} min-h-[50px]`}>{sending ? "Sending…" : visitorIdentifier ? "Send" : "Start chat"}</button></div>
      </form>}
      <div className="vc-footer border-t vc-line vc-muted">Please avoid sharing sensitive information.</div>
    </div>
  </dialog>;
}

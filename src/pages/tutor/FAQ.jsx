import KpiState from "../../components/KpiState";
import React, { useCallback, useEffect, useState } from "react";
import FaqSummaryArt from "./FaqSummaryArt";
import { Plus, Search, Pencil, Trash2, MessageCircleQuestion, Globe, CheckCircle2, X } from "lucide-react";
import api from "../../api/axios";
import ExpandableText from "../../components/ExpandableText";
import { getStoredUser } from "../../utils/auth";

const getUserId = () => {
  const user = getStoredUser();
  return (
    user?.userId ??
    user?.userid ??
    user?.user_id ??
    user?.id ??
    user?.user?.userId ??
    user?.user?.id ??
    null
 );
};

const initialForm = {
  title: "",
  description: "",
  visibleOnWebsite: true,
};

const FAQ = () => {
  const [userId] = useState(getUserId);
  const [faqs, setFaqs] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingFaq, setEditingFaq] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchFaqs = useCallback(async () => {
    if (!userId) {
      setError("Unable to identify your account. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/faqs/getAll/${userId}`);
      const result = response.data;

      if (result?.status !== 200) {
        throw new Error(result?.message || "Failed to load FAQs.");
      }

      setFaqs(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Unable to load FAQs."
     );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const openCreateModal = () => {
    setEditingFaq(null);
    setForm(initialForm);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (faq) => {
    setEditingFaq(faq);
    setForm({
      title: faq.title || "",
      description: faq.description || "",
      visibleOnWebsite: faq.visibleOnWebsite ?? true,
    });
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingFaq(null);
    setForm(initialForm);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setError("User session expired. Please log in again.");
      return;
    }

    const trimmedTitle = form.title.trim();
    const trimmedDescription = form.description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      setError("Question and answer are both required.");
      return;
    }

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (editingFaq) {
        const faqId = editingFaq.faqId ?? editingFaq.faq_id ?? editingFaq.id;

        const payload = {
          title: trimmedTitle,
          description: trimmedDescription,
          visibleOnWebsite: form.visibleOnWebsite,
        };

        const response = await api.put(`/faqs/${faqId}`, payload);
        const result = response.data;

        if (result?.status !== 200) {
          throw new Error(result?.message || "Failed to update FAQ.");
        }

        const updated = result.data || {
          ...editingFaq,
          ...payload,
        };

        setFaqs((prev) =>
          prev.map((item) => {
            const itemId = item.faqId ?? item.faq_id ?? item.id;
            return itemId === faqId ? { ...item, ...updated } : item;
          })
       );

        setSuccess("FAQ updated successfully.");
      } else {
        const payload = {
          userId,
          title: trimmedTitle,
          description: trimmedDescription,
          visibleOnWebsite: form.visibleOnWebsite,
        };

        const response = await api.post("/faqs/new", payload);
        const result = response.data;

        if (result?.status !== 200 && result?.status !== 201) {
          throw new Error(result?.message || "Failed to create FAQ.");
        }

        const created = result.data || {
          faqId: Date.now(),
          ...payload,
        };

        setFaqs((prev) => [created, ...prev]);
        setSuccess("FAQ created successfully.");
      }

      closeModal();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Unable to save FAQ."
     );
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (faq) => {
    const faqId = faq.faqId ?? faq.faq_id ?? faq.id;
    const newVisibility = !faq.visibleOnWebsite;

    setError("");
    setSuccess("");
    setActionId(faqId);

    try {
      const response = await api.patch(
        `/faqs/visibility/${faqId}?visibleOnWebsite=${newVisibility}`
     );

      if (response.data?.status !== 200) {
        throw new Error(response.data?.message || "Failed to update visibility.");
      }

      setFaqs((prev) =>
        prev.map((item) => {
          const itemId = item.faqId ?? item.faq_id ?? item.id;
          return itemId === faqId
            ? { ...item, visibleOnWebsite: newVisibility }
            : item;
        })
     );

      setSuccess(
        newVisibility
          ? "FAQ is now visible on your website."
          : "FAQ is now hidden from your website."
     );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Unable to update visibility."
     );
    } finally {
      setActionId(null);
    }
  };

  const deleteFaq = async (faq) => {
    const faqId = faq.faqId ?? faq.faq_id ?? faq.id;

    const confirmed = window.confirm(
      "Are you sure you want to delete this FAQ? This action cannot be undone."
   );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setActionId(faqId);

    try {
      const response = await api.delete(`/faqs/${faqId}`);

      if (response.data?.status !== 200) {
        throw new Error(response.data?.message || "Unable to delete FAQ.");
      }

      setFaqs((prev) => {
        return prev.filter((item) => {
          const itemId = item.faqId ?? item.faq_id ?? item.id;
          return itemId !== faqId;
        });
      });

      setSuccess("FAQ deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Unable to delete FAQ."
     );
    } finally {
      setActionId(null);
    }
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch = `${faq.title || ""} ${faq.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase().trim());

    const matchesFilter =
      filter === "all" ||
      (filter === "visible" && faq.visibleOnWebsite) ||
      (filter === "hidden" && !faq.visibleOnWebsite);

    return matchesSearch && matchesFilter;
  });

  const visibleCount = faqs.filter((faq) => faq.visibleOnWebsite).length;
  const hiddenCount = faqs.length - visibleCount;

  return (
    <div className="mobile-page mobile-faq min-h-full bg-tf-bg p-5 text-tf-ink sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mobile-heading mb-7 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h1><p className="mt-2 text-sm text-tf-copy sm:text-base">Help students find answers and manage what appears on your website.</p></div><button type="button" onClick={openCreateModal} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-blue-700"><Plus size={20}/>Add FAQ</button></header>
        {error && !isModalOpen && <div role="alert" className="mb-5 flex items-start justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800"><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError("")}><X size={18}/></button></div>}
        {success && <div role="status" className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18}/><span>{success}</span><button aria-label="Dismiss message" className="ml-auto" onClick={() => setSuccess("")}><X size={18}/></button></div>}
        <section aria-label="FAQ statistics" className="mobile-summary mobile-summary-three mb-8 grid gap-4 sm:grid-cols-3">{[["Total FAQs",faqs.length,"total","#38bdf8"],["Visible on website",visibleCount,"visible","#10b981"],["Hidden FAQs",hiddenCount,"hidden","#8b5cf6"]].map(([label,value,type,color]) => <div key={type} style={{color,borderColor:`${color}40`}} className="relative min-h-36 overflow-hidden rounded-2xl border bg-tf-surface p-5 shadow-[0_4px_14px_-10px_rgb(15_23_42_/_20%)]"><KpiState unavailable={Boolean(error) && faqs.length === 0} loading={loading} empty={value === 0} label={label} message={type === "hidden" ? "No hidden questions" : "Your next helpful answer starts here"} kind="messages"><p className="relative z-10 text-sm text-tf-copy">{label}</p><p className="relative z-10 mt-3 text-4xl font-bold tracking-tight text-tf-ink">{value}</p><FaqSummaryArt type={type}/></KpiState></div>)}</section>
        <section aria-labelledby="faq-list-heading">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h2 id="faq-list-heading" className="flex items-center gap-3 text-2xl font-bold tracking-tight">Your FAQs<span className="rounded-xl bg-tf-sky px-3 py-1 text-base font-semibold text-tf-blue">{faqs.length}</span></h2><p className="mt-1 text-sm text-tf-copy">Clear answers to common questions about your classes.</p></div><div className="flex w-full flex-wrap gap-3 sm:w-auto"><label className="relative min-w-0 flex-1 sm:w-64"><Search size={19} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tf-muted"/><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search questions or answers" aria-label="Search FAQs" className="w-full rounded-xl border border-tf-line bg-tf-surface py-3 pr-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-[var(--tf-blue)]"/></label><select value={filter} onChange={event => setFilter(event.target.value)} aria-label="Filter FAQs" className="rounded-xl border border-tf-line bg-tf-surface px-3 py-3 text-sm text-tf-copy"><option value="all">All FAQs</option><option value="visible">Visible only</option><option value="hidden">Hidden only</option></select></div></div>
          {loading ? <p role="status" className="py-14 text-center text-tf-copy">Loading FAQs…</p> : filteredFaqs.length ? <div className="grid gap-5 lg:grid-cols-2">{filteredFaqs.map((faq,index) => {
            const faqId = faq.faqId ?? faq.faq_id ?? faq.id;
            const isBusy = actionId === faqId;
            return <article key={faqId ?? index} className="mobile-faq-card mobile-content-card flex min-w-0 flex-col rounded-2xl border border-tf-line bg-tf-surface p-5 shadow-[0_5px_16px_-10px_rgb(15_23_42_/_20%)] sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 rounded-xl bg-tf-sky px-3 py-2 text-sm font-semibold text-tf-blue"><MessageCircleQuestion size={19}/>Question {index+1}</span><span className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${faq.visibleOnWebsite ? "bg-emerald-100 text-emerald-800" : "bg-tf-surface-soft text-tf-muted"}`}>{faq.visibleOnWebsite ? "Published" : "Hidden"}</span></div>
              <h3 className="break-words text-lg font-bold leading-7">{faq.title}</h3><div className="mb-5 mt-4 rounded-xl bg-tf-surface-soft p-4"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-tf-muted">Answer</p><ExpandableText lines={4} preserveWhitespace className="text-sm leading-7 text-tf-copy">{faq.description}</ExpandableText></div>
              <div className="mobile-card-footer mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-tf-line pt-4"><div className="flex items-center gap-2"><button type="button" role="switch" aria-checked={Boolean(faq.visibleOnWebsite)} aria-label={`Visible on website: ${faq.title}`} disabled={isBusy} onClick={() => toggleVisibility(faq)} className={`relative inline-flex h-6 w-10 items-center rounded-full p-[3px] transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--tf-blue)] ${faq.visibleOnWebsite ? "bg-[var(--tf-blue)]" : "bg-slate-300 dark:bg-slate-600"}`}><span className={`h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${faq.visibleOnWebsite ? "translate-x-4" : "translate-x-0"}`}/></button><span className="text-xs text-tf-copy">{isBusy ? "Updating…" : faq.visibleOnWebsite ? "Visible on website" : "Hidden from website"}</span></div><div className="flex gap-2"><button type="button" disabled={isBusy} onClick={() => openEditModal(faq)} className="mobile-icon-action inline-flex items-center gap-2 rounded-xl border border-tf-line px-3 py-2 text-sm text-tf-copy hover:bg-tf-surface-soft disabled:opacity-50" aria-label="Edit FAQ"><Pencil size={16}/><span className="mobile-action-label">Edit</span></button><button type="button" disabled={isBusy} onClick={() => deleteFaq(faq)} className="mobile-icon-action inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950" aria-label="Delete FAQ"><Trash2 size={16}/><span className="mobile-action-label">Delete</span></button></div></div>
            </article>;
          })}</div> : <div className="rounded-2xl border border-dashed border-tf-line bg-tf-surface p-10 text-center"><MessageCircleQuestion size={40} className="mx-auto mb-4 text-tf-blue"/><h3 className="text-lg font-semibold">{search || filter !== "all" ? "No matching FAQs" : "Answer their first questions"}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-tf-copy">{search || filter !== "all" ? "Try another search or visibility filter." : "Share helpful answers about fees, schedules, subjects, and demo classes."}</p>{!search && filter === "all" && <button onClick={openCreateModal} className="mt-5 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">Add your first FAQ</button>}</div>}
          {!loading && filteredFaqs.length > 0 && <p className="mt-5 flex items-center gap-2 text-xs text-tf-muted"><Globe size={14}/>Showing {filteredFaqs.length} of {faqs.length} FAQs</p>}
        </section>
      </div>

      {/* ================= CREATE / EDIT MODAL ================= */}
      {isModalOpen && (
        <div
          className="tf-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="faq-modal-title"
            className="tf-modal-panel max-h-[90vh] w-full max-w-[580px] overflow-y-auto rounded-[20px] border border-[var(--tf-line)] bg-white text-[var(--tf-ink)] shadow-[0_20px_45px_rgba(0,0,0,0.35)] [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-surface)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]"
          >
            <div className="tf-modal-heading tf-modal-heading-padded flex items-start justify-between border-b border-[var(--tf-line)] px-6 py-5 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)]">
              <div>
                <h2 id="faq-modal-title" className="mb-1 text-lg font-bold text-[var(--tf-ink)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]">
                  {editingFaq ? "Edit FAQ" : "Add New FAQ"}
                </h2>
                <p className="text-[13px] text-[var(--tf-copy)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-copy)]">
                  Provide a common question and answer for prospective students.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="cursor-pointer border-0 bg-transparent p-1 text-[22px] leading-none text-[var(--tf-muted)] hover:text-[var(--tf-ink)] [&:where([data-theme=dark],[data-theme=dark]_*)]:hover:text-[var(--tf-ink)]"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="tf-modal-body p-6">
              {error && (
                <div role="alert" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-[13px] text-red-700 [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#45232d] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#ff9aa4]">
                  {error}
                </div>
             )}

              {/* Question Field */}
              <div className="mb-5">
                <label htmlFor="faq-title" className="mb-2 flex items-center justify-between text-[13px] font-semibold text-[var(--tf-ink)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]">
                  <span>Question <span className="text-red-500">*</span></span>
                  <span className="text-[11px] font-medium text-[var(--tf-muted)]">
                    {form.title.length}/500
                  </span>
                </label>
                <input
                  id="faq-title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. What are your batch timings and duration?"
                  maxLength={500}
                  required
                  className="w-full rounded-xl border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-3.5 py-[11px] text-[13px] text-[var(--tf-ink)] outline-none transition focus:border-[#1875d1] focus:ring-[3px] focus:ring-blue-500/15 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-surface-soft)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]"
                />
              </div>

              {/* Answer Field */}
              <div className="mb-5">
                <label htmlFor="faq-description" className="mb-2 flex items-center justify-between text-[13px] font-semibold text-[var(--tf-ink)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]">
                  <span>Answer <span className="text-red-500">*</span></span>
                  <span className="text-[11px] font-medium text-[var(--tf-muted)]">
                    {form.description.length}/10000
                  </span>
                </label>
                <textarea
                  id="faq-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Write a clear and comprehensive answer..."
                  maxLength={10000}
                  required
                  className="min-h-[130px] w-full resize-y rounded-xl border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-3.5 py-[11px] text-[13px] leading-[1.55] text-[var(--tf-ink)] outline-none transition focus:border-[#1875d1] focus:ring-[3px] focus:ring-blue-500/15 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-surface-soft)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]"
                />
              </div>

              {/* Visibility Checkbox */}
              <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-4 py-3.5 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-surface-soft)]">
                <input
                  type="checkbox"
                  name="visibleOnWebsite"
                  checked={form.visibleOnWebsite}
                  onChange={handleChange}
                  className="mt-[3px] h-4 w-4 cursor-pointer accent-[#1875d1]"
                />
                <div>
                  <span className="block text-[13px] font-semibold text-[var(--tf-ink)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]">
                    Display on public website
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--tf-copy)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-copy)]">
                    When checked, students visiting your portfolio can read this FAQ.
                  </span>
                </div>
              </label>

              {/* Modal Actions */}
              <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="inline-flex min-w-[90px] items-center justify-center rounded-[10px] border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-3.5 py-[7px] text-xs font-semibold text-[var(--tf-ink)] transition-all hover:border-[#1875d1] hover:text-[#1875d1] disabled:cursor-not-allowed disabled:opacity-50 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[var(--tf-line)] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[var(--tf-surface-soft)] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[var(--tf-ink)]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !form.title.trim() || !form.description.trim()}
                  className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-xl bg-[#1875d1] px-[18px] py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(24,117,209,0.25)] transition-colors hover:bg-[#0c5fb7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingFaq
                      ? "Save changes"
                      : "Create FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
     )}
    </div>
 );
};

export default FAQ;

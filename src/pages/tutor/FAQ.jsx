import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
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
    <div className="min-h-full bg-[#f4f8fd] px-5 pt-[30px] pb-[60px] text-[#172b46] transition-colors duration-200 sm:px-8 sm:pt-9 sm:pb-[72px] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#101b2b] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]">
      <div className="mx-auto max-w-[1100px]">
        {/* ================= PAGE HEADING ================= */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="tf-page-title mb-2">Frequently Asked Questions</h1>
            <p className="text-[13px] text-[#566b84] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#b7c7db]">
              Manage questions and answers shown on your public tutoring website.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1875d1] px-[18px] py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(24,117,209,0.25)] transition-colors hover:bg-[#0c5fb7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-base leading-none">+</span>
            <span>Add FAQ</span>
          </button>
        </header>

        {/* ================= FEEDBACK NOTICES ================= */}
        {error && !isModalOpen && (
          <div role="alert" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-[13px] text-red-700 [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#45232d] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#ff9aa4]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="cursor-pointer border-0 bg-transparent text-lg leading-none opacity-70 hover:opacity-100"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
       )}

        {success && (
          <div role="status" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-700/25 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800 [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#183d37] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#69d4a8]">
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="cursor-pointer border-0 bg-transparent text-lg leading-none opacity-70 hover:opacity-100"
              aria-label="Dismiss message"
            >
              &times;
            </button>
          </div>
       )}

        {/* ================= STATS CARDS ================= */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-[18px] border border-[#dfe9f3] bg-white px-[22px] py-5 shadow-[var(--tf-shadow)] [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#17263a]">
            <p className="mb-1.5 text-[13px] font-medium text-[#566b84] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#b7c7db]">Total FAQs</p>
            <p className="m-0 text-[30px] font-extrabold tracking-[-0.5px] text-[#172b46] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]">{faqs.length}</p>
          </div>

          <div className="rounded-[18px] border border-[#dfe9f3] bg-white px-[22px] py-5 shadow-[var(--tf-shadow)] [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#17263a]">
            <p className="mb-1.5 text-[13px] font-medium text-[#566b84] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#b7c7db]">Visible on website</p>
            <p className="m-0 text-[30px] font-extrabold tracking-[-0.5px] text-[#147d5a] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#69d4a8]">
              {visibleCount}
            </p>
          </div>

          <div className="rounded-[18px] border border-[#dfe9f3] bg-white px-[22px] py-5 shadow-[var(--tf-shadow)] [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#17263a]">
            <p className="mb-1.5 text-[13px] font-medium text-[#566b84] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#b7c7db]">Hidden FAQs</p>
            <p className="m-0 text-[30px] font-extrabold tracking-[-0.5px] text-[#8394a9]">
              {hiddenCount}
            </p>
          </div>
        </div>

        {/* ================= FAQ LIST CONTAINER ================= */}
        <section className="overflow-hidden rounded-[20px] border border-[#dfe9f3] bg-white shadow-[var(--tf-shadow)] [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#17263a]">
          <div className="flex flex-col gap-4 border-b border-[#dfe9f3] p-5 lg:flex-row lg:items-center lg:justify-between lg:px-6 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f]">
            <div>
              <h2 className="tf-section-title mb-1">All Questions</h2>
              <p className="text-[13px] text-[#566b84] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#b7c7db]">
                Add, edit, or control which FAQs appear on your tutor website.
              </p>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
              <div className="relative w-full sm:min-w-[250px]">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8394a9]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full rounded-xl border border-[#dfe9f3] bg-[#f8fbff] py-[9px] pl-9 pr-3.5 text-[13px] text-[#172b46] outline-none transition focus:border-[#1875d1] focus:ring-[3px] focus:ring-blue-500/15 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#1b2d44] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]"
                  aria-label="Search FAQs"
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="cursor-pointer rounded-xl border border-[#dfe9f3] bg-[#f8fbff] px-3.5 py-[9px] text-[13px] text-[#172b46] outline-none focus:border-[#1875d1] [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#1b2d44] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]"
                aria-label="Filter FAQs"
              >
                <option value="all">All FAQs</option>
                <option value="visible">Visible only</option>
                <option value="hidden">Hidden only</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-blue-500" />
              <p className="text-sm text-[#566b84] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#b7c7db]">
                Loading FAQs...
              </p>
            </div>
         ) : filteredFaqs.length === 0 ? (
            /* Empty State */
            <div className="px-5 py-14 text-center">
              <div className="mb-3 text-4xl">💡</div>
              <h3 className="mb-1.5 text-base font-bold text-[#172b46] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]">
                {search || filter !== "all"
                  ? "No matching FAQs found"
                  : "No FAQs added yet"}
              </h3>
              <p className="mx-auto mb-[18px] max-w-[400px] text-[13px] text-[#566b84] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#b7c7db]">
                {search || filter !== "all"
                  ? "Try adjusting your search query or visibility filter."
                  : "Answer common questions about tuition fees, timings, subjects, and demo classes so students can enroll faster."}
              </p>

              {!search && filter === "all" && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1875d1] px-[18px] py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(24,117,209,0.25)] transition-colors hover:bg-[#0c5fb7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  + Add your first FAQ
                </button>
             )}
            </div>
         ) : (
            /* FAQ Items List */
            <div>
              {filteredFaqs.map((faq, index) => {
                const faqId = faq.faqId ?? faq.faq_id ?? faq.id;
                const isBusy = actionId === faqId;

                return (
                  <article key={faqId ?? index} className="border-b border-[#dfe9f3] px-6 py-[22px] transition-colors last:border-b-0 hover:bg-[#f8fbff] [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark]_*)]:hover:bg-[#1b2d44]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-[#8394a9]">
                            Q{index + 1}
                          </span>
                          <span
                            className={`inline-flex items-center gap-[5px] rounded-full border px-[9px] py-0.5 text-[11px] font-bold uppercase tracking-[0.4px] ${
                              faq.visibleOnWebsite
                                ? "border-emerald-700/25 bg-[#eaf8f1] text-[#147d5a] [&:where([data-theme=dark],[data-theme=dark])]:bg-[#183d37] [&:where([data-theme=dark],[data-theme=dark])]:text-[#69d4a8]"
                                : "border-[#dfe9f3] bg-[#f8fbff] text-[#8394a9] [&:where([data-theme=dark],[data-theme=dark])]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark])]:bg-[#1b2d44]"
                            }`}
                          >
                            {faq.visibleOnWebsite ? "● Visible" : "○ Hidden"}
                          </span>
                        </div>

                        <h3 className="mb-2 text-base font-bold leading-[1.4] text-[#172b46] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]">{faq.title}</h3>
                        <p className="m-0 whitespace-pre-wrap text-[13.5px] leading-[1.6] text-[#566b84] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#b7c7db]">{faq.description}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(faq)}
                          disabled={isBusy}
                          className="inline-flex items-center justify-center rounded-[10px] border border-[#dfe9f3] bg-[#f8fbff] px-3.5 py-[7px] text-xs font-semibold text-[#172b46] transition-all hover:border-[#1875d1] hover:text-[#1875d1] disabled:cursor-not-allowed disabled:opacity-50 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#1b2d44] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleVisibility(faq)}
                          disabled={isBusy}
                          className="inline-flex items-center justify-center rounded-[10px] border border-[#dfe9f3] bg-[#f8fbff] px-3.5 py-[7px] text-xs font-semibold text-[#172b46] transition-all hover:border-[#1875d1] hover:text-[#1875d1] disabled:cursor-not-allowed disabled:opacity-50 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#1b2d44] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]"
                        >
                          {isBusy
                            ? "Updating..."
                            : faq.visibleOnWebsite
                              ? "Hide"
                              : "Show"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteFaq(faq)}
                          disabled={isBusy}
                          className="inline-flex items-center justify-center rounded-[10px] border border-red-700/25 bg-[#fff2f3] px-3.5 py-[7px] text-xs font-semibold text-[#b93849] transition-all hover:bg-[#b93849] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#45232d] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#ff9aa4]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
               );
              })}
            </div>
         )}

          {/* Footer showing count */}
          {!loading && filteredFaqs.length > 0 && (
            <div className="border-t border-[#dfe9f3] bg-[#f8fbff] px-6 py-3 text-xs text-[#8394a9] [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#1b2d44]">
              Showing {filteredFaqs.length} of {faqs.length} FAQs
            </div>
         )}
        </section>
      </div>

      {/* ================= CREATE / EDIT MODAL ================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="faq-modal-title"
            className="max-h-[90vh] w-full max-w-[580px] overflow-y-auto rounded-[20px] border border-[#dfe9f3] bg-white text-[#172b46] shadow-[0_20px_45px_rgba(0,0,0,0.35)] [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#17263a] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]"
          >
            <div className="flex items-start justify-between border-b border-[#dfe9f3] px-6 py-5 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f]">
              <div>
                <h2 id="faq-modal-title" className="mb-1 text-lg font-bold text-[#172b46] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]">
                  {editingFaq ? "Edit FAQ" : "Add New FAQ"}
                </h2>
                <p className="text-[13px] text-[#566b84] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#b7c7db]">
                  Provide a common question and answer for prospective students.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="cursor-pointer border-0 bg-transparent p-1 text-[22px] leading-none text-[#8394a9] hover:text-[#172b46] [&:where([data-theme=dark],[data-theme=dark]_*)]:hover:text-[#e8f0fb]"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div role="alert" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-[13px] text-red-700 [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#45232d] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#ff9aa4]">
                  {error}
                </div>
             )}

              {/* Question Field */}
              <div className="mb-5">
                <label htmlFor="faq-title" className="mb-2 flex items-center justify-between text-[13px] font-semibold text-[#172b46] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]">
                  <span>Question <span className="text-red-500">*</span></span>
                  <span className="text-[11px] font-medium text-[#8394a9]">
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
                  className="w-full rounded-xl border border-[#dfe9f3] bg-[#f8fbff] px-3.5 py-[11px] text-[13px] text-[#172b46] outline-none transition focus:border-[#1875d1] focus:ring-[3px] focus:ring-blue-500/15 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#1b2d44] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]"
                />
              </div>

              {/* Answer Field */}
              <div className="mb-5">
                <label htmlFor="faq-description" className="mb-2 flex items-center justify-between text-[13px] font-semibold text-[#172b46] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]">
                  <span>Answer <span className="text-red-500">*</span></span>
                  <span className="text-[11px] font-medium text-[#8394a9]">
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
                  className="min-h-[130px] w-full resize-y rounded-xl border border-[#dfe9f3] bg-[#f8fbff] px-3.5 py-[11px] text-[13px] leading-[1.55] text-[#172b46] outline-none transition focus:border-[#1875d1] focus:ring-[3px] focus:ring-blue-500/15 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#1b2d44] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]"
                />
              </div>

              {/* Visibility Checkbox */}
              <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] border border-[#dfe9f3] bg-[#f8fbff] px-4 py-3.5 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#1b2d44]">
                <input
                  type="checkbox"
                  name="visibleOnWebsite"
                  checked={form.visibleOnWebsite}
                  onChange={handleChange}
                  className="mt-[3px] h-4 w-4 cursor-pointer accent-[#1875d1]"
                />
                <div>
                  <span className="block text-[13px] font-semibold text-[#172b46] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]">
                    Display on public website
                  </span>
                  <span className="mt-0.5 block text-xs text-[#566b84] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#b7c7db]">
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
                  className="inline-flex min-w-[90px] items-center justify-center rounded-[10px] border border-[#dfe9f3] bg-[#f8fbff] px-3.5 py-[7px] text-xs font-semibold text-[#172b46] transition-all hover:border-[#1875d1] hover:text-[#1875d1] disabled:cursor-not-allowed disabled:opacity-50 [&:where([data-theme=dark],[data-theme=dark]_*)]:border-[#30465f] [&:where([data-theme=dark],[data-theme=dark]_*)]:bg-[#1b2d44] [&:where([data-theme=dark],[data-theme=dark]_*)]:text-[#e8f0fb]"
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

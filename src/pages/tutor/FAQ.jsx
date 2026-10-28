
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
    setError("");
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
    setError("");
    setSuccess("");

    const title = form.title.trim();
    const description = form.description.trim();

    if (!title || !description) {
      setError("Please fill in both the question and answer.");
      return;
    }

    if (!userId) {
      setError("Unable to identify your account. Please log in again.");
      return;
    }

    const payload = {
      title,
      description,
      visibleOnWebsite: form.visibleOnWebsite,
    };

    try {
      setSaving(true);

      let response;

      if (editingFaq) {
        const faqId = editingFaq.faqId ?? editingFaq.faq_id ?? editingFaq.id;

        response = await api.put(`/faqs/${faqId}`, payload);
      } else {
        response = await api.post("/faqs/new", {
          userId: Number(userId),
          ...payload,
        });
      }

      const result = response.data;

      if (![200, 201].includes(result?.status)) {
        throw new Error(result?.message || "Unable to save FAQ.");
      }

      setIsModalOpen(false);
      setEditingFaq(null);
      setForm(initialForm);
      setSuccess(
        editingFaq
          ? "FAQ updated successfully."
          : "FAQ created successfully."
      );

      await fetchFaqs();
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

    try {
      setActionId(faqId);

      const response = await api.patch(`/faqs/visibility/${faqId}`, {
        visibleOnWebsite: newVisibility,
      });

      if (response.data?.status !== 200) {
        throw new Error(
          response.data?.message || "Unable to update FAQ visibility."
        );
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

    try {
      setActionId(faqId);

      const response = await api.delete(`/faqs/${faqId}`);

      if (response.data?.status !== 200) {
        throw new Error(response.data?.message || "Unable to delete FAQ.");
      }

      setFaqs((prev) =>
        prev.filter((item) => {
          const itemId = item.faqId ?? item.faq_id ?? item.id;
          return itemId !== faqId;
        })
      );

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

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100";

  const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60";

  const secondaryButton =
    "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60";

  const statusBadge = (visible) =>
    visible
      ? "inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
      : "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600";

  return (
    <div className="min-h-screen bg-gray-50/70 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              FAQs
            </h1>
            <p className="mt-1.5 text-sm leading-6 text-gray-500">
              Manage frequently asked questions for your tutoring website.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className={`${primaryButton} w-full sm:w-auto`}
          >
            <span className="text-lg leading-none">+</span>
            Add FAQ
          </button>
        </div>

        {/* Feedback */}
        {error && !isModalOpen && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              className="font-semibold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            <p>{success}</p>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="font-semibold"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total FAQs</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {faqs.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Visible on website
            </p>
            <p className="mt-2 text-3xl font-semibold text-green-600">
              {visibleCount}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Hidden FAQs
            </p>
            <p className="mt-2 text-3xl font-semibold text-gray-700">
              {hiddenCount}
            </p>
          </div>
        </div>

        {/* FAQ list */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Your questions
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add, edit, or control which FAQs appear on your website.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                <div className="relative w-full sm:min-w-64 lg:w-72">
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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
                    placeholder="Search FAQs..."
                    className={`${inputClass} py-2.5 pl-9`}
                    aria-label="Search FAQs"
                  />
                </div>

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className={`${inputClass} py-2.5 sm:w-40`}
                  aria-label="Filter FAQs"
                >
                  <option value="all">All FAQs</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-600" />
              <p className="text-sm text-gray-500">Loading FAQs...</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>

              <h3 className="mt-4 text-base font-semibold text-gray-900">
                {search || filter !== "all"
                  ? "No matching FAQs"
                  : "No FAQs added yet"}
              </h3>

              <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
                {search || filter !== "all"
                  ? "Try changing your search or filter."
                  : "Add answers to common questions so students can learn more about your tuition."}
              </p>

              {!search && filter === "all" && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className={`${primaryButton} mt-5`}
                >
                  + Add your first FAQ
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredFaqs.map((faq, index) => {
                const faqId = faq.faqId ?? faq.faq_id ?? faq.id;
                const isBusy = actionId === faqId;

                return (
                  <article
                    key={faqId ?? index}
                    className="p-4 transition hover:bg-gray-50/70 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-gray-400">
                            FAQ {index + 1}
                          </span>
                          <span className={statusBadge(faq.visibleOnWebsite)}>
                            {faq.visibleOnWebsite ? "Visible" : "Hidden"}
                          </span>
                        </div>

                        <h3 className="mt-2 break-words text-base font-semibold text-gray-900">
                          {faq.title}
                        </h3>

                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                          {faq.description}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(faq)}
                          disabled={isBusy}
                          className={secondaryButton}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleVisibility(faq)}
                          disabled={isBusy}
                          className={secondaryButton}
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
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
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

          {!loading && filteredFaqs.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50/70 px-4 py-3 sm:px-5">
              <p className="text-xs text-gray-500">
                Showing {filteredFaqs.length} of {faqs.length} FAQs
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Create / Edit modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 p-0 sm:items-center sm:p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="faq-modal-title"
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="faq-modal-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  {editingFaq ? "Edit FAQ" : "Add a new FAQ"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add a question and its answer for your students.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="faq-title"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Question <span className="text-red-600">*</span>
                </label>
                <input
                  id="faq-title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. What are your tuition timings?"
                  maxLength={500}
                  required
                  className={inputClass}
                />
                <p className="mt-1.5 text-right text-xs text-gray-400">
                  {form.title.length}/500
                </p>
              </div>

              <div>
                <label
                  htmlFor="faq-description"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Answer <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="faq-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Write a clear answer..."
                  rows={5}
                  maxLength={10000}
                  required
                  className={`${inputClass} resize-y`}
                />
                <p className="mt-1.5 text-right text-xs text-gray-400">
                  {form.description.length}/10000
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="visibleOnWebsite"
                  checked={form.visibleOnWebsite}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-red-600 focus:ring-red-500"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-800">
                    Show on my website
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-gray-500">
                    Students can see this FAQ on your public tutor website when
                    enabled.
                  </span>
                </span>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className={`${secondaryButton} w-full sm:w-auto`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className={`${primaryButton} w-full sm:w-auto`}
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

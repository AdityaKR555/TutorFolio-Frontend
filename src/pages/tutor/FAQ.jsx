import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
import { getStoredUser } from "../../utils/auth";
import "./FAQ.css";

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
    <div className="faq-page">
      <div className="faq-content">
        {/* ================= PAGE HEADING ================= */}
        <header className="faq-heading">
          <div>
            <h1>Frequently Asked Questions</h1>
            <p>
              Manage questions and answers shown on your public tutoring website.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="faq-btn-primary"
          >
            <span className="text-base leading-none">+</span>
            <span>Add FAQ</span>
          </button>
        </header>

        {/* ================= FEEDBACK NOTICES ================= */}
        {error && !isModalOpen && (
          <div role="alert" className="faq-notice faq-notice--error">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="faq-notice-dismiss"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

        {success && (
          <div role="status" className="faq-notice faq-notice--success">
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="faq-notice-dismiss"
              aria-label="Dismiss message"
            >
              &times;
            </button>
          </div>
        )}

        {/* ================= STATS CARDS ================= */}
        <div className="faq-stats-grid">
          <div className="faq-stat-card">
            <p className="faq-stat-label">Total FAQs</p>
            <p className="faq-stat-value">{faqs.length}</p>
          </div>

          <div className="faq-stat-card">
            <p className="faq-stat-label">Visible on website</p>
            <p className="faq-stat-value faq-stat-value--visible">
              {visibleCount}
            </p>
          </div>

          <div className="faq-stat-card">
            <p className="faq-stat-label">Hidden FAQs</p>
            <p className="faq-stat-value" style={{ color: "var(--tf-muted)" }}>
              {hiddenCount}
            </p>
          </div>
        </div>

        {/* ================= FAQ LIST CONTAINER ================= */}
        <section className="faq-card">
          <div className="faq-card-head">
            <div>
              <h2 className="faq-card-title">All Questions</h2>
              <p className="faq-card-subtitle">
                Add, edit, or control which FAQs appear on your tutor website.
              </p>
            </div>

            {/* Search & Filter Controls */}
            <div className="faq-controls">
              <div className="faq-search-wrapper">
                <svg
                  className="faq-search-icon"
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
                  className="faq-search-input"
                  aria-label="Search FAQs"
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="faq-filter-select"
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
            <div className="faq-state-box">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-blue-500" />
              <p className="text-sm" style={{ color: "var(--tf-copy)" }}>
                Loading FAQs...
              </p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            /* Empty State */
            <div className="faq-state-box">
              <div className="faq-state-icon">💡</div>
              <h3 className="faq-state-title">
                {search || filter !== "all"
                  ? "No matching FAQs found"
                  : "No FAQs added yet"}
              </h3>
              <p className="faq-state-text">
                {search || filter !== "all"
                  ? "Try adjusting your search query or visibility filter."
                  : "Answer common questions about tuition fees, timings, subjects, and demo classes so students can enroll faster."}
              </p>

              {!search && filter === "all" && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="faq-btn-primary"
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
                  <article key={faqId ?? index} className="faq-item">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="faq-item-head">
                          <span className="faq-item-index">
                            Q{index + 1}
                          </span>
                          <span
                            className={`faq-badge ${
                              faq.visibleOnWebsite
                                ? "faq-badge--visible"
                                : "faq-badge--hidden"
                            }`}
                          >
                            {faq.visibleOnWebsite ? "● Visible" : "○ Hidden"}
                          </span>
                        </div>

                        <h3 className="faq-item-title">{faq.title}</h3>
                        <p className="faq-item-desc">{faq.description}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(faq)}
                          disabled={isBusy}
                          className="faq-btn-action"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleVisibility(faq)}
                          disabled={isBusy}
                          className="faq-btn-action"
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
                          className="faq-btn-delete"
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
            <div className="faq-card-footer">
              Showing {filteredFaqs.length} of {faqs.length} FAQs
            </div>
          )}
        </section>
      </div>

      {/* ================= CREATE / EDIT MODAL ================= */}
      {isModalOpen && (
        <div
          className="faq-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="faq-modal-title"
            className="faq-modal-card"
          >
            <div className="faq-modal-header">
              <div>
                <h2 id="faq-modal-title" className="faq-modal-title">
                  {editingFaq ? "Edit FAQ" : "Add New FAQ"}
                </h2>
                <p className="faq-modal-subtitle">
                  Provide a common question and answer for prospective students.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="faq-modal-close"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="faq-modal-body">
              {error && (
                <div role="alert" className="faq-notice faq-notice--error">
                  {error}
                </div>
              )}

              {/* Question Field */}
              <div className="faq-form-field">
                <label htmlFor="faq-title" className="faq-form-label">
                  <span>Question <span className="text-red-500">*</span></span>
                  <span className="faq-form-counter">
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
                  className="faq-form-input"
                />
              </div>

              {/* Answer Field */}
              <div className="faq-form-field">
                <label htmlFor="faq-description" className="faq-form-label">
                  <span>Answer <span className="text-red-500">*</span></span>
                  <span className="faq-form-counter">
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
                  className="faq-form-textarea"
                />
              </div>

              {/* Visibility Checkbox */}
              <label className="faq-checkbox-label">
                <input
                  type="checkbox"
                  name="visibleOnWebsite"
                  checked={form.visibleOnWebsite}
                  onChange={handleChange}
                  className="faq-checkbox"
                />
                <div>
                  <span className="faq-checkbox-title">
                    Display on public website
                  </span>
                  <span className="faq-checkbox-desc">
                    When checked, students visiting your portfolio can read this FAQ.
                  </span>
                </div>
              </label>

              {/* Modal Actions */}
              <div className="faq-modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="faq-btn-action"
                  style={{ minWidth: "90px" }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !form.title.trim() || !form.description.trim()}
                  className="faq-btn-primary"
                  style={{ minWidth: "130px" }}
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

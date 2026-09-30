import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const initialForm = {
  title: "",
  batchType: "upcoming",
  description: "",
  fee: "",
  paymentType: "",
  startOn: "",
  endOn: "",
  eligibleClasses: "",
  maximumSeats: "",
  allottedSeats: "",
  session: "",
};

function Batches() {
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [visibilityId, setVisibilityId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(initialForm);
  const [activeFilter, setActiveFilter] = useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.user_id;
    } catch {
      return null;
    }
  };

  /*
    Backend currently returns some DB fields in lowercase
    because it uses SELECT * with RealDictCursor.

    Example:
    paymenttype
    starton
    endon
    eligibleclasses
    maximumseats
    allottedseats

    This function supports both the current backend response
    and the cleaner camelCase response if backend is changed later.
  */
  const normalizeBatch = (batch) => ({
    batchId: batch?.batchId ?? batch?.batchid ?? batch?.id ?? null,

    userId:
      batch?.userId ??
      batch?.userid ??
      null,

    title: batch?.title ?? "",

    batchType:
      batch?.batchType ??
      batch?.batchtype ??
      batch?.type ??
      "upcoming",

    description:
      batch?.description ?? "",

    fee:
      batch?.fee !== null && batch?.fee !== undefined
        ? String(batch.fee)
        : "",

    paymentType:
      batch?.paymentType ??
      batch?.paymenttype ??
      "",

    startOn:
      batch?.startOn ??
      batch?.starton ??
      "",

    endOn:
      batch?.endOn ??
      batch?.endon ??
      "",

    eligibleClasses:
      batch?.eligibleClasses ??
      batch?.eligibleclasses ??
      "",

    maximumSeats:
      batch?.maximumSeats ??
      batch?.maximumseats ??
      "",

    allottedSeats:
      batch?.allottedSeats ??
      batch?.allottedseats ??
      "",

    session:
      batch?.session ?? "",

    visibleOnWebsite:
      batch?.visibleOnWebsite ??
      batch?.visibleonwebsite,
  });

  const fetchBatches = async (filter = activeFilter) => {
    const userId = getUserId();

    if (!userId) {
      setError(
        "Your login session could not be found. Please login again."
      );
      setLoading(false);
      return;
    }

    try {
      setError("");

      const response = await api.get(
        `/batches/getAll/${filter}`,
        {
          params: {
            user_id: userId,
          },
          timeout: 15000,
        }
      );

      const data = response.data;

      if (data?.status === 200) {
        /*
          Current backend response:

          {
            status: 200,
            message: "...",
            details: [...]
          }
        */

        const rawList = Array.isArray(data?.details)
          ? data.details
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.details)
          ? data.data.details
          : [];

        const normalizedList = rawList.map(normalizeBatch);

        setBatches(normalizedList);
      } else if (data?.status === 404) {
        setBatches([]);
      } else {
        setError(
          data?.message ||
            "Unable to load batches. Please try again."
        );
      }
    } catch (err) {
      console.error("Fetch batches error:", err);
      console.error(
        "Backend response:",
        err.response?.data
      );

      if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else if (err.response?.status === 422) {
        setError("The batches request was invalid.");
      } else if (err.response?.status >= 500) {
        setError(
          err.response?.data?.message ||
            "The server returned an internal error."
        );
      } else if (err.request) {
        setError(
          "Could not connect to the server. Please check your internet connection."
        );
      } else {
        setError(
          "Something went wrong while loading batches."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches(activeFilter);
  }, [activeFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let nextValue = value;

    // Fee should contain amount only.
    if (name === "fee") {
      nextValue = value.replace(/[^\d]/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleAdd = () => {
    setFormData(initialForm);
    setEditingId(null);
    setIsFormOpen(true);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleEdit = (batch) => {
    setFormData({
      title: batch.title ?? "",
      batchType: batch.batchType ?? "upcoming",
      description: batch.description ?? "",
      fee: batch.fee ?? "",
      paymentType: batch.paymentType ?? "",
      startOn: batch.startOn ?? "",
      endOn: batch.endOn ?? "",
      eligibleClasses: batch.eligibleClasses ?? "",
      maximumSeats:
        batch.maximumSeats !== null &&
        batch.maximumSeats !== undefined
          ? String(batch.maximumSeats)
          : "",
      allottedSeats:
        batch.allottedSeats !== null &&
        batch.allottedSeats !== undefined
          ? String(batch.allottedSeats)
          : "",
      session: batch.session ?? "",
    });

    setEditingId(batch.batchId);
    setIsFormOpen(true);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) {
      return;
    }

    const userId = getUserId();

    if (!userId) {
      setError(
        "Your login session has expired. Please login again."
      );
      return;
    }

    if (!formData.title.trim()) {
      setError("Batch title is required.");
      return;
    }

    if (
      !["current", "upcoming", "old"].includes(
        formData.batchType
      )
    ) {
      setError("Please select a valid batch type.");
      return;
    }

    if (!formData.description.trim()) {
      setError("Batch description is required.");
      return;
    }

    if (
      formData.paymentType &&
      !["monthly", "installment"].includes(
        formData.paymentType
      )
    ) {
      setError("Please select a valid payment type.");
      return;
    }

    const maximumSeats =
      formData.maximumSeats === ""
        ? null
        : Number(formData.maximumSeats);

    const allottedSeats =
      formData.allottedSeats === ""
        ? null
        : Number(formData.allottedSeats);

    if (
      maximumSeats !== null &&
      (!Number.isInteger(maximumSeats) ||
        maximumSeats < 0)
    ) {
      setError("Maximum seats must be a valid number.");
      return;
    }

    if (
      allottedSeats !== null &&
      (!Number.isInteger(allottedSeats) ||
        allottedSeats < 0)
    ) {
      setError("Allotted seats must be a valid number.");
      return;
    }

    if (
      maximumSeats !== null &&
      allottedSeats !== null &&
      allottedSeats > maximumSeats
    ) {
      setError(
        "Allotted seats cannot be greater than maximum seats."
      );
      return;
    }

    const payload = {
      userId,
      title: formData.title.trim(),
      visibleOnWebsite: true,
      batchType: formData.batchType,
      description: formData.description.trim(),

      // Backend DB is accepting the fee as a numeric string.
      fee: formData.fee.trim() || null,

      paymentType: formData.paymentType || null,
      startOn: formData.startOn || null,
      endOn: formData.endOn || null,
      eligibleClasses:
        formData.eligibleClasses.trim() || null,
      maximumSeats,
      allottedSeats,
      session: formData.session.trim() || null,
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let response;

      if (editingId) {
        response = await api.put(
          `/batches/${editingId}`,
          payload,
          {
            timeout: 15000,
          }
        );
      } else {
        response = await api.post(
          "/batches/new",
          payload,
          {
            timeout: 15000,
          }
        );
      }

      const data = response.data;

      console.log("Batch API response:", data);

      if (
        data?.status === 200 ||
        data?.status === 201
      ) {
        setSuccess(
          editingId
            ? "Batch updated successfully."
            : "Batch added successfully."
        );

        resetForm();

        // Always reload latest data from backend.
        await fetchBatches(activeFilter);
      } else if (data?.status === 404) {
        setError(
          data?.message ||
            "User or batch was not found."
        );
      } else if (data?.status === 422) {
        setError(
          "Please check the information entered."
        );
      } else {
        setError(
          data?.message ||
            "Unable to save batch. Please try again."
        );
      }
    } catch (err) {
      console.error("Batch API error:", err);
      console.error(
        "Backend response:",
        err.response?.data
      );

      if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else if (err.response?.status === 422) {
        setError(
          "Some batch information is invalid. Please check the form."
        );
      } else if (err.response?.status >= 500) {
        setError(
          err.response?.data?.message ||
            "The server returned an internal error."
        );
      } else if (err.request) {
        setError(
          "Could not connect to the server. Please check your internet connection."
        );
      } else {
        setError(
          "Something went wrong while saving the batch."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (batchId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this batch?"
    );

    if (!confirmed || deletingId) {
      return;
    }

    try {
      setDeletingId(batchId);
      setError("");
      setSuccess("");

      const response = await api.delete(
        `/batches/${batchId}`,
        {
          timeout: 15000,
        }
      );

      const data = response.data;

      if (data?.status === 200) {
        setSuccess("Batch deleted successfully.");

        await fetchBatches(activeFilter);
      } else if (data?.status === 404) {
        setError(
          data?.message ||
            "Batch was not found."
        );
      } else {
        setError(
          data?.message ||
            "Unable to delete batch. Please try again."
        );
      }
    } catch (err) {
      console.error("Delete batch error:", err);

      if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else if (err.response?.status >= 500) {
        setError(
          err.response?.data?.message ||
            "The server returned an internal error."
        );
      } else if (err.request) {
        setError(
          "Could not connect to the server. Please check your internet connection."
        );
      } else {
        setError(
          "Something went wrong while deleting the batch."
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleVisibility = async (
    batchId,
    visible
  ) => {
    const nextVisibility = !visible;

    try {
      setVisibilityId(batchId);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/batches/visibility/${batchId}`,
        null,
        {
          params: {
            visible_on_website: nextVisibility,
          },
          timeout: 15000,
        }
      );

      const data = response.data;

      if (data?.status === 200) {
        setSuccess(
          nextVisibility
            ? "Batch is now visible on your website."
            : "Batch has been hidden from your website."
        );

        setBatches((prev) =>
          prev.map((item) =>
            item.batchId === batchId
              ? {
                  ...item,
                  visibleOnWebsite: nextVisibility,
                }
              : item
          )
        );
      } else if (data?.status === 404) {
        setError(
          data?.message ||
            "Batch was not found."
        );
      } else {
        setError(
          data?.message ||
            "Unable to update website visibility."
        );
      }
    } catch (err) {
      console.error(
        "Batch visibility error:",
        err
      );

      if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else if (err.response?.status >= 500) {
        setError(
          err.response?.data?.message ||
            "The server returned an internal error."
        );
      } else if (err.request) {
        setError(
          "Could not connect to the server. Please check your internet connection."
        );
      } else {
        setError(
          "Something went wrong while updating visibility."
        );
      }
    } finally {
      setVisibilityId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "Not specified";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getTypeLabel = (type) => {
    if (type === "current") return "Current";
    if (type === "upcoming") return "Upcoming";
    if (type === "old") return "Completed";

    return type;
  };

  const getTypeClass = (type) => {
    if (type === "current") {
      return "bg-green-500/10 text-green-300 border-green-500/20";
    }

    if (type === "upcoming") {
      return "bg-blue-500/10 text-blue-300 border-blue-500/20";
    }

    return "bg-[#0a1628] text-[#94a8c7] border-blue-500/10";
  };

  const inputClass =
    "w-full bg-[#0a1628] border border-blue-500/10 rounded-xl px-4 py-3 text-white placeholder-[#617391] outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all";

  const labelClass =
    "block text-sm text-[#c7d8f5] mb-2";

  const filterItems = [
    {
      key: "all",
      label: "All",
    },
    {
      key: "current",
      label: "Current",
    },
    {
      key: "upcoming",
      label: "Upcoming",
    },
    {
      key: "old",
      label: "Completed",
    },
  ];

  if (loading) {
    return (
      <div className="p-5 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-8 min-h-[400px] flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />

            <p className="text-[#94a8c7] mt-4 text-sm">
              Loading batches...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[#94a8c7] text-sm mb-2">
              Tutor Profile
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Batches
            </h1>

            <p className="text-[#94a8c7] mt-2 text-sm sm:text-base">
              Create and manage your tuition batches.
            </p>
          </div>

          {!isFormOpen && (
            <button
              type="button"
              onClick={handleAdd}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 5v14M5 12h14"
                />
              </svg>

              Add Batch
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-300 text-sm">
              {error}
            </p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
            <p className="text-green-300 text-sm">
              {success}
            </p>
          </div>
        )}

        {/* Add / Edit Form */}
        {isFormOpen && (
          <section className="mb-8 bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-7">

            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  {editingId ? "Edit Batch" : "Add Batch"}
                </h2>

                <p className="text-[#6f84a5] text-sm mt-1">
                  Add the details of your tuition batch.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="p-2 rounded-lg text-[#94a8c7] hover:text-white hover:bg-[#142744] transition-colors"
                aria-label="Close form"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 6l12 12M18 6L6 18"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Title */}
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Batch Title{" "}
                    <span className="text-red-400">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Class 10 Mathematics Batch"
                    maxLength={200}
                    className={inputClass}
                  />
                </div>

                {/* Batch Type */}
                <div>
                  <label className={labelClass}>
                    Batch Type{" "}
                    <span className="text-red-400">
                      *
                    </span>
                  </label>

                  <select
                    name="batchType"
                    value={formData.batchType}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="upcoming">
                      Upcoming
                    </option>

                    <option value="current">
                      Current
                    </option>

                    <option value="old">
                      Completed
                    </option>
                  </select>
                </div>

                {/* Session */}
                <div>
                  <label className={labelClass}>
                    Session
                  </label>

                  <input
                    type="text"
                    name="session"
                    value={formData.session}
                    onChange={handleChange}
                    placeholder="e.g. 2026-27"
                    className={inputClass}
                  />
                </div>

                {/* Fee */}
                <div>
                  <label className={labelClass}>
                    Fee
                  </label>

                  <input
                    type="text"
                    name="fee"
                    value={formData.fee}
                    onChange={handleChange}
                    placeholder="e.g. 500"
                    inputMode="numeric"
                    className={inputClass}
                  />

                  <p className="text-[#617391] text-xs mt-2">
                    Enter amount only, e.g. 500.
                  </p>
                </div>

                {/* Payment Type */}
                <div>
                  <label className={labelClass}>
                    Payment Type
                  </label>

                  <select
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="">
                      Select payment type
                    </option>

                    <option value="monthly">
                      Monthly
                    </option>

                    <option value="installment">
                      Installment
                    </option>
                  </select>
                </div>

                {/* Start */}
                <div>
                  <label className={labelClass}>
                    Start Date
                  </label>

                  <input
                    type="date"
                    name="startOn"
                    value={formData.startOn}
                    onChange={handleChange}
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                </div>

                {/* End */}
                <div>
                  <label className={labelClass}>
                    End Date
                  </label>

                  <input
                    type="date"
                    name="endOn"
                    value={formData.endOn}
                    onChange={handleChange}
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                </div>

                {/* Eligible Classes */}
                <div>
                  <label className={labelClass}>
                    Eligible Classes
                  </label>

                  <input
                    type="text"
                    name="eligibleClasses"
                    value={formData.eligibleClasses}
                    onChange={handleChange}
                    placeholder="e.g. Class 8-10"
                    className={inputClass}
                  />
                </div>

                {/* Maximum Seats */}
                <div>
                  <label className={labelClass}>
                    Maximum Seats
                  </label>

                  <input
                    type="number"
                    name="maximumSeats"
                    value={formData.maximumSeats}
                    onChange={handleChange}
                    placeholder="e.g. 30"
                    min="0"
                    className={inputClass}
                  />
                </div>

                {/* Allotted Seats */}
                <div>
                  <label className={labelClass}>
                    Allotted Seats
                  </label>

                  <input
                    type="number"
                    name="allottedSeats"
                    value={formData.allottedSeats}
                    onChange={handleChange}
                    placeholder="e.g. 20"
                    min="0"
                    className={inputClass}
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Description{" "}
                    <span className="text-red-400">
                      *
                    </span>
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe this batch..."
                    rows={5}
                    maxLength={2000}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-blue-500/10 text-[#c7d8f5] hover:bg-[#142744] hover:text-white transition-colors text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto min-w-[150px] bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : editingId ? (
                    "Save Changes"
                  ) : (
                    "Add Batch"
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {filterItems.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeFilter === filter.key
                  ? "bg-blue-600 text-white"
                  : "bg-[#0f1f36] border border-blue-500/10 text-[#94a8c7] hover:text-white hover:bg-[#142744]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {batches.length === 0 ? (
          <div className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-8 sm:p-12 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-white mt-5">
              No batches found
            </h2>

            <p className="text-[#94a8c7] text-sm mt-2">
              Create your first batch to start managing your tuition classes.
            </p>

            {!isFormOpen && (
              <button
                type="button"
                onClick={handleAdd}
                className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl transition-colors text-sm font-medium"
              >
                Add Your First Batch
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            {batches.map((batch) => {
              const visible =
                batch.visibleOnWebsite !== undefined
                  ? Boolean(batch.visibleOnWebsite)
                  : true;

              return (
                <article
                  key={batch.batchId}
                  className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-6"
                >

                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">

                      <h2 className="text-lg sm:text-xl font-semibold text-white break-words">
                        {batch.title}
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 mt-2">

                        <span
                          className={`px-2.5 py-1 rounded-full border text-xs font-medium ${getTypeClass(
                            batch.batchType
                          )}`}
                        >
                          {getTypeLabel(
                            batch.batchType
                          )}
                        </span>

                        {batch.session && (
                          <span className="text-[#6f84a5] text-xs">
                            Session {batch.session}
                          </span>
                        )}

                      </div>
                    </div>

                    <span
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                        visible
                          ? "bg-green-500/10 text-green-300 border border-green-500/20"
                          : "bg-[#0a1628] text-[#6f84a5] border border-blue-500/10"
                      }`}
                    >
                      {visible
                        ? "Website Visible"
                        : "Hidden"}
                    </span>
                  </div>

                  {/* Description */}
                  {batch.description && (
                    <p className="text-[#c7d8f5] text-sm leading-6 mt-4 whitespace-pre-line">
                      {batch.description}
                    </p>
                  )}

                  {/* Details */}
                  <div className="mt-5 grid grid-cols-2 gap-3">

                    <div className="bg-[#0a1628] rounded-xl p-3">
                      <p className="text-[#617391] text-xs">
                        Fee
                      </p>

                      <p className="text-[#c7d8f5] text-sm mt-1">
                        {batch.fee
                          ? `₹${batch.fee}`
                          : "Not specified"}
                      </p>
                    </div>

                    <div className="bg-[#0a1628] rounded-xl p-3">
                      <p className="text-[#617391] text-xs">
                        Payment
                      </p>

                      <p className="text-[#c7d8f5] text-sm mt-1 capitalize">
                        {batch.paymentType ||
                          "Not specified"}
                      </p>
                    </div>

                    <div className="bg-[#0a1628] rounded-xl p-3">
                      <p className="text-[#617391] text-xs">
                        Start
                      </p>

                      <p className="text-[#c7d8f5] text-sm mt-1">
                        {formatDate(batch.startOn)}
                      </p>
                    </div>

                    <div className="bg-[#0a1628] rounded-xl p-3">
                      <p className="text-[#617391] text-xs">
                        End
                      </p>

                      <p className="text-[#c7d8f5] text-sm mt-1">
                        {formatDate(batch.endOn)}
                      </p>
                    </div>

                    <div className="bg-[#0a1628] rounded-xl p-3">
                      <p className="text-[#617391] text-xs">
                        Eligible Classes
                      </p>

                      <p className="text-[#c7d8f5] text-sm mt-1">
                        {batch.eligibleClasses ||
                          "Not specified"}
                      </p>
                    </div>

                    <div className="bg-[#0a1628] rounded-xl p-3">
                      <p className="text-[#617391] text-xs">
                        Seats
                      </p>

                      <p className="text-[#c7d8f5] text-sm mt-1">
                        {batch.allottedSeats ?? 0}

                        {batch.maximumSeats !== null &&
                        batch.maximumSeats !== undefined &&
                        batch.maximumSeats !== ""
                          ? ` / ${batch.maximumSeats}`
                          : ""}
                      </p>
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-blue-500/10 flex flex-wrap gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        handleVisibility(
                          batch.batchId,
                          visible
                        )
                      }
                      disabled={
                        visibilityId === batch.batchId
                      }
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-[#0a1628] text-[#c7d8f5] hover:bg-[#142744] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {visibilityId === batch.batchId
                        ? "Updating..."
                        : visible
                        ? "Hide from Website"
                        : "Show on Website"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(batch)
                      }
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-colors"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(batch.batchId)
                      }
                      disabled={
                        deletingId === batch.batchId
                      }
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === batch.batchId
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>
                </article>
              );
            })}

          </div>
        )}

        <div className="pb-6" />
      </div>
    </div>
  );
}

export default Batches;
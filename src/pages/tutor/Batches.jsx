import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
import "./Batches.css";

function BatchDetail({ icon, value, label }) {
  const iconPaths = {
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    money: (
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    ),
    class: (
      <path d="M3 5h18M5 5v14h14V5M8 9h8M8 13h5" />
    ),
  };

  return (
    <div className="batch-detail">
      <span className="batch-detail-icon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {iconPaths[icon]}
        </svg>
      </span>
      <span className="batch-detail-copy">
        <strong>{value}</strong>
        <span>{label}</span>
      </span>
    </div>
  );
}

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
  visibleOnWebsite: true,
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
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [batchImageUrl, setBatchImageUrl] = useState("");
  const [batchImageFile, setBatchImageFile] = useState(null);
  const [batchImagePreview, setBatchImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getUserId = useCallback(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.user_id;
    } catch {
      return null;
    }
  }, []);

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
  const normalizeBatch = useCallback((batch) => ({
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

    imageUrl:
      batch?.imageUrl ??
      batch?.imageurl ??
      batch?.batchImage ??
      batch?.batchimage ??
      batch?.image ??
      "",

    visibleOnWebsite:
      batch?.visibleOnWebsite ??
      batch?.visibleonwebsite,
  }), []);

  const fetchBatches = useCallback(async (filter = "all") => {
    const userId = getUserId();

    if (!userId) {
      return Promise.resolve().then(() => {
        setError("Your login session could not be found. Please login again.");
        setLoading(false);
      });
    }

    try {
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
      setError("");

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
  }, [getUserId, normalizeBatch]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchBatches("all"));
  }, [fetchBatches]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let nextValue = e.target.type === "checkbox" ? e.target.checked : value;

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
    setBatchImageUrl("");
    setBatchImageFile(null);
    setBatchImagePreview("");
    setIsFormOpen(false);
  };

  const handleAdd = () => {
    setFormData(initialForm);
    setEditingId(null);
    setBatchImageUrl("");
    setBatchImageFile(null);
    setBatchImagePreview("");
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
      visibleOnWebsite: batch.visibleOnWebsite ?? true,
    });

    setBatchImageUrl(batch.imageUrl ?? "");
    setBatchImageFile(null);
    setBatchImagePreview(batch.imageUrl ?? "");
    setEditingId(batch.batchId);
    setIsFormOpen(true);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image for the batch.");
      return;
    }

    setBatchImageFile(file);
    setBatchImagePreview(URL.createObjectURL(file));
    setError("");
    setSuccess("");
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
      formData.startOn &&
      formData.endOn &&
      formData.startOn > formData.endOn
    ) {
      setError("End date must be on or after the start date.");
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
        maximumSeats < 0 ||
        maximumSeats > 100000)
    ) {
      setError("Maximum seats must be a valid number.");
      return;
    }

    if (
      allottedSeats !== null &&
      (!Number.isInteger(allottedSeats) ||
        allottedSeats < 0 ||
        allottedSeats > 100000)
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
      visibleOnWebsite: formData.visibleOnWebsite,
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

      let imageUrl = batchImageUrl;
      if (batchImageFile) {
        setUploadingImage(true);
        const uploadData = new FormData();
        uploadData.append("file", batchImageFile);
        const uploadResponse = await api.post("/batches/image", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        });
        const uploadResult = uploadResponse.data?.data;
        imageUrl =
          (typeof uploadResult === "string" ? uploadResult : null) ??
          uploadResult?.fileUrl ??
          uploadResponse.data?.fileUrl ??
          "";
        if (
          ![200, 201].includes(uploadResponse.data?.status) ||
          !imageUrl
        ) {
          throw new Error(
            uploadResponse.data?.message ||
              "The batch image upload did not return an image URL."
          );
        }
      }

      const batchPayload = {
        ...payload,
        ...(imageUrl ? { imageUrl } : {}),
      };

      let response;

      if (editingId) {
        response = await api.put(
          `/batches/${editingId}`,
          batchPayload,
          {
            timeout: 15000,
          }
        );
      } else {
        response = await api.post(
          "/batches/new",
          batchPayload,
          {
            timeout: 15000,
          }
        );
      }

      const data = response.data;

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
        await fetchBatches("all");
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
      if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else if (err.response?.status === 413) {
        setError("The batch image is too large to upload. Choose a smaller image.");
      } else if (err.response?.status === 415) {
        setError("Choose a valid JPEG, PNG, or WebP image.");
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
      setUploadingImage(false);
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

        await fetchBatches("all");
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

  const getTypeClass = (type) =>
    `batch-status--${type === "current" ? "current" : type === "old" ? "old" : "upcoming"}`;

  const inputClass = "batch-input";
  const labelClass = "batch-label";

  const filterItems = [
    { key: "all", label: "All batches" },
    { key: "upcoming", label: "Upcoming" },
    { key: "current", label: "Running" },
    { key: "old", label: "Past" },
  ];

  const visibleBatches = batches.filter((batch) =>
    activeFilter === "all" || batch.batchType === activeFilter
  );
  const filteredBatches = visibleBatches.filter((batch) =>
    [
      batch.title,
      batch.session,
      batch.eligibleClasses,
      batch.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );
  const upcomingCount = batches.filter((batch) => batch.batchType === "upcoming").length;
  const currentCount = batches.filter((batch) => batch.batchType === "current").length;
  const availableSeats = batches
    .filter((batch) => batch.batchType !== "old")
    .reduce((total, batch) => {
      const maximum = Number(batch.maximumSeats);
      const filled = Number(batch.allottedSeats) || 0;
      return total + (Number.isFinite(maximum) ? Math.max(0, maximum - filled) : 0);
    }, 0);
  const estimatedRevenue = batches
    .filter((batch) => batch.batchType !== "old")
    .reduce((total, batch) => {
      const fee = Number(String(batch.fee ?? "").replace(/[^\d.]/g, ""));
      const filled = Number(batch.allottedSeats) || 0;
      return total + (Number.isFinite(fee) ? fee * filled : 0);
    }, 0);
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  if (loading) {
    return (
      <div className="batch-page">
        <div className="batch-loading">
          <span className="batch-spinner" />
          <p>Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="batch-page">
      <div className="batch-content">
        <header className="batch-heading">
          <div>
            <h1>Batches</h1>
            <p>Organize your classes, track seats, and manage what students can see.</p>
          </div>
          <button type="button" onClick={handleAdd} className="batch-button batch-button--primary">
            <span aria-hidden="true">＋</span> New batch
          </button>
        </header>

        <div className="batch-summary">
          <div className="batch-stat"><span>Total batches</span><strong>{batches.length}</strong></div>
          <div className="batch-stat"><span>Upcoming batches</span><strong>{upcomingCount}</strong></div>
          <div className="batch-stat"><span>Running batches</span><strong>{currentCount}</strong></div>
          <div className="batch-stat"><span>Seats available</span><strong>{availableSeats}</strong></div>
          <div className="batch-stat"><span>Estimated revenue</span><strong>{formatCurrency(estimatedRevenue)}</strong><small>Based on enrolled seats</small></div>
        </div>

        {/* Error */}
        {error && (
          <div className="batch-alert batch-alert--error" role="alert">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="batch-alert batch-alert--success" role="status">
            {success}
          </div>
        )}

        {/* Add / Edit Form */}
        {isFormOpen && (
          <div className="batch-modal-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) resetForm();
          }}>
          <section className="batch-modal" role="dialog" aria-modal="true" aria-labelledby="batchFormTitle">

            <div className="batch-modal-head">
              <div>
                <h2 id="batchFormTitle">
                  {editingId ? "Edit Batch" : "Add Batch"}
                </h2>

                <p>
                  Add the details of your tuition batch.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="batch-close"
                aria-label="Close form"
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="batch-form"
            >
              <div className="batch-form-grid">

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

                <div className="batch-image-field">
                  <label className={labelClass}>Batch image</label>
                  <label className="batch-upload">
                    {batchImagePreview ? (
                      <img src={batchImagePreview} alt="Batch preview" />
                    ) : (
                      <span className="batch-upload-icon" aria-hidden="true">↑</span>
                    )}
                    <strong>{uploadingImage ? "Uploading image…" : batchImagePreview ? "Change batch image" : "Choose an image for this batch"}</strong>
                    <span>JPG, PNG or WebP</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      disabled={saving}
                    />
                  </label>
                </div>
              </div>

              <label className="batch-checkbox">
                <input
                  type="checkbox"
                  name="visibleOnWebsite"
                  checked={formData.visibleOnWebsite}
                  onChange={handleChange}
                />
                <span>Visible on website</span>
              </label>
              <div className="batch-form-actions">

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="batch-button"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="batch-button batch-button--primary"
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
          </div>
        )}

        {/* Filters */}
        <div className="batch-toolbar">
          <div className="batch-tabs" role="tablist" aria-label="Filter batches">
          {filterItems.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              role="tab"
              aria-selected={activeFilter === filter.key}
              className={`batch-tab ${activeFilter === filter.key ? "is-active" : ""}`}
            >
              {filter.label}
            </button>
          ))}
          </div>
          <div className="batch-toolbar-right">
            <input
              type="search"
              className="batch-search"
              placeholder="Search batches"
              aria-label="Search batches"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="batch-view-toggle" aria-label="Batch layout">
              <button type="button" className={viewMode === "list" ? "is-active" : ""} onClick={() => setViewMode("list")}>☷ <span>List</span></button>
              <button type="button" className={viewMode === "grid" ? "is-active" : ""} onClick={() => setViewMode("grid")}>▦ <span>Grid</span></button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredBatches.length === 0 ? (
          <div className="batch-empty">

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

            <h2>{batches.length === 0 ? "No batches yet" : "No matching batches"}</h2>

            <p>{batches.length === 0 ? "Create your first batch to start managing your tuition classes." : "Try another search or choose a different batch type."}</p>

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
        ) : viewMode === "list" ? (
          <div className="batch-table-wrap" role="region" aria-label="Batch list" tabIndex="0">
            <table className="batch-table">
              <thead>
                <tr>
                  <th scope="col">Batch</th>
                  <th scope="col">Type</th>
                  <th scope="col">Dates</th>
                  <th scope="col">Fee</th>
                  <th scope="col">Seats</th>
                  <th scope="col">Website</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch) => {
                  const visible = batch.visibleOnWebsite !== undefined
                    ? Boolean(batch.visibleOnWebsite)
                    : true;

                  return (
                    <tr key={batch.batchId}>
                      <td className="batch-table-title">
                        <strong>{batch.title}</strong>
                        <span>{batch.session ? `Session ${batch.session}` : batch.eligibleClasses || "No session specified"}</span>
                      </td>
                      <td><span className={`batch-status ${getTypeClass(batch.batchType)}`}>{getTypeLabel(batch.batchType)}</span></td>
                      <td className="batch-table-dates">{formatDate(batch.startOn)}<br />{formatDate(batch.endOn)}</td>
                      <td>{batch.fee ? `₹${batch.fee}` : "—"}</td>
                      <td>{batch.allottedSeats ?? 0} / {batch.maximumSeats || "—"}</td>
                      <td>
                        <button
                          type="button"
                          className={`batch-switch ${visible ? "is-on" : ""}`}
                          aria-label={`${visible ? "Hide" : "Show"} ${batch.title} on website`}
                          aria-pressed={visible}
                          onClick={() => handleVisibility(batch.batchId, visible)}
                          disabled={visibilityId === batch.batchId}
                        />
                      </td>
                      <td>
                        <div className="batch-row-actions">
                          <button type="button" className="batch-button batch-button--small" onClick={() => handleEdit(batch)}>Edit</button>
                          <button
                            type="button"
                            className="batch-button batch-button--small batch-button--danger"
                            onClick={() => handleDelete(batch.batchId)}
                            disabled={deletingId === batch.batchId}
                          >
                            {deletingId === batch.batchId ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="batch-grid">

            {filteredBatches.map((batch) => {
              const visible =
                batch.visibleOnWebsite !== undefined
                  ? Boolean(batch.visibleOnWebsite)
                  : true;

              return (
                <article
                  key={batch.batchId}
                  className="batch-card"
                >
                  <div className="batch-card-top">
                    <div className="batch-card-heading">
                      <h2 className="batch-card-title">{batch.title}</h2>
                      {batch.session && (
                        <span className="batch-session">Session {batch.session}</span>
                      )}
                    </div>
                    <div className="batch-card-actions">
                      <span className={`batch-status ${getTypeClass(batch.batchType)}`}>
                        {getTypeLabel(batch.batchType)}
                      </span>
                      <button
                        type="button"
                        className="batch-button batch-button--small"
                        onClick={() => handleEdit(batch)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="batch-button batch-button--small batch-button--danger"
                        onClick={() => handleDelete(batch.batchId)}
                        disabled={deletingId === batch.batchId}
                      >
                        {deletingId === batch.batchId ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>

                  {batch.description && (
                    <p className="batch-description">
                      {batch.description}
                    </p>
                  )}

                  <div className="batch-details">
                    <BatchDetail
                      icon="calendar"
                      value={formatDate(batch.startOn)}
                      label="Start date"
                    />
                    <BatchDetail
                      icon="calendar"
                      value={formatDate(batch.endOn)}
                      label="End date"
                    />
                    <BatchDetail
                      icon="money"
                      value={`${batch.fee ? `₹${batch.fee}` : "Not specified"}${batch.paymentType ? ` / ${batch.paymentType === "monthly" ? "month" : batch.paymentType}` : ""}`}
                      label="Course fee"
                    />
                    <BatchDetail
                      icon="class"
                      value={batch.eligibleClasses || "Not specified"}
                      label="Eligible classes"
                    />
                  </div>

                  <div className="batch-seats">
                    <div className="batch-seatline">
                      <span>Seats filled</span>
                      <strong>{batch.allottedSeats ?? 0} of {batch.maximumSeats || "—"}</strong>
                    </div>
                    <div
                      className="batch-progress"
                      role="progressbar"
                      aria-label={`${batch.title} seats filled`}
                      aria-valuemin={0}
                      aria-valuemax={Number(batch.maximumSeats) || 0}
                      aria-valuenow={Math.min(Number(batch.allottedSeats) || 0, Number(batch.maximumSeats) || 0)}
                    >
                      <i style={{ width: `${batch.maximumSeats ? Math.min(100, (Number(batch.allottedSeats || 0) / Number(batch.maximumSeats)) * 100) : 0}%` }} />
                    </div>
                  </div>

                  <div className="batch-card-footer">
                    <label className="batch-visibility-control">
                      <button
                        type="button"
                        className={`batch-switch ${visible ? "is-on" : ""}`}
                        aria-label={`${visible ? "Hide" : "Show"} ${batch.title} on website`}
                        aria-pressed={visible}
                        onClick={() => handleVisibility(batch.batchId, visible)}
                        disabled={visibilityId === batch.batchId}
                      />
                      <span>Visible on website</span>
                    </label>
                    <span className="batch-publish-status">
                      {visibilityId === batch.batchId
                        ? "Updating…"
                        : visible ? "Published" : "Hidden"}
                    </span>
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
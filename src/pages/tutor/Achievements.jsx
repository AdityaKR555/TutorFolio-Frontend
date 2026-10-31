import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
import "./Achievements.css";

const initialForm = {
  title: "",
  description: "",
  studentName: "",
  studentReview: "",
  studentRating: "",
  batchId: "",
  tags: "",
  youtubeVideoLink: "",
  achievementImageUrl: "",
  studentImageUrl: "",
};

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StudentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
    </svg>
  );
}

const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.user_id;
  } catch {
    return null;
  }
};

const normalizeBatch = (batch) => ({
  batchId: batch?.batchId ?? batch?.batchid ?? batch?.id ?? null,
  userId: batch?.userId ?? batch?.userid ?? null,
  title: batch?.title ?? "",
  batchType:
    batch?.batchType ?? batch?.batchtype ?? batch?.type ?? "upcoming",
  description: batch?.description ?? "",
  fee:
    batch?.fee !== null && batch?.fee !== undefined
      ? String(batch.fee)
      : "",
  paymentType: batch?.paymentType ?? batch?.paymenttype ?? "",
  startOn: batch?.startOn ?? batch?.starton ?? "",
  endOn: batch?.endOn ?? batch?.endon ?? "",
  eligibleClasses: batch?.eligibleClasses ?? batch?.eligibleclasses ?? "",
  maximumSeats: batch?.maximumSeats ?? batch?.maximumseats ?? "",
  allottedSeats: batch?.allottedSeats ?? batch?.allottedseats ?? "",
  session: batch?.session ?? "",
});

function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [visibilityId, setVisibilityId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [achievementImagePreview, setAchievementImagePreview] = useState("");
  const [studentImageFile, setStudentImageFile] = useState(null);
  const [studentImagePreview, setStudentImagePreview] = useState("");
  const [uploadingAchievementImage, setUploadingAchievementImage] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAchievements = useCallback(async () => {
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
        `/achievements/getAll/${userId}`,
        {
          timeout: 15000,
        }
      );

      const data = response.data;

      if (data?.status === 200) {
        const rawList = Array.isArray(data?.details)
          ? data.details
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.details)
          ? data.data.details
          : [];

        // Newest achievement first
        const sortedList = [...rawList].sort(
          (a, b) =>
            Number(b?.achievementId ?? 0) -
            Number(a?.achievementId ?? 0)
        );

        setAchievements(sortedList);
        return sortedList;
      } else if (data?.status === 404) {
        setAchievements([]);
        return [];
      } else {
        setError(
          data?.message ||
            "Unable to load achievements. Please try again."
        );
      }
    } catch (err) {
      console.error("Fetch achievements error:", err);
      console.error(
        "Backend response:",
        err.response?.data
      );

      if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else if (err.response?.status === 422) {
        setError("The achievements request was invalid.");
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
          "Something went wrong while loading achievements."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBatches = useCallback(async () => {
    const userId = getUserId();

    if (!userId) {
      return;
    }

    try {
      setBatchesLoading(true);

      const response = await api.get(
        "/batches/getAll/all",
        {
          params: {
            user_id: userId,
          },
          timeout: 15000,
        }
      );

      const data = response.data;

      if (data?.status === 200) {
        const rawList = Array.isArray(data?.details)
          ? data.details
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.details)
          ? data.data.details
          : [];

        const normalizedList = rawList
          .map(normalizeBatch)
          .filter(
            (batch) => batch.batchId !== null
          );

        setBatches(normalizedList);
      } else if (data?.status === 404) {
        setBatches([]);
      } else {
        console.error(
          "Unable to load batches:",
          data
        );
      }
    } catch (err) {
      console.error("Fetch batches error:", err);
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchAchievements();
        fetchBatches();
      }
    });
    return () => {
      active = false;
    };
  }, [fetchAchievements, fetchBatches]);

  useEffect(() => {
    return () => {
      if (studentImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(studentImagePreview);
      }
    };
  }, [studentImagePreview]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setAchievementImagePreview("");
    setStudentImageFile(null);
    setStudentImagePreview("");
    setIsFormOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleAdd = () => {
    setFormData(initialForm);
    setEditingId(null);
    setAchievementImagePreview("");
    setStudentImageFile(null);
    setStudentImagePreview("");
    setIsFormOpen(true);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleEdit = (achievement) => {
    setFormData({
      title: achievement.title ?? "",
      description: achievement.description ?? "",
      studentName: achievement.studentName ?? "",
      studentReview: achievement.studentReview ?? "",
      studentRating:
        achievement.studentRating ?? "",
      batchId:
        achievement.batchId !== null &&
        achievement.batchId !== undefined
          ? String(achievement.batchId)
          : "",
      tags: achievement.tags ?? "",
      youtubeVideoLink: achievement.youtubeVideoLink ?? "",
      achievementImageUrl:
        achievement.achievementImageUrl ??
        achievement.imageUrl ??
        achievement.achievementImage ??
        "",
      studentImageUrl:
        achievement.studentImageUrl ??
        achievement.studentImage ??
        achievement.studentimage ??
        "",
    });
    setAchievementImagePreview(
      achievement.achievementImageUrl ??
      achievement.imageUrl ??
      achievement.achievementImage ??
      ""
    );
    setStudentImageFile(null);
    setStudentImagePreview(
      achievement.studentImageUrl ??
      achievement.studentImage ??
      achievement.studentimage ??
      ""
    );

    setEditingId(achievement.achievementId);
    setIsFormOpen(true);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleImageChange = async (event, type) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (type === "student") {
      setStudentImageFile(file);
      setStudentImagePreview(URL.createObjectURL(file));
      setError("");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      setUploadingAchievementImage(true);
      setError("");
      const response = await api.post("/achievements/image", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });
      const data = response.data;
      const uploadResult = data?.data;
      const imageUrl =
        (typeof uploadResult === "string" ? uploadResult : null) ??
        uploadResult?.fileUrl ??
        data?.fileUrl;

      if ((data?.status === 200 || data?.status === 201) && imageUrl) {
        setFormData((previous) => ({
          ...previous,
          achievementImageUrl: imageUrl,
        }));
        setAchievementImagePreview(imageUrl);
      } else {
        setError(data?.message || "The image upload did not return an image URL.");
      }
    } catch (err) {
      if (err.response?.status === 413) {
        setError("This image is too large to upload. Choose a smaller image.");
      } else if (err.response?.status === 422 || err.response?.status === 415) {
        setError("Choose a valid JPEG, PNG, or WebP image.");
      } else if (err.response?.status >= 500) {
        setError("The server is currently unavailable. Please try again in a moment.");
      } else if (err.request) {
        setError("Could not connect to the server. Please check your internet connection.");
      } else {
        setError("Something went wrong while uploading the achievement image.");
      }
    } finally {
      setUploadingAchievementImage(false);
    }
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
      setError("Achievement title is required.");
      return;
    }

    if (uploadingAchievementImage) {
      setError("Wait for the achievement image to finish uploading.");
      return;
    }

    if (
      formData.youtubeVideoLink.trim() &&
      !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(
        formData.youtubeVideoLink.trim()
      )
    ) {
      setError("Enter a valid YouTube video URL.");
      return;
    }

    const studentRating =
      formData.studentRating === ""
        ? null
        : Number(formData.studentRating);

    if (
      studentRating !== null &&
      (!Number.isInteger(studentRating) ||
        studentRating < 1 ||
        studentRating > 5)
    ) {
      setError("Student rating must be between 1 and 5.");
      return;
    }

    const batchId =
      formData.batchId === ""
        ? null
        : Number(formData.batchId);

    if (
      batchId !== null &&
      !batches.some(
        (batch) => Number(batch.batchId) === batchId
      )
    ) {
      setError("Please select a valid batch.");
      return;
    }

    const payload = {
      userId,
      title: formData.title.trim(),
      description:
        formData.description.trim() || null,
      studentName:
        formData.studentName.trim() || null,
      studentReview:
        formData.studentReview.trim() || null,
      studentRating,
      batchId,
      createdBy: userId,
      tags: formData.tags.trim() || null,
      youtubeVideoLink: formData.youtubeVideoLink.trim() || null,
      imageUrl: formData.achievementImageUrl || null,
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let response;

      if (editingId) {
        response = await api.put(
          `/achievements/${editingId}`,
          payload,
          {
            timeout: 15000,
          }
        );
      } else {
        response = await api.post(
          "/achievements/new",
          payload,
          {
            timeout: 15000,
          }
        );
      }

      const data = response.data;

      console.log("Achievement API response:", data);

      if (
        data?.status === 200 ||
        data?.status === 201
      ) {
        let photoError = "";
        if (studentImageFile) {
          let achievementId = editingId;
          if (!achievementId) {
            const result = data?.data ?? data?.details ?? {};
            achievementId =
              result?.achievementId ??
              result?.achievement_id ??
              result?.id ??
              null;
          }
          if (!achievementId) {
            const latestAchievements = await fetchAchievements();
            const matchingAchievement = latestAchievements?.find(
              (item) =>
                item.title === payload.title &&
                (item.studentName ?? "") === (payload.studentName ?? "") &&
                Number(item.batchId ?? 0) === Number(payload.batchId ?? 0)
            );
            achievementId = matchingAchievement?.achievementId ?? null;
          }

          if (achievementId) {
            const photoData = new FormData();
            photoData.append("achievementId", String(achievementId));
            photoData.append("file", studentImageFile);
            try {
              const photoResponse = await api.post(
                "/achievements/studentImage",
                photoData,
                {
                  headers: { "Content-Type": "multipart/form-data" },
                  timeout: 30000,
                }
              );
              if (photoResponse.data?.status !== 200) {
                photoError = photoResponse.data?.message || "Student photo could not be uploaded.";
              }
            } catch (photoUploadError) {
              photoError =
                photoUploadError.response?.data?.message ||
                "Achievement saved, but the student photo could not be uploaded.";
            }
          } else {
            photoError = "Achievement saved, but its ID was unavailable for uploading the student photo.";
          }
        }

        setSuccess(
          `${editingId ? "Achievement updated" : "Achievement added"} successfully.${photoError ? ` ${photoError}` : ""}`
        );
        resetForm();
        await fetchAchievements();
      } else if (data?.status === 404) {
        setError(
          data?.message ||
            "User or achievement was not found."
        );
      } else if (data?.status === 422) {
        setError(
          "Please check the information entered."
        );
      } else {
        setError(
          data?.message ||
            "Unable to save achievement. Please try again."
        );
      }
    } catch (err) {
      console.error("Achievement API error:", err);
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
          "Some achievement information is invalid."
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
          "Something went wrong while saving the achievement."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (achievementId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this achievement?"
    );

    if (!confirmed || deletingId) {
      return;
    }

    try {
      setDeletingId(achievementId);
      setError("");
      setSuccess("");

      const response = await api.delete(
        `/achievements/${achievementId}`,
        {
          timeout: 15000,
        }
      );

      const data = response.data;

      if (data?.status === 200) {
        setSuccess(
          "Achievement deleted successfully."
        );

        await fetchAchievements();
      } else {
        setError(
          data?.message ||
            "Unable to delete achievement. Please try again."
        );
      }
    } catch (err) {
      console.error(
        "Delete achievement error:",
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
          "Something went wrong while deleting the achievement."
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleVisibility = async (achievement) => {
    const achievementId =
      achievement.achievementId;

    const currentVisibility = Boolean(
      achievement.visibleOnWeb
    );

    const nextVisibility = !currentVisibility;

    try {
      setVisibilityId(achievementId);
      setError("");
      setSuccess("");

      const response = await api.get(
        "/achievements/visibleOnWeb",
        {
          params: {
            achievementId,
            visibleOnWebsite: nextVisibility,
          },
          timeout: 15000,
        }
      );

      const data = response.data;

      if (data?.status === 200) {
        setAchievements((prev) =>
          prev.map((item) =>
            item.achievementId === achievementId
              ? {
                  ...item,
                  visibleOnWeb: nextVisibility,
                }
              : item
          )
        );

        setSuccess(
          nextVisibility
            ? "Achievement is now visible on your website."
            : "Achievement has been hidden from your website."
        );
      } else {
        setError(
          data?.message ||
            "Unable to update website visibility."
        );
      }
    } catch (err) {
      console.error(
        "Achievement visibility error:",
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

  const getBatchLabel = (batch) => {
    const type =
      batch.batchType === "current"
        ? "Current"
        : batch.batchType === "upcoming"
        ? "Upcoming"
        : batch.batchType === "old"
        ? "Completed"
        : "";

    const session = batch.session
      ? ` • ${batch.session}`
      : "";

    return `${batch.title}${
      type ? ` (${type})` : ""
    }${session}`;
  };

  const filteredAchievements = achievements.filter((achievement) =>
    [
      achievement.title,
      achievement.studentName,
      achievement.description,
      achievement.tags,
      achievement.studentReview,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const visibleCount = achievements.filter(
    (achievement) => Boolean(achievement.visibleOnWeb)
  ).length;
  const hiddenCount = achievements.length - visibleCount;

  const inputClass =
    "achievement-input";

  const labelClass =
    "achievement-label";

  if (loading) {
    return (
      <div className="achievements-page">
        <div className="achievements-loading">
          <span className="achievements-spinner" />
          <p>Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-page">
      <div className="achievements-content">
        <header className="achievements-heading">
          <div>
            <h1>Student achievements</h1>
            <p>Celebrate student progress and manage what appears on your website.</p>
          </div>
          {!isFormOpen && (
            <button type="button" onClick={handleAdd} className="achievement-button achievement-button--primary">
              <span aria-hidden="true">＋</span> Add achievement
            </button>
          )}
        </header>

        <div className="achievement-summary">
          <div className="achievement-stat"><span>Total achievements</span><strong>{achievements.length}</strong></div>
          <div className="achievement-stat"><span>Visible on website</span><strong>{visibleCount}</strong></div>
          <div className="achievement-stat"><span>Hidden</span><strong>{hiddenCount}</strong></div>
        </div>

        {/* Error */}
        {error && (
          <div className="achievement-alert achievement-alert--error" role="alert">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="achievement-alert achievement-alert--success" role="status">
            {success}
          </div>
        )}

        <div className="achievement-list-heading">
          <div>
            <h2>Your achievements</h2>
            <p>Turn website visibility on or off for each item.</p>
          </div>
          <div className="achievement-search">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search achievements"
              aria-label="Search achievements"
            />
            <button type="button" className="achievement-button" onClick={() => setSearch(search.trim())}>Search</button>
          </div>
        </div>

        {/* Form */}
        {isFormOpen && (
          <div
            className="achievement-modal-backdrop"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !saving &&
                !uploadingAchievementImage
              ) {
                resetForm();
              }
            }}
          >
          <section className="achievement-modal" role="dialog" aria-modal="true" aria-labelledby="achievementFormTitle">

            <div className="achievement-modal-heading">
              <div>
                <h2 id="achievementFormTitle">
                  {editingId
                    ? "Edit achievement"
                    : "Add achievement"}
                </h2>

                <p>
                  Add a student success story to your tutor profile.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="achievement-close"
                aria-label="Close form"
                disabled={saving || uploadingAchievementImage}
              >
                ×
              </button>
            </div>

            {error && (
              <div className="achievement-modal-error" role="alert">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="achievement-form"
            >
              <div className="achievement-form-grid">

                {/* Title */}
                <div className="achievement-field achievement-field--full">
                  <label className={labelClass}>
                    Achievement title <span className="achievement-required">*</span>
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Scored 95% in Class 10"
                    maxLength={255}
                    required
                    className={inputClass}
                  />
                </div>

                {/* Student Name */}
                <div className="achievement-field">
                  <label className={labelClass}>
                    Student name
                  </label>

                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    maxLength={200}
                    className={inputClass}
                  />
                </div>

                {/* Rating */}
                <div className="achievement-field">
                  <label className={labelClass}>
                    Student rating
                  </label>

                  <select
                    name="studentRating"
                    value={formData.studentRating}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">No rating</option>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>{rating} {rating === 1 ? "star" : "stars"}</option>
                    ))}
                  </select>
                </div>

                {/* Batch */}
                <div className="achievement-field">
                  <label className={labelClass}>
                    Batch
                  </label>

                  <select
                    name="batchId"
                    value={formData.batchId}
                    onChange={handleChange}
                    disabled={batchesLoading}
                    className={`${inputClass} appearance-none disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <option value="">
                      {batchesLoading
                        ? "Loading batches..."
                        : batches.length === 0
                        ? "No batches available"
                        : "Select a batch (optional)"}
                    </option>

                    {batches.map((batch) => (
                      <option
                        key={batch.batchId}
                        value={batch.batchId}
                      >
                        {getBatchLabel(batch)}
                      </option>
                    ))}
                  </select>

                  <p className="achievement-helper">
                    Leave empty if this achievement is not linked to a batch.
                  </p>
                  <a className="achievement-add-batch" href="/batches">Add new batch <span aria-hidden="true">↗</span></a>
                </div>

                {/* Tags */}
                <div className="achievement-field">
                  <label className={labelClass}>
                    Tags
                  </label>

                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="e.g. board exam, maths, cbse"
                    maxLength={1000}
                    className={inputClass}
                  />
                  {!!formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean).length && (
                    <div className="achievement-tag-preview" aria-live="polite">
                      {formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag, index) => (
                        <span className="achievement-tag" key={`${tag}-${index}`}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <span className="achievement-helper">Type a comma after each tag to add it.</span>
                </div>

                {/* Description */}
                <div className="achievement-field achievement-field--full">
                  <label className={labelClass}>
                    Achievement Description
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the student's achievement..."
                    rows={4}
                    maxLength={5000}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* Review */}
                <div className="achievement-field achievement-field--full">
                  <label className={labelClass}>
                    Student Review
                  </label>

                  <textarea
                    name="studentReview"
                    value={formData.studentReview}
                    onChange={handleChange}
                    placeholder="What did the student say about your teaching?"
                    rows={4}
                    maxLength={5000}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="achievement-field achievement-field--full">
                  <label className={labelClass}>YouTube video link</label>
                  <input
                    type="url"
                    name="youtubeVideoLink"
                    value={formData.youtubeVideoLink}
                    onChange={handleChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                    maxLength={2048}
                    className={inputClass}
                  />
                  <span className="achievement-helper">Optional. Add a video related to this achievement.</span>
                </div>

                <div className="achievement-upload-grid achievement-field--full">
                  <div className={`achievement-upload${achievementImagePreview ? " has-image" : ""}`}>
                    <label className="achievement-upload-label" htmlFor="achievementImageFile">
                      {achievementImagePreview ? (
                        <img src={achievementImagePreview} alt="Achievement preview" />
                      ) : (
                        <span className="achievement-upload-icon" aria-hidden="true">
                          <UploadIcon />
                        </span>
                      )}
                      <strong>{uploadingAchievementImage ? "Uploading image..." : "Achievement image"}</strong>
                      <span className="achievement-helper">Choose an image for this achievement</span>
                    </label>
                    <input
                      id="achievementImageFile"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => handleImageChange(event, "achievement")}
                      disabled={uploadingAchievementImage || saving}
                    />
                    <span className="achievement-upload-formats">JPG, PNG or WebP</span>
                  </div>
                  <div className={`achievement-upload${studentImagePreview ? " has-image" : ""}`}>
                    <label className="achievement-upload-label" htmlFor="studentImageFile">
                      {studentImagePreview ? (
                        <img src={studentImagePreview} alt="Student preview" />
                      ) : (
                        <span className="achievement-upload-icon" aria-hidden="true">
                          <StudentIcon />
                        </span>
                      )}
                      <strong>Student photo</strong>
                      <span className="achievement-helper">Add a photo of the student</span>
                    </label>
                    <input
                      id="studentImageFile"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => handleImageChange(event, "student")}
                      disabled={saving}
                    />
                    <span className="achievement-upload-formats">JPG, PNG or WebP</span>
                  </div>
                </div>

              </div>

              <div className="achievement-form-actions">

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving || uploadingAchievementImage}
                  className="achievement-button"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || uploadingAchievementImage}
                  className="achievement-button achievement-button--primary"
                >
                  {saving ? (
                    <>
                      <span className="achievements-spinner achievements-spinner--small" />
                      Saving...
                    </>
                  ) : editingId ? (
                    "Save Changes"
                  ) : (
                    "Add Achievement"
                  )}
                </button>

              </div>
            </form>
          </section>
          </div>
        )}

        {/* Achievement List */}
        {filteredAchievements.length === 0 ? (
          <div className="achievement-empty">

            <div className="achievement-empty-icon">
              <svg
                className="achievement-empty-star"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M12 3l2.4 4.9L20 8.7l-4 3.9.9 5.5L12 15.5l-4.9 2.6.9-5.5 5.6-.8L12 3z"
                />
              </svg>
            </div>

            <h2>
              {search ? "No matching achievements" : "No achievements yet"}
            </h2>

            <p>
              {search
                ? "Try another search or add a new achievement."
                : "Add your first student achievement to start building your profile."}
            </p>

            {!isFormOpen && (
              <button
                type="button"
                onClick={handleAdd}
                className="achievement-button achievement-button--primary"
              >
                Add Your First Achievement
              </button>
            )}

          </div>
        ) : (
          <div className="achievement-cards">

            {filteredAchievements.map((achievement) => {
              const visible = Boolean(
                achievement.visibleOnWeb
              );
              const studentPhoto =
                achievement.studentImageUrl ??
                achievement.studentImage ??
                achievement.studentimage;
              const achievementPhoto =
                achievement.achievementImageUrl ??
                achievement.imageUrl ??
                achievement.achievementImage;
              const rating = Number(achievement.studentRating);
              const batch = batches.find(
                (item) => Number(item.batchId) === Number(achievement.batchId)
              );

              return (
                <article
                  key={achievement.achievementId}
                  className="achievement-card"
                >

                  {/* Header */}
                  <div className="achievement-card-top">

                    <div className="achievement-card-person">
                      <span className="achievement-avatar">
                        {studentPhoto ? (
                          <img src={studentPhoto} alt={achievement.studentName || "Student"} />
                        ) : (
                          <StudentIcon />
                        )}
                      </span>
                      <div className="achievement-card-person-copy">
                      <h2>
                        {achievement.title}
                      </h2>

                      {achievement.studentName && (
                        <p className="achievement-student-name">
                          {achievement.studentName}
                        </p>
                      )}
                      {rating > 0 && (
                        <span className="achievement-stars" aria-label={`${rating} out of 5 stars`}>
                          {"★".repeat(Math.min(rating, 5))}{"☆".repeat(Math.max(0, 5 - rating))}
                        </span>
                      )}
                      </div>
                    </div>

                    <span
                      className={`achievement-visibility${visible ? " is-visible" : ""}`}
                    >
                      {visible
                        ? "Published"
                        : "Hidden"}
                    </span>

                  </div>

                  {/* Description */}
                  {achievementPhoto && (
                    <img className="achievement-card-image" src={achievementPhoto} alt={`Achievement: ${achievement.title}`} />
                  )}
                  <p className="achievement-card-description">
                    {achievement.description || "No description added."}
                  </p>

                  {/* Batch */}
                  {achievement.batchId !== null &&
                    achievement.batchId !== undefined && (
                      <div className="achievement-batch">
                        {batch?.title || `Batch ${achievement.batchId}`}
                      </div>
                    )}

                  {/* Review */}
                  {achievement.studentReview && (
                    <blockquote className="achievement-review">
                      “{achievement.studentReview}”
                    </blockquote>
                  )}

                  {achievement.youtubeVideoLink && (
                    <a className="achievement-video-link" href={achievement.youtubeVideoLink} target="_blank" rel="noreferrer">
                      Watch achievement video ↗
                    </a>
                  )}

                  {/* Tags */}
                  {achievement.tags && (
                    <div className="achievement-tags">
                      {achievement.tags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="achievement-tag"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="achievement-card-footer">

                    <button
                      type="button"
                      onClick={() =>
                        handleVisibility(
                          achievement
                        )
                      }
                      disabled={
                        visibilityId ===
                        achievement.achievementId
                      }
                      className={`achievement-visibility-toggle${visible ? " is-on" : ""}`}
                    >
                      {visibilityId ===
                      achievement.achievementId
                        ? "Updating..."
                        : visible
                        ? "Visible on website"
                        : "Hidden from website"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(achievement)
                      }
                      className="achievement-button achievement-button--small"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          achievement.achievementId
                        )
                      }
                      disabled={
                        deletingId ===
                        achievement.achievementId
                      }
                      className="achievement-button achievement-button--danger achievement-button--small"
                    >
                      {deletingId ===
                      achievement.achievementId
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

export default Achievements;
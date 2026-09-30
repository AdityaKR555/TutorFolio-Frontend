import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const initialForm = {
  title: "",
  description: "",
  studentName: "",
  studentReview: "",
  studentRating: "",
  batchId: "",
  tags: "",
};

function Achievements() {
  const [achievements, setAchievements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [visibilityId, setVisibilityId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(initialForm);

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

  const fetchAchievements = async () => {
    const userId = getUserId();

    if (!userId) {
      setError("Your login session could not be found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      const response = await api.get(`/achievements/getAll/${userId}`, {
        timeout: 15000,
      });

      const data = response.data;

      if (data?.status === 200) {
        // Backend currently returns:
        // { status, message, details: [...] }
        const list = Array.isArray(data?.details)
          ? data.details
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.details)
          ? data.data.details
          : [];

        setAchievements(list);
      } else if (data?.status === 404) {
        setAchievements([]);
      } else {
        setError(
          data?.message ||
            "Unable to load achievements. Please try again."
        );
      }
    } catch (err) {
      console.error("Fetch achievements error:", err);
      console.error("Backend response:", err.response?.data);

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
        setError("Something went wrong while loading achievements.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
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
      studentRating: achievement.studentRating ?? "",
      batchId: achievement.batchId ?? "",
      tags: achievement.tags ?? "",
    });

    setEditingId(achievement.achievementId);
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
      setError("Your login session has expired. Please login again.");
      return;
    }

    if (!formData.title.trim()) {
      setError("Achievement title is required.");
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

    // Batch ID is optional.
    // Leave it empty if this achievement is not linked to a batch.
    const batchId =
      formData.batchId === ""
        ? null
        : Number(formData.batchId);

    if (
      batchId !== null &&
      (!Number.isInteger(batchId) || batchId <= 0)
    ) {
      setError("Batch ID must be a valid number.");
      return;
    }

    const payload = {
      userId,
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      studentName: formData.studentName.trim() || null,
      studentReview: formData.studentReview.trim() || null,
      studentRating,
      batchId,
      createdBy: userId,
      tags: formData.tags.trim() || null,
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

      if (data?.status === 200 || data?.status === 201) {
        setSuccess(
          editingId
            ? "Achievement updated successfully."
            : "Achievement added successfully."
        );

        resetForm();

        // Always fetch latest data from DB.
        await fetchAchievements();
      } else if (data?.status === 404) {
        setError(
          data?.message ||
            "User or achievement was not found."
        );
      } else if (data?.status === 422) {
        setError("Please check the information entered.");
      } else {
        setError(
          data?.message ||
            "Unable to save achievement. Please try again."
        );
      }
    } catch (err) {
      console.error("Achievement API error:", err);
      console.error("Backend response:", err.response?.data);

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
        setSuccess("Achievement deleted successfully.");

        await fetchAchievements();
      } else if (data?.status === 404) {
        setError(
          data?.message ||
            "Achievement was not found."
        );
      } else {
        setError(
          data?.message ||
            "Unable to delete achievement. Please try again."
        );
      }
    } catch (err) {
      console.error("Delete achievement error:", err);

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
    const achievementId = achievement.achievementId;
    const currentVisibility =
      Boolean(achievement.visibleOnWeb);

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
      console.error("Achievement visibility error:", err);

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

  const inputClass =
    "w-full bg-[#0a1628] border border-blue-500/10 rounded-xl px-4 py-3 text-white placeholder-[#617391] outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all";

  const labelClass =
    "block text-sm text-[#c7d8f5] mb-2";

  if (loading) {
    return (
      <div className="p-5 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-8 min-h-[400px] flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />

            <p className="text-[#94a8c7] mt-4 text-sm">
              Loading achievements...
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
              Students Achievements
            </h1>

            <p className="text-[#94a8c7] mt-2 text-sm sm:text-base">
              Showcase student achievements, reviews and success stories.
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

              Add Achievement
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

        {/* Form */}
        {isFormOpen && (
          <section className="mb-8 bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  {editingId
                    ? "Edit Achievement"
                    : "Add Achievement"}
                </h2>

                <p className="text-[#6f84a5] text-sm mt-1">
                  Add a student success story to your tutor profile.
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

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Achievement Title{" "}
                    <span className="text-red-400">*</span>
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Scored 95% in Class 10"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Student Name
                  </label>

                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Student Rating
                  </label>

                  <input
                    type="number"
                    name="studentRating"
                    value={formData.studentRating}
                    onChange={handleChange}
                    placeholder="1 to 5"
                    min="1"
                    max="5"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Batch ID
                  </label>

                  <input
                    type="number"
                    name="batchId"
                    value={formData.batchId}
                    onChange={handleChange}
                    placeholder="Optional"
                    min="1"
                    className={inputClass}
                  />

                  <p className="text-[#617391] text-xs mt-2">
                    Leave empty if this achievement is not linked to a batch.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>
                    Tags
                  </label>

                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="e.g. board exam, maths, cbse"
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Achievement Description
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the student's achievement..."
                    rows={4}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Student Review
                  </label>

                  <textarea
                    name="studentReview"
                    value={formData.studentReview}
                    onChange={handleChange}
                    placeholder="What did the student say about your teaching?"
                    rows={4}
                    className={`${inputClass} resize-none`}
                  />
                </div>

              </div>

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
                    "Add Achievement"
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Achievement List */}
        {achievements.length === 0 ? (
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
                  d="M12 3l2.4 4.9L20 8.7l-4 3.9.9 5.5L12 15.5l-4.9 2.6.9-5.5 5.6-.8L12 3z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-white mt-5">
              No achievements yet
            </h2>

            <p className="text-[#94a8c7] text-sm mt-2">
              Add your first student achievement to start building your profile.
            </p>

            {!isFormOpen && (
              <button
                type="button"
                onClick={handleAdd}
                className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl transition-colors text-sm font-medium"
              >
                Add Your First Achievement
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {achievements.map((achievement) => {
              const visible = Boolean(
                achievement.visibleOnWeb
              );

              return (
                <article
                  key={achievement.achievementId}
                  className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-white break-words">
                        {achievement.title}
                      </h2>

                      {achievement.studentName && (
                        <p className="text-[#94a8c7] text-sm mt-1">
                          {achievement.studentName}
                        </p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                        visible
                          ? "bg-green-500/10 text-green-300 border border-green-500/20"
                          : "bg-[#0a1628] text-[#6f84a5] border border-blue-500/10"
                      }`}
                    >
                      {visible ? "Website Visible" : "Hidden"}
                    </span>
                  </div>

                  {achievement.description && (
                    <p className="text-[#c7d8f5] text-sm leading-6 mt-4 whitespace-pre-line">
                      {achievement.description}
                    </p>
                  )}

                  {achievement.studentRating !== null &&
                    achievement.studentRating !== undefined &&
                    achievement.studentRating !== "" && (
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map(
                            (_, index) => (
                              <svg
                                key={index}
                                className={`w-4 h-4 ${
                                  index <
                                  Number(
                                    achievement.studentRating
                                  )
                                    ? "text-yellow-400"
                                    : "text-[#334765]"
                                }`}
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 2.8l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.8z" />
                              </svg>
                            )
                          )}
                        </div>

                        <span className="text-[#94a8c7] text-xs">
                          {achievement.studentRating}/5
                        </span>
                      </div>
                    )}

                  {achievement.studentReview && (
                    <div className="mt-5 bg-[#0a1628] rounded-2xl p-4">
                      <p className="text-[#617391] text-xs mb-2">
                        Student Review
                      </p>

                      <p className="text-[#c7d8f5] text-sm leading-6 whitespace-pre-line">
                        "{achievement.studentReview}"
                      </p>
                    </div>
                  )}

                  {achievement.tags && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {achievement.tags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-blue-500/10 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleVisibility(achievement)
                      }
                      disabled={
                        visibilityId ===
                        achievement.achievementId
                      }
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-[#0a1628] text-[#c7d8f5] hover:bg-[#142744] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {visibilityId ===
                      achievement.achievementId
                        ? "Updating..."
                        : visible
                        ? "Hide from Website"
                        : "Show on Website"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(achievement)
                      }
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-colors"
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
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const initialForm = {
  tuitionName: "",
  owners: "",
  description: "",
  languages: "",
  teachingSubjects: "",
  establishedYear: "",
  state: "",
  district: "",
  city: "",
  latitude: "",
  longitude: "",
  services: "",
  eligibleClasses: "",
  tags: "",
};

function TuitionDetails() {
  const [formData, setFormData] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  useEffect(() => {
    const fetchTuitionDetails = async () => {
      const userId = getUserId();

      if (!userId) {
        setError("Your login session could not be found. Please login again.");
        setLoading(false);
        return;
      }

      try {
        setError("");

        const response = await api.get("/tuitionDetails", {
          params: { userId },
          timeout: 15000,
        });

        const data = response.data;

        if (data?.status === 200 && data?.data) {
          const tuition = data.data;

          setFormData({
            tuitionName: tuition.tuitionName ?? "",
            owners: tuition.owners ?? "",

            // Supports both the current backend typo and the correct key.
            description:
              tuition["descript]ion"] ??
              tuition.description ??
              "",

            languages: tuition.languages ?? "",
            teachingSubjects: tuition.teachingSubjects ?? "",
            establishedYear: tuition.establishedYear ?? "",
            state: tuition.state ?? "",
            district: tuition.district ?? "",
            city: tuition.city ?? "",
            latitude: tuition.latitude ?? "",
            longitude: tuition.longitude ?? "",
            services: tuition.services ?? "",
            eligibleClasses: tuition.eligibleClasses ?? "",
            tags: tuition.tags ?? "",
          });

          // Existing tuition details = read-only
          setIsEditing(false);
        } else if (data?.status === 404) {
          // First time = directly editable
          setFormData(initialForm);
          setIsEditing(true);
        } else {
          setError(
            data?.message ||
              "Unable to load your tuition details. Please try again."
          );
        }
      } catch (err) {
        if (err.code === "ECONNABORTED") {
          setError(
            "The server is taking too long to respond. Please try again."
          );
        } else if (err.response?.status === 422) {
          setError("The tuition details request was invalid.");
        } else if (err.response?.status >= 500) {
          setError(
            "The server is currently unavailable. Please try again in a moment."
          );
        } else if (err.request) {
          setError(
            "Could not connect to the server. Please check your internet connection."
          );
        } else {
          setError("Something went wrong while loading your tuition details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTuitionDetails();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Extra protection: never submit while already saving.
    if (saving) {
      return;
    }

    setError("");
    setSuccess("");

    const userId = getUserId();

    if (!userId) {
      setError("Your login session has expired. Please login again.");
      return;
    }

    if (!formData.tuitionName.trim()) {
      setError("Tuition name is required.");
      return;
    }

    const establishedYear =
      formData.establishedYear === ""
        ? null
        : Number(formData.establishedYear);

    if (
      establishedYear !== null &&
      (!Number.isInteger(establishedYear) ||
        establishedYear < 1900 ||
        establishedYear > new Date().getFullYear())
    ) {
      setError("Please enter a valid established year.");
      return;
    }

    const latitude =
      formData.latitude === ""
        ? null
        : Number(formData.latitude);

    const longitude =
      formData.longitude === ""
        ? null
        : Number(formData.longitude);

    if (
      latitude !== null &&
      (Number.isNaN(latitude) || latitude < -90 || latitude > 90)
    ) {
      setError("Latitude must be between -90 and 90.");
      return;
    }

    if (
      longitude !== null &&
      (Number.isNaN(longitude) ||
        longitude < -180 ||
        longitude > 180)
    ) {
      setError("Longitude must be between -180 and 180.");
      return;
    }

    const payload = {
      userId,
      tuitionName: formData.tuitionName.trim(),
      owners: formData.owners.trim() || null,
      description: formData.description.trim() || null,
      languages: formData.languages.trim() || null,
      teachingSubjects: formData.teachingSubjects.trim() || null,
      establishedYear,
      state: formData.state.trim() || null,
      district: formData.district.trim() || null,
      city: formData.city.trim() || null,
      latitude,
      longitude,
      services: formData.services.trim() || null,
      eligibleClasses: formData.eligibleClasses.trim() || null,
      tags: formData.tags.trim() || null,
    };

    try {
      setSaving(true);

      const response = await api.post("/tuitionDetails", payload, {
        timeout: 15000,
      });

      const data = response.data;

      if (data?.status === 200) {
        setSuccess("Tuition details updated successfully.");

        // After successful save, go back to read-only mode.
        setIsEditing(false);

        // Use backend response when available.
        if (data?.data) {
          const tuition = data.data;

          setFormData({
            tuitionName: tuition.tuitionName ?? payload.tuitionName,
            owners: tuition.owners ?? payload.owners ?? "",

            description:
              tuition["descript]ion"] ??
              tuition.description ??
              payload.description ??
              "",

            languages:
              tuition.languages ??
              payload.languages ??
              "",

            teachingSubjects:
              tuition.teachingSubjects ??
              payload.teachingSubjects ??
              "",

            establishedYear:
              tuition.establishedYear ??
              payload.establishedYear ??
              "",

            state: tuition.state ?? payload.state ?? "",
            district: tuition.district ?? payload.district ?? "",
            city: tuition.city ?? payload.city ?? "",

            latitude:
              tuition.latitude ??
              payload.latitude ??
              "",

            longitude:
              tuition.longitude ??
              payload.longitude ??
              "",

            services:
              tuition.services ??
              payload.services ??
              "",

            eligibleClasses:
              tuition.eligibleClasses ??
              payload.eligibleClasses ??
              "",

            tags: tuition.tags ?? payload.tags ?? "",
          });
        } else {
          // Fallback in case backend doesn't return data.
          setFormData({
            tuitionName: payload.tuitionName,
            owners: payload.owners ?? "",
            description: payload.description ?? "",
            languages: payload.languages ?? "",
            teachingSubjects: payload.teachingSubjects ?? "",
            establishedYear: payload.establishedYear ?? "",
            state: payload.state ?? "",
            district: payload.district ?? "",
            city: payload.city ?? "",
            latitude: payload.latitude ?? "",
            longitude: payload.longitude ?? "",
            services: payload.services ?? "",
            eligibleClasses: payload.eligibleClasses ?? "",
            tags: payload.tags ?? "",
          });
        }
      } else if (data?.status === 404) {
        setError(
          data?.message ||
            "User account was not found. Please login again."
        );
      } else if (data?.status === 422) {
        setError("Please check the information you entered.");
      } else {
        setError(
          data?.message ||
            "Unable to update tuition details. Please try again."
        );
      }
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Your changes may not have been saved. Please check your tuition details before trying again."
        );
      } else if (err.response?.status === 422) {
        setError(
          "Some tuition information is invalid. Please check the form."
        );
      } else if (err.response?.status >= 500) {
        setError(
          "The server is currently unavailable. Please try again in a moment."
        );
      } else if (err.request) {
        setError(
          "Could not connect to the server. Please check your internet connection."
        );
      } else {
        setError(
          "Something went wrong while updating your tuition details."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-[#0a1628] border border-blue-500/10 rounded-xl px-4 py-3 text-white placeholder-[#617391] outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:focus:border-blue-500/10 disabled:focus:ring-0";

  const labelClass =
    "block text-sm text-[#c7d8f5] mb-2";

  if (loading) {
    return (
      <div className="p-5 sm:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-8 min-h-[400px] flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />

            <p className="text-[#94a8c7] mt-4 text-sm">
              Loading tuition details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[#94a8c7] text-sm mb-2">
            Tutor Profile
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Tuition Details
          </h1>

          <p className="text-[#94a8c7] mt-2 text-sm sm:text-base">
            Add and manage information about your tuition or coaching.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-400 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v3.5m0 3h.01M10.3 4.9L2.8 18a2 2 0 001.7 3h15a2 2 0 011.7-3L13.7 4.9a2 2 0 00-3.4 0z"
              />
            </svg>

            <p className="text-red-300 text-sm">
              {error}
            </p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-400 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>

            <p className="text-green-300 text-sm">
              {success}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Tuition Information */}
          <section className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Tuition Information
              </h2>

              <p className="text-[#6f84a5] text-sm mt-1">
                Basic information about your tuition.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Tuition Name */}
              <div>
                <label className={labelClass}>
                  Tuition Name{" "}
                  <span className="text-red-400">*</span>
                </label>

                <input
                  type="text"
                  name="tuitionName"
                  value={formData.tuitionName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter tuition name"
                  maxLength={100}
                  className={inputClass}
                />
              </div>

              {/* Owners */}
              <div>
                <label className={labelClass}>
                  Owner / Tutor Name
                </label>

                <input
                  type="text"
                  name="owners"
                  value={formData.owners}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. Aditya Kumar"
                  maxLength={100}
                  className={inputClass}
                />
              </div>

              {/* Established Year */}
              <div>
                <label className={labelClass}>
                  Established Year
                </label>

                <input
                  type="number"
                  name="establishedYear"
                  value={formData.establishedYear}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. 2022"
                  min="1900"
                  max={new Date().getFullYear()}
                  className={inputClass}
                />
              </div>

              {/* Languages */}
              <div>
                <label className={labelClass}>
                  Languages
                </label>

                <input
                  type="text"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. English, Hindi"
                  className={inputClass}
                />

                <p className="text-[#617391] text-xs mt-2">
                  Separate multiple languages with commas.
                </p>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className={labelClass}>
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Tell students about your tuition..."
                  rows={5}
                  maxLength={5000}
                  className={`${inputClass} resize-none`}
                />
              </div>

            </div>
          </section>

          {/* Teaching Information */}
          <section className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Teaching Information
              </h2>

              <p className="text-[#6f84a5] text-sm mt-1">
                Tell students what and whom you teach.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Subjects */}
              <div>
                <label className={labelClass}>
                  Teaching Subjects
                </label>

                <input
                  type="text"
                  name="teachingSubjects"
                  value={formData.teachingSubjects}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. Mathematics, Science, English"
                  className={inputClass}
                />

                <p className="text-[#617391] text-xs mt-2">
                  Separate multiple subjects with commas.
                </p>
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
                  disabled={!isEditing}
                  placeholder="e.g. Class 6-10, Class 12"
                  className={inputClass}
                />
              </div>

              {/* Services */}
              <div className="md:col-span-2">
                <label className={labelClass}>
                  Services
                </label>

                <textarea
                  name="services"
                  value={formData.services}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. Home tuition, Online classes, Test preparation"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Tags */}
              <div className="md:col-span-2">
                <label className={labelClass}>
                  Tags
                </label>

                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. maths, science, cbse, online"
                  className={inputClass}
                />

                <p className="text-[#617391] text-xs mt-2">
                  Separate multiple tags with commas.
                </p>
              </div>

            </div>
          </section>

          {/* Location */}
          <section className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Location
              </h2>

              <p className="text-[#6f84a5] text-sm mt-1">
                Add the location of your tuition.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* State */}
              <div>
                <label className={labelClass}>
                  State
                </label>

                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. Bihar"
                  className={inputClass}
                />
              </div>

              {/* District */}
              <div>
                <label className={labelClass}>
                  District
                </label>

                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. Begusarai"
                  className={inputClass}
                />
              </div>

              {/* City */}
              <div>
                <label className={labelClass}>
                  City
                </label>

                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. Begusarai"
                  className={inputClass}
                />
              </div>

              {/* Latitude */}
              <div>
                <label className={labelClass}>
                  Latitude
                </label>

                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. 25.4182"
                  step="any"
                  className={inputClass}
                />
              </div>

              {/* Longitude */}
              <div>
                <label className={labelClass}>
                  Longitude
                </label>

                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. 86.1274"
                  step="any"
                  className={inputClass}
                />
              </div>

            </div>
          </section>

          {/* Action Button */}
          <div className="flex justify-end pb-4">

            {!isEditing ? (
              <button
                type="button"
                onClick={handleEdit}
                disabled={saving}
                className="w-full sm:w-auto min-w-[170px] bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-colors text-sm font-medium"
              >
                Edit Details
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto min-w-[170px] bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            )}

          </div>

        </form>
      </div>
    </div>
  );
}

export default TuitionDetails;
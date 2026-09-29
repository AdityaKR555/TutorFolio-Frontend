import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const initialForm = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  mobileNo: "",
  email: "",
  about: "",
  profilePicture: "",
  webURL: "",
  qualification: "",
  address: "",
  teachingYOE: 0,
};

function Profile() {
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
    const fetchProfile = async () => {
      const userId = getUserId();

      if (!userId) {
        setError("Your login session could not be found. Please login again.");
        setLoading(false);
        return;
      }

      try {
        setError("");

        const response = await api.get("/personalDetails", {
          params: { userId },
          timeout: 15000,
        });

        const data = response.data;

        if (data?.status === 200 && data?.data) {
          setFormData({
            firstName: data.data.firstName ?? "",
            lastName: data.data.lastName ?? "",
            dateOfBirth: data.data.dateOfBirth ?? "",
            gender: data.data.gender ?? "",
            mobileNo: data.data.mobileNo ?? "",
            email: data.data.email ?? "",
            about: data.data.about ?? "",
            profilePicture: data.data.profilePicture ?? "",
            webURL: data.data.webURL ?? "",
            qualification: data.data.qualification ?? "",
            address: data.data.address ?? "",
            teachingYOE: data.data.teachingYOE ?? 0,
          });

          // Existing profile = read-only initially
          setIsEditing(false);
        } else if (data?.status === 404) {
          // No profile yet = directly allow the tutor to fill it
          setFormData(initialForm);
          setIsEditing(true);
        } else {
          setError(
            data?.message ||
              "Unable to load your profile. Please try again."
          );
        }
      } catch (err) {
        if (err.code === "ECONNABORTED") {
          setError(
            "The server is taking too long to respond. Please try again."
          );
        } else if (err.response?.status === 422) {
          setError("The profile request was invalid.");
        } else if (err.response?.status >= 500) {
          setError(
            "The server is currently unavailable. Please try again in a moment."
          );
        } else if (err.request) {
          setError(
            "Could not connect to the server. Please check your internet connection."
          );
        } else {
          setError("Something went wrong while loading your profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
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

  const handleEdit = () => {
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const userId = getUserId();

    if (!userId) {
      setError("Your login session has expired. Please login again.");
      return;
    }

    if (!formData.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!formData.mobileNo) {
      setError("Mobile number is required.");
      return;
    }

    const mobileString = String(formData.mobileNo).trim();

    if (!/^\d{10,15}$/.test(mobileString)) {
      setError("Please enter a valid mobile number.");
      return;
    }

    if (formData.teachingYOE !== "") {
      const experience = Number(formData.teachingYOE);

      if (
        Number.isNaN(experience) ||
        experience < 0 ||
        experience > 80
      ) {
        setError("Teaching experience must be between 0 and 80 years.");
        return;
      }
    }

    const payload = {
      userId,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim() || null,
      dateOfBirth: formData.dateOfBirth || null,
      gender: formData.gender || null,
      mobileNo: Number(mobileString),
      email: formData.email.trim() || null,
      about: formData.about.trim() || null,
      profilePicture: formData.profilePicture.trim() || null,
      webURL: formData.webURL.trim() || null,
      qualification: formData.qualification.trim() || "",
      address: formData.address.trim() || null,
      teachingYOE:
        formData.teachingYOE === ""
          ? 0
          : Number(formData.teachingYOE),
    };

    try {
      setSaving(true);

      const response = await api.post(
        "/personalDetails",
        payload,
        {
          timeout: 15000,
        }
      );

      const data = response.data;

      if (data?.status === 200) {
        setSuccess("Profile updated successfully.");

        // After saving, switch back to read-only mode
        setIsEditing(false);

        // Update the form with the data returned by backend
        if (data?.data) {
          setFormData({
            firstName: data.data.firstName ?? "",
            lastName: data.data.lastName ?? "",
            dateOfBirth: data.data.dateOfBirth ?? "",
            gender: data.data.gender ?? "",
            mobileNo: data.data.mobileNo ?? "",
            email: data.data.email ?? "",
            about: data.data.about ?? "",
            profilePicture: data.data.profilePicture ?? "",
            webURL: data.data.webURL ?? "",
            qualification: data.data.qualification ?? "",
            address: data.data.address ?? "",
            teachingYOE: data.data.teachingYOE ?? 0,
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
            "Unable to update your profile. Please try again."
        );
      }
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Your changes may not have been saved. Please check your profile before trying again."
        );
      } else if (err.response?.status === 422) {
        setError(
          "Some profile information is invalid. Please check the form."
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
          "Something went wrong while updating your profile."
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
              Loading your profile...
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
            Personal Details
          </h1>

          <p className="text-[#94a8c7] mt-2 text-sm sm:text-base">
            Add and manage the information that will appear on your
            tutor profile.
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
                d="M12 9v3.5m0 3h.01M10.3 4.9L2.8 18a2 2 0 001.7 3h15a2 2 0 001.7-3L13.7 4.9a2 2 0 00-3.4 0z"
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

          {/* Basic Information */}
          <section className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Basic Information
              </h2>

              <p className="text-[#6f84a5] text-sm mt-1">
                Tell students a little about yourself.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* First Name */}
              <div>
                <label className={labelClass}>
                  First Name{" "}
                  <span className="text-red-400">*</span>
                </label>

                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter your first name"
                  className={inputClass}
                  maxLength={100}
                />
              </div>

              {/* Last Name */}
              <div>
                <label className={labelClass}>
                  Last Name
                </label>

                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter your last name"
                  className={inputClass}
                  maxLength={100}
                />
              </div>

              {/* DOB */}
              <div>
                <label className={labelClass}>
                  Date of Birth
                </label>

                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`${inputClass} [color-scheme:dark]`}
                />
              </div>

              {/* Gender */}
              <div>
                <label className={labelClass}>
                  Gender
                </label>

                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`${inputClass} appearance-none`}
                >
                  <option value="">
                    Select gender
                  </option>

                  <option value="Male">
                    Male
                  </option>

                  <option value="Female">
                    Female
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              {/* Mobile */}
              <div>
                <label className={labelClass}>
                  Mobile Number{" "}
                  <span className="text-red-400">*</span>
                </label>

                <input
                  type="tel"
                  name="mobileNo"
                  value={formData.mobileNo}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter mobile number"
                  className={inputClass}
                  inputMode="numeric"
                  maxLength={15}
                />
              </div>

              {/* Email */}
              <div>
                <label className={labelClass}>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter email address"
                  className={inputClass}
                />
              </div>

              {/* About */}
              <div className="md:col-span-2">
                <label className={labelClass}>
                  About
                </label>

                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Tell students about yourself, your teaching style, experience, etc."
                  rows={5}
                  className={`${inputClass} resize-none`}
                />
              </div>

            </div>
          </section>

          {/* Professional Information */}
          <section className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Professional Information
              </h2>

              <p className="text-[#6f84a5] text-sm mt-1">
                Add your teaching experience and professional details.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Qualification */}
              <div>
                <label className={labelClass}>
                  Qualification
                </label>

                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. BCA, MCA, B.Ed"
                  className={inputClass}
                />
              </div>

              {/* Experience */}
              <div>
                <label className={labelClass}>
                  Teaching Experience
                </label>

                <div className="relative">
                  <input
                    type="number"
                    name="teachingYOE"
                    value={formData.teachingYOE}
                    onChange={handleChange}
                    disabled={!isEditing}
                    min="0"
                    max="80"
                    placeholder="0"
                    className={`${inputClass} pr-16`}
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6f84a5] text-sm">
                    years
                  </span>
                </div>
              </div>

              {/* Website */}
              <div>
                <label className={labelClass}>
                  Website / Profile URL
                </label>

                <input
                  type="url"
                  name="webURL"
                  value={formData.webURL}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="https://example.com"
                  className={inputClass}
                />
              </div>

              {/* Profile Picture */}
              <div>
                <label className={labelClass}>
                  Profile Picture URL
                </label>

                <input
                  type="url"
                  name="profilePicture"
                  value={formData.profilePicture}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="https://example.com/photo.jpg"
                  className={inputClass}
                />
              </div>

            </div>
          </section>

          {/* Address */}
          <section className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Address
              </h2>

              <p className="text-[#6f84a5] text-sm mt-1">
                Add your current or teaching location.
              </p>
            </div>

            <div>
              <label className={labelClass}>
                Address
              </label>

              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Enter your address"
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </div>
          </section>

          {/* Action Button */}
          <div className="flex justify-end pb-4">
            {!isEditing ? (
              <button
                type="button"
                onClick={handleEdit}
                className="w-full sm:w-auto min-w-[150px] bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition-colors text-sm font-medium"
              >
                Edit Profile
              </button>
            ) : (
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

export default Profile;
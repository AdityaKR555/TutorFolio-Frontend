// import React, { useEffect, useState } from "react";
// import api from "../../api/axios";
// import ResumeExtractorModal from "../../components/ResumeExtractorModal";

// const initialForm = {
//   firstName: "",
//   lastName: "",
//   dateOfBirth: "",
//   gender: "",
//   mobileNo: "",
//   email: "",
//   about: "",
//   profilePicture: "",
//   webURL: "",
//   qualification: "",
//   address: "",
//   teachingYOE: 0,
// };

// function Profile() {
//   const [formData, setFormData] = useState(initialForm);

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);

//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [showResumeModal, setShowResumeModal] = useState(false);

//   const handleApplyResume = (extracted) => {
//     if (!extracted) return;

//     let firstName = formData.firstName;
//     let lastName = formData.lastName;
//     if (extracted.tutor_name) {
//       const parts = extracted.tutor_name.trim().split(/\s+/);
//       firstName = parts[0] || firstName;
//       lastName = parts.slice(1).join(" ") || lastName;
//     }

//     let mobileNo = formData.mobileNo;
//     if (extracted.phone) {
//       const digitsOnly = extracted.phone.replace(/[^0-9]/g, "");
//       mobileNo = digitsOnly || extracted.phone;
//     }

//     let qualification = formData.qualification;
//     if (Array.isArray(extracted.qualifications) && extracted.qualifications.length > 0) {
//       qualification = extracted.qualifications.join(", ");
//     }

//     setFormData((prev) => ({
//       ...prev,
//       firstName: firstName || prev.firstName,
//       lastName: lastName || prev.lastName,
//       email: extracted.email || prev.email,
//       mobileNo: mobileNo || prev.mobileNo,
//       address: extracted.location || prev.address,
//       qualification: qualification || prev.qualification,
//       teachingYOE:
//         extracted.years_of_experience != null
//           ? extracted.years_of_experience
//           : prev.teachingYOE,
//     }));

//     setIsEditing(true);
//     setSuccess("Profile details auto-filled from resume! Please review and click 'Save Changes'.");
//   };

//   const getUserId = () => {
//     try {
//       const user = JSON.parse(localStorage.getItem("user"));
//       return user?.user_id;
//     } catch {
//       return null;
//     }
//   };

//   useEffect(() => {
//     const fetchProfile = async () => {
//       const userId = getUserId();

//       if (!userId) {
//         setError("Your login session could not be found. Please login again.");
//         setLoading(false);
//         return;
//       }

//       try {
//         setError("");

//         const response = await api.get("/personalDetails", {
//           params: { userId },
//           timeout: 15000,
//         });

//         const data = response.data;

//         if (data?.status === 200 && data?.data) {
//           setFormData({
//             firstName: data.data.firstName ?? "",
//             lastName: data.data.lastName ?? "",
//             dateOfBirth: data.data.dateOfBirth ?? "",
//             gender: data.data.gender ?? "",
//             mobileNo: data.data.mobileNo ?? "",
//             email: data.data.email ?? "",
//             about: data.data.about ?? "",
//             profilePicture: data.data.profilePicture ?? "",
//             webURL: data.data.webURL ?? "",
//             qualification: data.data.qualification ?? "",
//             address: data.data.address ?? "",
//             teachingYOE: data.data.teachingYOE ?? 0,
//           });

//           // Existing profile = read-only initially
//           setIsEditing(false);
//         } else if (data?.status === 404) {
//           // No profile yet = directly allow the tutor to fill it
//           setFormData(initialForm);
//           setIsEditing(true);
//         } else {
//           setError(
//             data?.message ||
//               "Unable to load your profile. Please try again."
//           );
//         }
//       } catch (err) {
//         if (err.code === "ECONNABORTED") {
//           setError(
//             "The server is taking too long to respond. Please try again."
//           );
//         } else if (err.response?.status === 422) {
//           setError("The profile request was invalid.");
//         } else if (err.response?.status >= 500) {
//           setError(
//             "The server is currently unavailable. Please try again in a moment."
//           );
//         } else if (err.request) {
//           setError(
//             "Could not connect to the server. Please check your internet connection."
//           );
//         } else {
//           setError("Something went wrong while loading your profile.");
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProfile();
//   }, []);

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));

//     setError("");
//     setSuccess("");
//   };

//   const handleEdit = () => {
//     setIsEditing(true);
//     setError("");
//     setSuccess("");
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     setError("");
//     setSuccess("");

//     const userId = getUserId();

//     if (!userId) {
//       setError("Your login session has expired. Please login again.");
//       return;
//     }

//     if (!formData.firstName.trim()) {
//       setError("First name is required.");
//       return;
//     }

//     if (!formData.mobileNo) {
//       setError("Mobile number is required.");
//       return;
//     }

//     const mobileString = String(formData.mobileNo).trim();

//     if (!/^\d{10,15}$/.test(mobileString)) {
//       setError("Please enter a valid mobile number.");
//       return;
//     }

//     if (formData.teachingYOE !== "") {
//       const experience = Number(formData.teachingYOE);

//       if (
//         Number.isNaN(experience) ||
//         experience < 0 ||
//         experience > 80
//       ) {
//         setError("Teaching experience must be between 0 and 80 years.");
//         return;
//       }
//     }

//     const payload = {
//       userId,
//       firstName: formData.firstName.trim(),
//       lastName: formData.lastName.trim() || null,
//       dateOfBirth: formData.dateOfBirth || null,
//       gender: formData.gender || null,
//       mobileNo: Number(mobileString),
//       email: formData.email.trim() || null,
//       about: formData.about.trim() || null,
//       profilePicture: formData.profilePicture.trim() || null,
//       webURL: formData.webURL.trim() || null,
//       qualification: formData.qualification.trim() || "",
//       address: formData.address.trim() || null,
//       teachingYOE:
//         formData.teachingYOE === ""
//           ? 0
//           : Number(formData.teachingYOE),
//     };

//     try {
//       setSaving(true);

//       const response = await api.post(
//         "/personalDetails",
//         payload,
//         {
//           timeout: 15000,
//         }
//       );

//       const data = response.data;

//       if (data?.status === 200) {
//         setSuccess("Profile updated successfully.");

//         // After saving, switch back to read-only mode
//         setIsEditing(false);

//         // Update the form with the data returned by backend
//         if (data?.data) {
//           setFormData({
//             firstName: data.data.firstName ?? "",
//             lastName: data.data.lastName ?? "",
//             dateOfBirth: data.data.dateOfBirth ?? "",
//             gender: data.data.gender ?? "",
//             mobileNo: data.data.mobileNo ?? "",
//             email: data.data.email ?? "",
//             about: data.data.about ?? "",
//             profilePicture: data.data.profilePicture ?? "",
//             webURL: data.data.webURL ?? "",
//             qualification: data.data.qualification ?? "",
//             address: data.data.address ?? "",
//             teachingYOE: data.data.teachingYOE ?? 0,
//           });
//         }
//       } else if (data?.status === 404) {
//         setError(
//           data?.message ||
//             "User account was not found. Please login again."
//         );
//       } else if (data?.status === 422) {
//         setError("Please check the information you entered.");
//       } else {
//         setError(
//           data?.message ||
//             "Unable to update your profile. Please try again."
//         );
//       }
//     } catch (err) {
//       if (err.code === "ECONNABORTED") {
//         setError(
//           "The server is taking too long to respond. Your changes may not have been saved. Please check your profile before trying again."
//         );
//       } else if (err.response?.status === 422) {
//         setError(
//           "Some profile information is invalid. Please check the form."
//         );
//       } else if (err.response?.status >= 500) {
//         setError(
//           "The server is currently unavailable. Please try again in a moment."
//         );
//       } else if (err.request) {
//         setError(
//           "Could not connect to the server. Please check your internet connection."
//         );
//       } else {
//         setError(
//           "Something went wrong while updating your profile."
//         );
//       }
//     } finally {
//       setSaving(false);
//     }
//   };

//   const inputClass =
//     "w-full bg-[#0a1628] border border-blue-500/10 rounded-xl px-4 py-3 text-white placeholder-[#617391] outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:focus:border-blue-500/10 disabled:focus:ring-0";

//   const labelClass =
//     "block text-sm text-[#c7d8f5] mb-2";

//   if (loading) {
//     return (
//       <div className="p-5 sm:p-8">
//         <div className="max-w-5xl mx-auto">
//           <div className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-8 min-h-[400px] flex flex-col items-center justify-center">
//             <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />

//             <p className="text-[#94a8c7] mt-4 text-sm">
//               Loading your profile...
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-5 sm:p-8">
//       <div className="max-w-5xl mx-auto">

//         {/* Header */}
//         <ResumeExtractorModal
//           isOpen={showResumeModal}
//           onClose={() => setShowResumeModal(false)}
//           onApply={handleApplyResume}
//           mode="profile"
//         />
//         <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div>
//           <p className="text-[#94a8c7] text-sm mb-2">
//             Tutor Profile
//           </p>

//           <h1 className="text-2xl sm:text-3xl font-bold text-white">
//             Personal Details
//           </h1>

//           <p className="text-[#94a8c7] mt-2 text-sm sm:text-base">
//             Add and manage the information that will appear on your
//             tutor profile.
//           </p>
//           </div>

//           <button
//             type="button"
//             onClick={() => setShowResumeModal(true)}
//             className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white transition-all text-sm font-medium cursor-pointer shadow-sm"
//           >
//             <span>✨</span>
//             <span>Auto-fill from Resume</span>
//           </button>
//         </div>

//         {/* Error */}
//         {error && (
//           <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
//             <svg
//               className="w-5 h-5 text-red-400 mt-0.5 shrink-0"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 d="M12 9v3.5m0 3h.01M10.3 4.9L2.8 18a2 2 0 001.7 3h15a2 2 0 001.7-3L13.7 4.9a2 2 0 00-3.4 0z"
//               />
//             </svg>

//             <p className="text-red-300 text-sm">
//               {error}
//             </p>
//           </div>
//         )}

//         {/* Success */}
//         {success && (
//           <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
//             <svg
//               className="w-5 h-5 text-green-400 mt-0.5 shrink-0"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 d="M5 13l4 4L19 7"
//               />
//             </svg>

//             <p className="text-green-300 text-sm">
//               {success}
//             </p>
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-6">

//           {/* Basic Information */}
//           <section className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-7">
//             <div className="mb-6">
//               <h2 className="text-lg sm:text-xl font-semibold text-white">
//                 Basic Information
//               </h2>

//               <p className="text-[#6f84a5] text-sm mt-1">
//                 Tell students a little about yourself.
//               </p>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

//               {/* First Name */}
//               <div>
//                 <label className={labelClass}>
//                   First Name{" "}
//                   <span className="text-red-400">*</span>
//                 </label>

//                 <input
//                   type="text"
//                   name="firstName"
//                   value={formData.firstName}
//                   onChange={handleChange}
//                   disabled={!isEditing}
//                   placeholder="Enter your first name"
//                   className={inputClass}
//                   maxLength={100}
//                 />
//               </div>

//               {/* Last Name */}
//               <div>
//                 <label className={labelClass}>
//                   Last Name
//                 </label>

//                 <input
//                   type="text"
//                   name="lastName"
//                   value={formData.lastName}
//                   onChange={handleChange}
//                   disabled={!isEditing}
//                   placeholder="Enter your last name"
//                   className={inputClass}
//                   maxLength={100}
//                 />
//               </div>

//               {/* DOB */}
//               <div>
//                 <label className={labelClass}>
//                   Date of Birth
//                 </label>

//                 <input
//                   type="date"
//                   name="dateOfBirth"
//                   value={formData.dateOfBirth}
//                   onChange={handleChange}
//                   disabled={!isEditing}
//                   className={`${inputClass} [color-scheme:dark]`}
//                 />
//               </div>

//               {/* Gender */}
//               <div>
//                 <label className={labelClass}>
//                   Gender
//                 </label>

//                 <select
//                   name="gender"
//                   value={formData.gender}
//                   onChange={handleChange}
//                   disabled={!isEditing}
//                   className={`${inputClass} appearance-none`}
//                 >
//                   <option value="">
//                     Select gender
//                   </option>

//                   <option value="Male">
//                     Male
//                   </option>

//                   <option value="Female">
//                     Female
//                   </option>

//                   <option value="Other">
//                     Other
//                   </option>
//                 </select>
//               </div>

//               {/* Mobile */}
//               <div>
//                 <label className={labelClass}>
//                   Mobile Number{" "}
//                   <span className="text-red-400">*</span>
//                 </label>

//                 <input
//                   type="tel"
//                   name="mobileNo"
//                   value={formData.mobileNo}
//                   onChange={handleChange}
//                   disabled={!isEditing}
//                   placeholder="Enter mobile number"
//                   className={inputClass}
//                   inputMode="numeric"
//                   maxLength={15}
//                 />
//               </div>

//               {/* Email */}
//               <div>
//                 <label className={labelClass}>
//                   Email
//                 </label>

//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   disabled={!isEditing}
//                   placeholder="Enter email address"
//                   className={inputClass}
//                 />
//               </div>

//               {/* About */}
//               <div className="md:col-span-2">
//                 <label className={labelClass}>
//                   About
//                 </label>

//                 <textarea
//                   name="about"
//                   value={formData.about}
//                   onChange={handleChange}
//                   disabled={!isEditing}
//                   placeholder="Tell students about yourself, your teaching style, experience, etc."
//                   rows={5}
//                   className={`${inputClass} resize-none`}
//                 />
//               </div>

//             </div>
//           </section>

//           {/* Professional Information */}
//           <section className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-7">
//             <div className="mb-6">
//               <h2 className="text-lg sm:text-xl font-semibold text-white">
//                 Professional Information
//               </h2>

//               <p className="text-[#6f84a5] text-sm mt-1">
//                 Add your teaching experience and professional details.
//               </p>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

//               {/* Qualification */}
//               <div>
//                 <label className={labelClass}>
//                   Qualification
//                 </label>

//                 <input
//                   type="text"
//                   name="qualification"
//                   value={formData.qualification}
//                   onChange={handleChange}
//                   disabled={!isEditing}
//                   placeholder="e.g. BCA, MCA, B.Ed"
//                   className={inputClass}
//                 />
//               </div>

//               {/* Experience */}
//               <div>
//                 <label className={labelClass}>
//                   Teaching Experience
//                 </label>

//                 <div className="relative">
//                   <input
//                     type="number"
//                     name="teachingYOE"
//                     value={formData.teachingYOE}
//                     onChange={handleChange}
//                     disabled={!isEditing}
//                     min="0"
//                     max="80"
//                     placeholder="0"
//                     className={`${inputClass} pr-16`}
//                   />

//                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6f84a5] text-sm">
//                     years
//                   </span>
//                 </div>
//               </div>

//               {/* Website */}
//               <div>
//                 <label className={labelClass}>
//                   Website / Profile URL
//                 </label>

//                 <input
//                   type="url"
//                   name="webURL"
//                   value={formData.webURL}
//                   onChange={handleChange}
//                   disabled={!isEditing}
//                   placeholder="https://example.com"
//                   className={inputClass}
//                 />
//               </div>

//               {/* Profile Picture */}
//               <div>
//                 <label className={labelClass}>
//                   Profile Picture URL
//                 </label>

//                 <input
//                   type="url"
//                   name="profilePicture"
//                   value={formData.profilePicture}
//                   onChange={handleChange}
//                   disabled={!isEditing}
//                   placeholder="https://example.com/photo.jpg"
//                   className={inputClass}
//                 />
//               </div>

//             </div>
//           </section>

//           {/* Address */}
//           <section className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-7">
//             <div className="mb-6">
//               <h2 className="text-lg sm:text-xl font-semibold text-white">
//                 Address
//               </h2>

//               <p className="text-[#6f84a5] text-sm mt-1">
//                 Add your current or teaching location.
//               </p>
//             </div>

//             <div>
//               <label className={labelClass}>
//                 Address
//               </label>

//               <textarea
//                 name="address"
//                 value={formData.address}
//                 onChange={handleChange}
//                 disabled={!isEditing}
//                 placeholder="Enter your address"
//                 rows={4}
//                 className={`${inputClass} resize-none`}
//               />
//             </div>
//           </section>

//           {/* Action Button */}
//           <div className="flex justify-end pb-4">
//             {!isEditing ? (
//               <button
//                 type="button"
//                 onClick={(e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     handleEdit();
//   }}
//                 className="w-full sm:w-auto min-w-[150px] bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition-colors text-sm font-medium"
//               >
//                 Edit Profile
//               </button>
//             ) : (
//               <button
//                 type="submit"
//                 disabled={saving}
//                 className="w-full sm:w-auto min-w-[150px] bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2"
//               >
//                 {saving ? (
//                   <>
//                     <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                     Saving...
//                   </>
//                 ) : (
//                   "Save Changes"
//                 )}
//               </button>
//             )}
//           </div>

//         </form>
//       </div>
//     </div>
//   );
// }

// export default Profile;



















// ------------------------------------------------












import React, { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import ResumeExtractorModal from "../../components/ResumeExtractorModal";
import "./Profile.css";

const initialSocialLinks = {
  facebook: "",
  instagram: "",
  whatsapp: "",
  telegram: "",
  linkedin: "",
  youtube: "",
  x: "",
};

const socialPlatforms = [
  { key: "facebook", label: "Facebook", mark: "f" },
  { key: "instagram", label: "Instagram", mark: "◎" },
  { key: "whatsapp", label: "WhatsApp", mark: "◉" },
  { key: "telegram", label: "Telegram", mark: "➤" },
  { key: "linkedin", label: "LinkedIn", mark: "in" },
  { key: "youtube", label: "YouTube", mark: "▶" },
  { key: "x", label: "X profile", mark: "𝕏" },
];

function getSafeProfileUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function ProfileViewSection({ title, subtitle, children }) {
  return (
    <section className="profile-view-section">
      <h2>{title}</h2>
      <p className="profile-view-subtitle">{subtitle}</p>
      {children}
    </section>
  );
}

function ProfileViewItem({ label, value, full = false, multiline = false, link = false }) {
  const safeUrl = link ? getSafeProfileUrl(value) : null;
  const content = safeUrl ? (
    <a href={safeUrl} target="_blank" rel="noreferrer">{value}</a>
  ) : (
    value || "Not added"
  );

  return (
    <div className={`profile-view-item ${full ? "profile-view-item--full" : ""}`}>
      {label && <div className="profile-view-label">{label}</div>}
      <div className={`profile-view-value ${multiline ? "is-multiline" : ""}`}>
        {content}
      </div>
    </div>
  );
}

const initialForm = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  mobileNo: "",
  whatsappNo: "",
  alternateNo: "",
  email: "",
  about: "",
  profilePicture: "",
  webURL: "",
  qualification: "",
  address: "",
  teachingYOE: 0,
};

const MAX_IMAGE_SIZE = 20 * 1024;
const PIXEL_KIT_URL = "https://pixel-kit-zeta.vercel.app/";

function Profile() {
  const [formData, setFormData] = useState(initialForm);
  const [savedFormData, setSavedFormData] = useState(initialForm);
  const [socialLinks, setSocialLinks] = useState(initialSocialLinks);
  const [savedSocialLinks, setSavedSocialLinks] = useState(initialSocialLinks);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showResumeModal, setShowResumeModal] = useState(false);

  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");
  const [imageTooLarge, setImageTooLarge] = useState(false);

  const photoInputRef = useRef(null);

  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.user_id ?? user?.userId ?? user?.id ?? null;
    } catch {
      return null;
    }
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

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setSocialLinks((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setFormData(savedFormData);
    setSocialLinks(savedSocialLinks);
    setImagePreview(savedFormData.profilePicture || "");
    setImageError("");
    setImageTooLarge(false);
    setError("");
    setSuccess("");
    setIsEditing(false);
  };

  // Profile picture selection: allow only images up to 20 KB.
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    setImageError("");
    setImageTooLarge(false);
    setError("");
    setSuccess("");

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError("Choose a JPEG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageTooLarge(true);
      setImageError(
        "This image is larger than 20 KB. Compress it and select it again."
      );
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result;

      if (typeof imageData !== "string") {
        setImageError("Could not read this image. Please try another one.");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        profilePicture: imageData,
      }));

      setImagePreview(imageData);
      setImageError("");
      setImageTooLarge(false);
    };

    reader.onerror = () => {
      setImageError("Could not read this image. Please try another one.");
    };

    reader.readAsDataURL(file);
  };

  const handleApplyResume = (extracted) => {
    if (!extracted) return;

    let firstName = formData.firstName;
    let lastName = formData.lastName;

    if (extracted.tutor_name) {
      const parts = extracted.tutor_name.trim().split(/\s+/);
      firstName = parts[0] || firstName;
      lastName = parts.slice(1).join(" ") || lastName;
    }

    let mobileNo = formData.mobileNo;

    if (extracted.phone) {
      const digitsOnly = extracted.phone.replace(/[^0-9]/g, "");
      mobileNo = digitsOnly || extracted.phone;
    }

    let qualification = formData.qualification;

    if (
      Array.isArray(extracted.qualifications) &&
      extracted.qualifications.length > 0
    ) {
      qualification = extracted.qualifications.join(", ");
    }

    setFormData((prev) => ({
      ...prev,
      firstName: firstName || prev.firstName,
      lastName: lastName || prev.lastName,
      email: extracted.email || prev.email,
      mobileNo: mobileNo || prev.mobileNo,
      address: extracted.location || prev.address,
      qualification: qualification || prev.qualification,
      teachingYOE:
        extracted.years_of_experience != null
          ? extracted.years_of_experience
          : prev.teachingYOE,
    }));

    setIsEditing(true);
    setError("");
    setSuccess(
      "Profile details auto-filled from resume! Please review and click Save Changes."
    );
  };

  useEffect(() => {
    let cancelled = false;

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

        if (cancelled) return;

        const data = response.data;

        if (data?.status === 200 && data?.data) {
          const profile = {
            ...initialForm,
            ...data.data,
            firstName: data.data.firstName ?? "",
            lastName: data.data.lastName ?? "",
            dateOfBirth: data.data.dateOfBirth
              ? String(data.data.dateOfBirth).slice(0, 10)
              : "",
            gender: data.data.gender ?? "",
            mobileNo: data.data.mobileNo?.toString() ?? "",
            whatsappNo: data.data.whatsappNo?.toString() ?? "",
            alternateNo: data.data.alternateNo?.toString() ?? "",
            email: data.data.email ?? "",
            about: data.data.about ?? "",
            profilePicture: data.data.profilePicture ?? "",
            webURL: data.data.webURL ?? "",
            qualification: data.data.qualification ?? "",
            address: data.data.address ?? "",
            teachingYOE: data.data.teachingYOE ?? 0,
          };

          setFormData(profile);
          setSavedFormData(profile);
          setImagePreview(profile.profilePicture);

          try {
            const socialResponse = await api.get("/personalDetails/socialMedia", {
              params: { userId },
              timeout: 15000,
            });
            const socialData = socialResponse.data;
            const socialValues =
              socialData?.data?.socialMedia ??
              socialData?.data ??
              socialData?.socialMedia ??
              socialData?.details ??
              {};
            if (socialData?.status === 200) {
              const normalizedSocial = Object.fromEntries(
                Object.keys(initialSocialLinks).map((key) => [
                  key,
                  socialValues[key] ?? "",
                ])
              );
              setSocialLinks(normalizedSocial);
              setSavedSocialLinks(normalizedSocial);
            } else if (socialData?.status === 404) {
              setSocialLinks(initialSocialLinks);
              setSavedSocialLinks(initialSocialLinks);
            } else {
              setError(
                socialData?.message ||
                  "Your profile loaded, but social links could not be loaded."
              );
            }
          } catch (socialError) {
            if (socialError.response?.status === 404) {
              setSocialLinks(initialSocialLinks);
              setSavedSocialLinks(initialSocialLinks);
            } else {
              setSocialLinks(initialSocialLinks);
              setSavedSocialLinks(initialSocialLinks);
              setError(
                "Your profile loaded, but social links could not be loaded."
              );
            }
          }

          // Existing profile opens in read-only mode.
          setIsEditing(false);
        } else if (data?.status === 404) {
          // New profile opens in editing mode.
          setFormData(initialForm);
          setSavedFormData(initialForm);
          setSocialLinks(initialSocialLinks);
          setSavedSocialLinks(initialSocialLinks);
          setImagePreview("");
          setIsEditing(true);
        } else {
          setError(
            data?.message || "Unable to load your profile. Please try again."
          );
        }
      } catch (err) {
        if (cancelled) return;

        if (err.response?.status === 404) {
          setFormData(initialForm);
          setSavedFormData(initialForm);
          setSocialLinks(initialSocialLinks);
          setSavedSocialLinks(initialSocialLinks);
          setImagePreview("");
          setIsEditing(true);
        } else if (err.code === "ECONNABORTED") {
          setError("The server is taking too long to respond. Please try again.");
        } else if (err.response?.status === 422) {
          setError("The profile request was invalid.");
        } else if (err.response?.status >= 500) {
          setError("The server is currently unavailable. Please try again.");
        } else if (err.request) {
          setError(
            "Could not connect to the server. Please check your internet connection."
          );
        } else {
          setError("Something went wrong while loading your profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  // This handler only enables editing. It never saves anything.
  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setError("");
    setSuccess("");
    setFormData(savedFormData);
    setSocialLinks(savedSocialLinks);
    setImagePreview(savedFormData.profilePicture || "");
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Critical safeguard: never save while in read-only mode.
    if (!isEditing || saving) return;

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

    const validatePhone = (value, label, required = false) => {
      const phone = String(value ?? "").trim();

      if (!phone && !required) return "";

      if (!/^\d{10,15}$/.test(phone)) {
        return `${label} must contain 10 to 15 digits.`;
      }

      return "";
    };

    const mobileError = validatePhone(formData.mobileNo, "Mobile number", true);
    const whatsappError = validatePhone(
      formData.whatsappNo,
      "WhatsApp number"
    );
    const alternateError = validatePhone(
      formData.alternateNo,
      "Alternate number"
    );

    if (mobileError || whatsappError || alternateError) {
      setError(mobileError || whatsappError || alternateError);
      return;
    }

    const experience = Number(formData.teachingYOE);

    if (
      Number.isNaN(experience) ||
      experience < 0 ||
      experience > 80
    ) {
      setError("Teaching experience must be between 0 and 80 years.");
      return;
    }

    const invalidSocialUrl = socialPlatforms.find(({ key }) => {
      const value = socialLinks[key].trim();
      if (!value) return false;
      try {
        const url = new URL(value);
        return !["http:", "https:"].includes(url.protocol);
      } catch {
        return true;
      }
    });

    if (invalidSocialUrl) {
      setError(`${invalidSocialUrl.label} must be a valid http or https URL.`);
      return;
    }

    const payload = {
      userId,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim() || null,
      dateOfBirth: formData.dateOfBirth || null,
      gender: formData.gender || null,
      mobileNo: Number(String(formData.mobileNo).trim()),
      whatsappNo: formData.whatsappNo.trim()
        ? Number(formData.whatsappNo.trim())
        : null,
      alternateNo: formData.alternateNo.trim()
        ? Number(formData.alternateNo.trim())
        : null,
      email: formData.email.trim() || null,
      about: formData.about.trim() || null,
      profilePicture: formData.profilePicture || null,
      webURL: formData.webURL.trim() || null,
      qualification: formData.qualification.trim() || "",
      address: formData.address.trim() || null,
      teachingYOE: experience,
    };

    try {
      setSaving(true);

      const response = await api.post("/personalDetails", payload, {
        timeout: 15000,
      });

      const data = response.data;

      if (data?.status === 200) {
        if (data.data) {
          const saved = data.data;

          const updatedForm = {
            ...initialForm,
            ...saved,
            firstName: saved.firstName ?? payload.firstName,
            lastName: saved.lastName ?? payload.lastName ?? "",
            dateOfBirth: saved.dateOfBirth
              ? String(saved.dateOfBirth).slice(0, 10)
              : payload.dateOfBirth ?? "",
            gender: saved.gender ?? payload.gender ?? "",
            mobileNo: saved.mobileNo?.toString() ?? formData.mobileNo,
            whatsappNo:
              saved.whatsappNo?.toString() ?? formData.whatsappNo,
            alternateNo:
              saved.alternateNo?.toString() ?? formData.alternateNo,
            email: saved.email ?? payload.email ?? "",
            about: saved.about ?? payload.about ?? "",
            profilePicture:
              saved.profilePicture ?? payload.profilePicture ?? "",
            webURL: saved.webURL ?? payload.webURL ?? "",
            qualification: saved.qualification ?? payload.qualification,
            address: saved.address ?? payload.address ?? "",
            teachingYOE: saved.teachingYOE ?? payload.teachingYOE,
          };

          setFormData(updatedForm);
          setImagePreview(updatedForm.profilePicture);
          setSavedFormData(updatedForm);
        } else {
          setSavedFormData(formData);
        }

        let socialResponse;
        try {
          socialResponse = await api.post(
            "/personalDetails/socialMedia",
            {
              userId,
              ...Object.fromEntries(
                Object.entries(socialLinks).map(([key, value]) => [
                  key,
                  value.trim() || null,
                ])
              ),
            },
            { timeout: 15000 }
          );
        } catch (socialError) {
          throw new Error(
            `Your profile was saved, but social links could not be saved: ${socialError.response?.data?.message || socialError.message || "Please try again."}`
          );
        }
        if (socialResponse.data?.status !== 200) {
          throw new Error(
            `Your profile was saved, but social links could not be saved: ${socialResponse.data?.message || "Please try again."}`
          );
        }

        setSavedSocialLinks(socialLinks);
        setSuccess("Profile updated successfully.");
        setIsEditing(false);
      } else if (data?.status === 404) {
        setError(
          data?.message || "User account was not found. Please login again."
        );
      } else if (data?.status === 422) {
        setError("Please check the information you entered.");
      } else {
        setError(
          data?.message || "Unable to update your profile. Please try again."
        );
      }
    } catch (err) {
      if (err.message?.startsWith("Your profile was saved, but social links could not be saved")) {
        setError(err.message);
      } else if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Please check your profile before trying again."
        );
      } else if (err.response?.status === 422) {
        setError("Some profile information is invalid. Please check the form.");
      } else if (err.response?.status >= 500) {
        setError("The server is currently unavailable. Please try again.");
      } else if (err.request) {
        setError(
          "Could not connect to the server. Please check your internet connection."
        );
      } else {
        setError("Something went wrong while updating your profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "profile-input";
  const labelClass = "profile-label";

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <span className="profile-spinner" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-content">
        <ResumeExtractorModal
          isOpen={showResumeModal}
          onClose={() => setShowResumeModal(false)}
          onApply={handleApplyResume}
          mode="profile"
        />

        <header className="profile-heading">
          <div>
            <h1>Personal details</h1>
            <p>Add and manage the information shown on your tutor profile.</p>
          </div>
          <div className="profile-head-actions">
            {!isEditing && (
              <button type="button" onClick={handleEdit} className="profile-button profile-button--primary">
                <span aria-hidden="true">✎</span> Edit profile
              </button>
            )}
            <button type="button" onClick={() => setShowResumeModal(true)} className="profile-button">
              <span aria-hidden="true">↑</span> Upload resume
            </button>
          </div>
        </header>

        <div className="profile-resume-help">
          <span aria-hidden="true">ⓘ</span>
          <p><strong>Save time filling out your profile.</strong> Upload your resume to fill in your details automatically, then review them before saving.</p>
        </div>

        {error && (
          <div className="profile-notice profile-notice--error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="profile-notice profile-notice--success" role="status">
            {success}
          </div>
        )}

        {isEditing ? (
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // Prevent Enter from accidentally submitting the read-only form.
            if (e.key === "Enter" && !isEditing) {
              e.preventDefault();
            }
          }}
          className="profile-form-grid"
        >
          <section className="profile-section">
            <div className="profile-section-head">
              <span className="profile-section-icon" aria-hidden="true">♙</span>
              <div><h2>Basic information</h2><p>Tell students a little about yourself.</p></div>
            </div>

            <div className="profile-fields">
              <div>
                <label className={labelClass}>
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  maxLength={100}
                  placeholder="Enter your first name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  maxLength={100}
                  placeholder="Enter your last name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`${inputClass} appearance-none`}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Mobile Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  name="mobileNo"
                  value={formData.mobileNo}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="Enter mobile number"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>WhatsApp Number</label>
                <input
                  type="tel"
                  name="whatsappNo"
                  value={formData.whatsappNo}
                  onChange={handleChange}
                  disabled={!isEditing}
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="Enter WhatsApp number"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Alternate Number</label>
                <input
                  type="tel"
                  name="alternateNo"
                  value={formData.alternateNo}
                  onChange={handleChange}
                  disabled={!isEditing}
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="Enter alternate number"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Email</label>
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

              <div className="profile-field-full">
                <label className={labelClass}>About</label>
                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Tell students about yourself, your teaching style, experience, etc."
                  rows={5}
                  maxLength={10000}
                  className={`${inputClass} resize-none`}
                />
                <span className="profile-hint">{formData.about.length} / 10,000 characters</span>
              </div>
            </div>
          </section>

          <section className="profile-section">
            <div className="profile-section-head">
              <span className="profile-section-icon" aria-hidden="true">▤</span>
              <div><h2>Professional information</h2><p>Add your teaching experience and professional details.</p></div>
            </div>

            <div className="profile-fields">
              <div>
                <label className={labelClass}>Qualification</label>
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

              <div>
                <label className={labelClass}>Teaching Experience</label>
                <div className="profile-input-suffix">
                  <input
                    type="number"
                    name="teachingYOE"
                    value={formData.teachingYOE}
                    onChange={handleChange}
                    disabled={!isEditing}
                    min="0"
                    max="80"
                    className={`${inputClass} pr-16`}
                  />
                  <span>years</span>
                </div>
              </div>

              <div>
                <label className={labelClass}>Website / Profile URL</label>
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
            </div>
          </section>

          <section className="profile-section">
            <div className="profile-section-head">
              <span className="profile-section-icon" aria-hidden="true">⌖</span>
              <div><h2>Address</h2><p>Add your current or teaching location.</p></div>
            </div>

            <div className="profile-fields">
              <div className="profile-field-full">
                <label className={labelClass}>Address</label>
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
            </div>
          </section>

          <section className="profile-section">
            <div className="profile-section-head">
              <span className="profile-section-icon" aria-hidden="true">◎</span>
              <div><h2>Social profiles</h2><p>Help students connect with your teaching community.</p></div>
            </div>
            <div className="profile-fields profile-social-fields">
              {socialPlatforms.map(({ key, label, mark }) => (
                <div key={key}>
                  <label className={labelClass} htmlFor={`social-${key}`}>
                    <span className={`profile-social-mark profile-social-mark--${key}`}>{mark}</span>{label}
                  </label>
                  <input
                    id={`social-${key}`}
                    type="url"
                    name={key}
                    value={socialLinks[key]}
                    onChange={handleSocialChange}
                    disabled={!isEditing}
                    maxLength={2048}
                    placeholder={`https://${key === "x" ? "x.com" : `${key}.com`}/yourprofile`}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </section>

          <aside className="profile-photo-aside">
            <section className="profile-photo-panel">
              <h2>Profile picture</h2>
              <p>Use a clear, recent photo so students can recognize you.</p>
              <div className="profile-photo-showcase">
                <div className="profile-photo">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile preview" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <div className="profile-photo-copy">
                  <strong>{imagePreview ? "Profile picture selected" : "Add a profile picture"}</strong>
                  <p>JPG, PNG or WebP · up to 20 KB</p>
                  <label className="profile-button profile-photo-button">
                    <span aria-hidden="true">↑</span> Choose photo
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      disabled={!isEditing}
                    />
                  </label>
                  <span className="profile-photo-meta">
                    {imagePreview ? "Photo ready to save" : "Select an image to upload"}
                  </span>
                </div>
              </div>
              {imageError && (
                <div className="profile-image-error">
                  <p>{imageError}</p>
                  {imageTooLarge && (
                    <a href={PIXEL_KIT_URL} target="_blank" rel="noopener noreferrer">
                      Compress image on Pixel Kit ↗
                    </a>
                  )}
                </div>
              )}
              <div className="profile-photo-tip">
                Your photo is stored with your profile and appears on your public tutor page.
              </div>
            </section>
          </aside>

          <div className="profile-savebar">
            <span>Your profile information is only updated when you save.</span>
            <div className="profile-save-actions">
              <button type="button" className="profile-button" onClick={handleCancelEdit} disabled={saving}>Cancel</button>
              <button
                type="submit"
                disabled={saving}
                className="profile-button profile-button--primary"
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
            </div>
          </div>
        </form>
        ) : (
          <div className="profile-view">
            <div className="profile-view-stack">
              <ProfileViewSection title="Basic information" subtitle="Personal and contact details.">
                <div className="profile-view-grid">
                  <ProfileViewItem label="First name" value={formData.firstName} />
                  <ProfileViewItem label="Last name" value={formData.lastName} />
                  <ProfileViewItem label="Date of birth" value={formData.dateOfBirth ? new Date(`${formData.dateOfBirth}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""} />
                  <ProfileViewItem label="Gender" value={formData.gender} />
                  <ProfileViewItem label="Mobile number" value={formData.mobileNo} />
                  <ProfileViewItem label="WhatsApp number" value={formData.whatsappNo} />
                  <ProfileViewItem label="Alternate number" value={formData.alternateNo} />
                  <ProfileViewItem label="Email" value={formData.email} />
                  <ProfileViewItem label="About" value={formData.about} full multiline />
                </div>
              </ProfileViewSection>

              <ProfileViewSection title="Professional information" subtitle="Your qualifications, experience, and professional link.">
                <div className="profile-view-grid">
                  <ProfileViewItem label="Qualifications" value={formData.qualification} />
                  <ProfileViewItem label="Teaching experience" value={formData.teachingYOE ? `${formData.teachingYOE} years` : ""} />
                  <ProfileViewItem label="Website or profile URL" value={formData.webURL} full link />
                </div>
              </ProfileViewSection>

              <ProfileViewSection title="Address" subtitle="Current or teaching location.">
                <ProfileViewItem label="" value={formData.address} multiline />
              </ProfileViewSection>

              <ProfileViewSection title="Social profiles" subtitle="Your public social links.">
                <div className="profile-view-socials">
                  {socialPlatforms.filter(({ key }) => socialLinks[key].trim()).map(({ key, label, mark }) => {
                    const safeUrl = getSafeProfileUrl(socialLinks[key]);
                    const content = <><span className={`profile-social-mark profile-social-mark--${key}`}>{mark}</span>{label}</>;
                    return safeUrl ? (
                      <a key={key} className="profile-view-social" href={safeUrl} target="_blank" rel="noreferrer">
                        {content}
                      </a>
                    ) : (
                      <span key={key} className="profile-view-social">{content}</span>
                    );
                  })}
                  {!socialPlatforms.some(({ key }) => socialLinks[key].trim()) && (
                    <span className="profile-view-empty">No social links added</span>
                  )}
                </div>
              </ProfileViewSection>
            </div>
            <aside className="profile-photo-aside">
              <section className="profile-photo-panel">
                <h2>Profile picture</h2>
                <p>Photo shown on your tutor profile.</p>
                <div className="profile-photo-showcase profile-photo-showcase--view">
                  <div className="profile-photo">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="profile-view-photo-name">
                  {imagePreview ? "Profile picture uploaded" : "No profile picture uploaded"}
                </div>
                <div className="profile-photo-tip">To update your photo, choose Edit profile.</div>
              </section>
            </aside>
            <div className="profile-view-actions">
              <button type="button" onClick={handleEdit} className="profile-button profile-button--primary">Edit profile</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;

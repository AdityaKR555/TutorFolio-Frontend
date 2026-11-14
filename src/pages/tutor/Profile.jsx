import PlatformLoader from "../../components/PlatformLoader";
import React, { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import ResumeExtractorModal from "../../components/ResumeExtractorModal";
import { setAuthSession, getStoredUser } from "../../utils/auth";
import { UPLOAD_LIMITS } from "../../api/uploadLimits";

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
    <section className="tf-card min-w-0 p-5 shadow-sm max-[560px]:p-4">
      <h2 className="tf-section-title mt-0 mb-1">{title}</h2>
      <p className="mb-4 text-[11px] text-[var(--tf-muted)]">{subtitle}</p>
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
    <div className={`min-w-0 ${full ? "col-span-full max-[560px]:col-auto" : ""}`}>
      {label && <div className="mb-[3px] text-[10px] text-[var(--tf-muted)]">{label}</div>}
      <div className={`break-words text-xs font-semibold text-[var(--tf-ink)] [&_a]:text-[var(--tf-blue)] [&_a]:no-underline [&_a:hover]:underline ${multiline ? "whitespace-pre-line font-normal leading-relaxed" : ""}`}>
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

const { maxSizeBytes: MAX_IMAGE_SIZE, label: MAX_IMAGE_LABEL } = UPLOAD_LIMITS["profile"];
const PIXEL_KIT_URL = "https://pixel-kit-zeta.vercel.app/";

function Profile() {
  const [formData, setFormData] = useState(initialForm);
  const [savedFormData, setSavedFormData] = useState(initialForm);
  const [socialLinks, setSocialLinks] = useState(initialSocialLinks);
  const [savedSocialLinks, setSavedSocialLinks] = useState(initialSocialLinks);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  const [discoverabilitySaving, setDiscoverabilitySaving] = useState(false);
  const [discoverabilityError, setDiscoverabilityError] = useState("");
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

  // Profile picture selection: allow only images within the server-defined size limit.
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
        `This image is larger than ${MAX_IMAGE_LABEL}. Compress it and select it again.`
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

        try {
          const visibilityResponse = await api.get("/personalDetails/discoverability", { timeout: 15000 });
          if (!cancelled && visibilityResponse.data?.status === 200) {
            setIsDiscoverable(visibilityResponse.data?.data?.isVisible !== false);
          }
        } catch {
          // Visibility control remains enabled with the legacy default until a profile is saved.
        }

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
            profilePicture:
              data.data.profilePicture ??
              data.data.profile_picture ??
              data.data.profilepicture ??
              data.data.profilePhoto ??
              data.data.profile_photo ??
              data.data.avatar ??
              "",
            webURL: data.data.webURL ?? "",
            qualification: data.data.qualification ?? "",
            address: data.data.address ?? "",
            teachingYOE: data.data.teachingYOE ?? 0,
          };

          setFormData(profile);
          setSavedFormData(profile);
          setImagePreview(profile.profilePicture);

          if (profile.profilePicture) {
            try {
              const currentUser = getStoredUser() || {};
              if (currentUser.profilePicture !== profile.profilePicture) {
                setAuthSession({ ...currentUser, profilePicture: profile.profilePicture });
              }
            } catch {
              // Non-critical: auth storage error
            }
          }

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
        } else if (
          data?.status === 404 ||
          data?.status === 500 ||
          (typeof data?.message === "string" && data.message.toLowerCase().includes("internal server error"))
        ) {
          // No profile row in DB yet (common for new or OAuth users) -> allow tutor to fill it
          const storedUser = (() => {
            try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
          })();
          const newForm = {
            ...initialForm,
            firstName: storedUser?.username || "",
            email: storedUser?.email || "",
          };
          setFormData(newForm);
          setSavedFormData(newForm);
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

        const isNewUserOrMissingProfile =
          err.response?.status === 404 ||
          err.response?.status === 500 ||
          err.response?.data?.status === 500 ||
          (typeof err.response?.data?.message === "string" &&
            err.response.data.message.toLowerCase().includes("internal server error"));

        if (isNewUserOrMissingProfile) {
          // Backend throws 500 or 404 when user has no TutorsProfile row yet
          const storedUser = (() => {
            try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
          })();
          const newForm = {
            ...initialForm,
            firstName: storedUser?.username || "",
            email: storedUser?.email || "",
          };
          setFormData(newForm);
          setSavedFormData(newForm);
          setSocialLinks(initialSocialLinks);
          setSavedSocialLinks(initialSocialLinks);
          setImagePreview("");
          setIsEditing(true);
          setError("");
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

  const handleDiscoverabilityChange = async (event) => {
    const nextValue = event.target.checked;
    setDiscoverabilitySaving(true);
    setDiscoverabilityError("");
    try {
      const response = await api.patch("/personalDetails/discoverability", {
        isVisible: nextValue,
      }, { timeout: 15000 });
      if (response.data?.status !== 200) {
        throw new Error(response.data?.message || "Could not update profile visibility.");
      }
      setIsDiscoverable(response.data.data?.isVisible !== false);
    } catch (err) {
      setDiscoverabilityError(
        err.response?.data?.message || err.message || "Could not update profile visibility. Please try again."
      );
    } finally {
      setDiscoverabilitySaving(false);
    }
  };

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
              saved.profilePicture ??
              saved.profile_picture ??
              saved.profilepicture ??
              saved.profilePhoto ??
              payload.profilePicture ??
              "",
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

        // Sync the updated profilePicture into localStorage so the header
        // avatar reflects the change without a full page reload.
        try {
          const currentUser = getStoredUser() || {};
          const newPicture = updatedForm?.profilePicture ?? formData.profilePicture ?? "";
          if (currentUser.profilePicture !== newPicture) {
            setAuthSession({ ...currentUser, profilePicture: newPicture });
          }
        } catch {
          // Non-critical: the header will show the updated picture on next reload.
        }
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

  const inputClass = "tf-field disabled:cursor-default disabled:border-transparent disabled:bg-tf-surface-soft disabled:opacity-100";
  const labelClass = "tf-label my-0 flex items-center gap-[7px]";

  if (loading) {
    return (
      <div className="min-h-full bg-[var(--tf-bg)] px-8 pt-[34px] pb-[58px] text-[var(--tf-ink)] [font:14px/1.5_Inter,ui-sans-serif,system-ui,-apple-system,'Segoe_UI',sans-serif] max-[850px]:px-[18px] max-[850px]:pt-6 max-[850px]:pb-10 max-[560px]:px-[14px] max-[560px]:pt-5 max-[560px]:pb-8 [&:where([data-theme=dark] *)]:bg-[var(--tf-bg)] [&:where([data-theme=dark] *)]:text-[var(--tf-ink)]">
        <div className="mx-auto grid min-h-80 place-content-center gap-3 rounded-[13px] border border-[var(--tf-line)] bg-[var(--tf-surface)] text-center text-[var(--tf-copy)] [&:where([data-theme=dark] *)]:bg-[var(--tf-surface)]">
          <PlatformLoader showLabel={false} />
          <p className="m-0 text-xs">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-page mobile-profile min-h-full bg-[var(--tf-bg)] px-8 pt-[34px] pb-[58px] text-[var(--tf-ink)] [font:14px/1.5_Inter,ui-sans-serif,system-ui,-apple-system,'Segoe_UI',sans-serif] max-[850px]:px-[18px] max-[850px]:pt-6 max-[850px]:pb-10 max-[560px]:px-[14px] max-[560px]:pt-5 max-[560px]:pb-8 [&:where([data-theme=dark] *)]:bg-[var(--tf-bg)] [&:where([data-theme=dark] *)]:text-[var(--tf-ink)]">
      <div className="mx-auto max-w-[1100px]">
        <ResumeExtractorModal
          isOpen={showResumeModal}
          onClose={() => setShowResumeModal(false)}
          onApply={handleApplyResume}
          mode="profile"
        />

        <header className="mobile-heading mb-5 flex items-start justify-between gap-5 max-[560px]:flex-col">
          <div>
            <h1 className="tf-page-title mt-0 mb-2">Personal details</h1>
            <p className="m-0 text-[13px] text-[var(--tf-copy)]">Add and manage the information shown on your tutor profile.</p>
          </div>
          <div className="flex items-center gap-[9px] max-[560px]:w-full">
            {!isEditing && (
              <button type="button" onClick={handleEdit} className="inline-flex min-h-[38px] items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[var(--tf-blue)] bg-[var(--tf-blue)] px-[14px] py-[9px] text-xs font-semibold text-[var(--tf-on-primary)] transition-colors hover:border-[var(--tf-blue-pressed)] hover:bg-[var(--tf-blue-pressed)] max-[560px]:w-full">
                <span aria-hidden="true">✎</span> <span className="mobile-profile-edit-label">Edit profile</span>
              </button>
            )}
            <button type="button" onClick={() => setShowResumeModal(true)} className="inline-flex min-h-[38px] items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[var(--tf-line)] bg-[var(--tf-surface)] px-[14px] py-[9px] text-xs font-semibold text-[var(--tf-copy)] transition-colors hover:bg-[var(--tf-surface-soft)] hover:text-[var(--tf-blue)] max-[560px]:w-full [&:where([data-theme=dark] *)]:bg-[var(--tf-surface)]">
              <span aria-hidden="true">↑</span> <span className="hidden min-[761px]:inline">Upload resume</span><span className="min-[761px]:hidden">Resume</span>
            </button>
          </div>
        </header>

        <div className="mb-5 flex items-start gap-2.5 rounded-[10px] border border-[var(--tf-line)] bg-gradient-to-r from-[var(--tf-sky)] to-[var(--tf-surface)] px-[14px] py-3 text-xs text-[var(--tf-copy)] max-[560px]:text-[11px] [&:where([data-theme=dark] *)]:from-[var(--tf-sky)] [&:where([data-theme=dark] *)]:to-[var(--tf-surface)]">
          <span className="shrink-0 text-[17px] leading-[1.2] text-[var(--tf-blue)]" aria-hidden="true">ⓘ</span>
          <p className="m-0"><strong className="text-[var(--tf-ink)]">Save time filling out your profile.</strong> Upload your resume to fill in your details automatically, then review them before saving.</p>
        </div>

        {error && (
          <div className="mb-[15px] rounded-[9px] border border-[var(--tf-line)] bg-[var(--tf-danger-soft)] px-[14px] py-[11px] text-xs text-[var(--tf-danger)]" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-[15px] rounded-[9px] border border-[var(--tf-line)] bg-[var(--tf-success-soft)] px-[14px] py-[11px] text-xs text-[var(--tf-success)]" role="status">
            {success}
          </div>
        )}

        <section className="tf-card mb-5 flex items-center justify-between gap-5 p-5 shadow-sm max-[560px]:items-start max-[560px]:p-4">
          <div className="min-w-0">
            <h2 className="tf-section-title mt-0 mb-1">Discover Tutors visibility</h2>
            <p className="m-0 max-w-[680px] text-xs leading-relaxed text-[var(--tf-copy)]">
              {isDiscoverable
                ? "Your profile can appear in tutor searches, suggestions, and discovery previews."
                : "Your profile is hidden from tutor searches, suggestions, and discovery previews. Your public tutor website stays available."}
            </p>
            {discoverabilityError && <p className="mt-2 mb-0 text-xs text-[var(--tf-danger)]" role="alert">{discoverabilityError}</p>}
          </div>
          <label className="inline-flex shrink-0 cursor-pointer items-center gap-3 text-xs font-semibold text-[var(--tf-ink)]">
            <span>{isDiscoverable ? "Visible" : "Hidden"}</span>
            <input
              type="checkbox"
              role="switch"
              aria-label="Show my profile in Discover Tutors"
              checked={isDiscoverable}
              disabled={discoverabilitySaving}
              onChange={handleDiscoverabilityChange}
              className="peer sr-only"
            />
            <span aria-hidden="true" className={`relative h-6 w-11 rounded-full transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--tf-blue)] ${isDiscoverable ? "bg-[var(--tf-blue)] after:translate-x-5" : "bg-slate-300"}`} />
            {discoverabilitySaving && <span className="sr-only">Saving visibility setting</span>}
          </label>
        </section>

        {isEditing ? (
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // Prevent Enter from accidentally submitting the read-only form.
            if (e.key === "Enter" && !isEditing) {
              e.preventDefault();
            }
          }}
          className="grid grid-cols-[minmax(0,1fr)_284px] items-start gap-4 [&>section]:col-start-1 max-[850px]:grid-cols-1"
        >
          <section className="tf-card min-w-0 p-5 shadow-sm max-[560px]:p-4">
            <div className="mb-[19px] flex items-start gap-3 [&_h2]:mt-0 [&_h2]:mb-[3px] [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-[var(--tf-ink)] [&_p]:m-0 [&_p]:text-[11px] [&_p]:text-[var(--tf-muted)]">
              <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-[var(--tf-sky)] text-[17px] font-bold text-[var(--tf-blue)]" aria-hidden="true">♙</span>
              <div><h2>Basic information</h2><p>Tell students a little about yourself.</p></div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-[14px] [&>div]:grid [&>div]:min-w-0 [&>div]:content-start [&>div]:gap-1.5 max-[560px]:grid-cols-1">
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

              <div className="col-span-full grid min-w-0 content-start gap-1.5 max-[560px]:col-auto">
                <label className={labelClass}>About</label>
                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Tell students about yourself, your teaching style, experience, etc."
                  rows={5}
                  maxLength={10000}
                  className={`${inputClass} min-h-[92px] resize-none`}
                />
                <span className="text-[10px] text-[var(--tf-muted)]">{formData.about.length} / 10,000 characters</span>
              </div>
            </div>
          </section>

          <section className="tf-card min-w-0 p-5 shadow-sm max-[560px]:p-4">
            <div className="mb-[19px] flex items-start gap-3 [&_h2]:mt-0 [&_h2]:mb-[3px] [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-[var(--tf-ink)] [&_p]:m-0 [&_p]:text-[11px] [&_p]:text-[var(--tf-muted)]">
              <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-[var(--tf-sky)] text-[17px] font-bold text-[var(--tf-blue)]" aria-hidden="true">▤</span>
              <div><h2>Professional information</h2><p>Add your teaching experience and professional details.</p></div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-[14px] [&>div]:grid [&>div]:min-w-0 [&>div]:content-start [&>div]:gap-1.5 max-[560px]:grid-cols-1">
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
                <div className="relative">
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
                  <span className="pointer-events-none absolute right-[11px] top-1/2 -translate-y-1/2 text-[10px] text-[var(--tf-muted)]">years</span>
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

          <section className="tf-card min-w-0 p-5 shadow-sm max-[560px]:p-4">
            <div className="mb-[19px] flex items-start gap-3 [&_h2]:mt-0 [&_h2]:mb-[3px] [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-[var(--tf-ink)] [&_p]:m-0 [&_p]:text-[11px] [&_p]:text-[var(--tf-muted)]">
              <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-[var(--tf-sky)] text-[17px] font-bold text-[var(--tf-blue)]" aria-hidden="true">⌖</span>
              <div><h2>Address</h2><p>Add your current or teaching location.</p></div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-[14px] [&>div]:grid [&>div]:min-w-0 [&>div]:content-start [&>div]:gap-1.5 max-[560px]:grid-cols-1">
              <div className="col-span-full grid min-w-0 content-start gap-1.5 max-[560px]:col-auto">
                <label className={labelClass}>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter your address"
                  rows={4}
                  className={`${inputClass} min-h-[92px] resize-none`}
                />
              </div>
            </div>
          </section>

          <section className="tf-card min-w-0 p-5 shadow-sm max-[560px]:p-4">
            <div className="mb-[19px] flex items-start gap-3 [&_h2]:mt-0 [&_h2]:mb-[3px] [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-[var(--tf-ink)] [&_p]:m-0 [&_p]:text-[11px] [&_p]:text-[var(--tf-muted)]">
              <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-[var(--tf-sky)] text-[17px] font-bold text-[var(--tf-blue)]" aria-hidden="true">◎</span>
              <div><h2>Social profiles</h2><p>Help students connect with your teaching community.</p></div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-[14px] [&>div]:grid [&>div]:min-w-0 [&>div]:content-start [&>div]:gap-1.5 max-[560px]:grid-cols-1">
              {socialPlatforms.map(({ key, label, mark }) => (
                <div key={key}>
                  <label className={labelClass} htmlFor={`social-${key}`}>
                    <span className={`inline-grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-[var(--tf-sky)] text-xs font-bold text-[var(--tf-blue)] ${key === "facebook" ? "text-[#1877f2]" : key === "instagram" ? "text-[#c13584]" : key === "whatsapp" ? "text-[#128c7e]" : key === "telegram" ? "text-[#229ed9]" : key === "linkedin" ? "text-[#0a66c2]" : key === "youtube" ? "text-[#e62117]" : "text-[var(--tf-ink)]"}`}>{mark}</span>{label}
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

          <aside className="col-start-2 row-span-5 sticky top-5 max-[850px]:col-start-1 max-[850px]:row-auto max-[850px]:static">
            <section className="tf-card min-w-0 p-5 shadow-sm">
              <h2 className="tf-section-title mt-0 mb-1">Profile picture</h2>
              <p className="mb-[17px] mt-0 text-[11px] text-[var(--tf-muted)]">Use a clear, recent photo so students can recognize you.</p>
              <div className="flex min-h-28 items-center gap-3.5 rounded-[11px] border border-dashed border-[var(--tf-blue)] bg-gradient-to-br from-[var(--tf-surface-soft)] to-[var(--tf-sky)] p-[15px] [&:where([data-theme=dark] *)]:from-[var(--tf-surface-soft)] [&:where([data-theme=dark] *)]:to-[var(--tf-sky)] max-[560px]:flex-col max-[560px]:text-center">
                <div className="grid h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-white bg-[var(--tf-sky)] text-[var(--tf-blue-pressed)] shadow-[0_0_0_1px_#e1eaf4] [&:where([data-theme=dark] *)]:border-[var(--tf-line)] [&_svg]:h-[33px] [&_svg]:w-[33px] [&_img]:h-full [&_img]:w-full [&_img]:object-cover">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile preview" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <div className="grid min-w-0 justify-items-start gap-[5px] max-[560px]:justify-items-center">
                  <strong className="text-xs text-[var(--tf-ink)]">{imagePreview ? "Profile picture selected" : "Add a profile picture"}</strong>
                  <p className="m-0 text-[10px] text-[var(--tf-muted)]">JPG, PNG or WebP · up to {MAX_IMAGE_LABEL}</p>
                  <label className="relative inline-flex min-h-[31px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[var(--tf-line)] bg-[var(--tf-surface)] px-[9px] py-1.5 text-[11px] font-semibold text-[var(--tf-copy)] [&_input]:absolute [&_input]:h-px [&_input]:w-px [&_input]:overflow-hidden [&_input]:opacity-0 has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-60 [&:where([data-theme=dark] *)]:bg-[var(--tf-surface)]">
                    <span aria-hidden="true">↑</span> Choose photo
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      disabled={!isEditing}
                    />
                  </label>
                  <span className="max-w-full break-words text-[10px] text-[var(--tf-muted)]">
                    {imagePreview ? "Photo ready to save" : "Select an image to upload"}
                  </span>
                </div>
              </div>
              {imageError && (
                <div className="mt-3 text-[11px] text-[var(--tf-danger)]">
                  <p className="mb-1.5 mt-0">{imageError}</p>
                  {imageTooLarge && (
                    <a className="font-semibold text-[var(--tf-blue)]" href={PIXEL_KIT_URL} target="_blank" rel="noopener noreferrer">
                      Compress image on Pixel Kit ↗
                    </a>
                  )}
                </div>
              )}
              <div className="mt-[14px] border-t border-[var(--tf-line)] pt-3 text-[10px] leading-relaxed text-[var(--tf-muted)]">
                Your photo is stored with your profile and appears on your public tutor page.
              </div>
            </section>
          </aside>

          <div className="col-span-full flex items-center justify-between gap-[15px] px-0.5 pt-[13px] max-[850px]:col-start-1 max-[560px]:items-start max-[560px]:flex-col">
            <span className="text-[11px] text-[var(--tf-muted)]">Your profile information is only updated when you save.</span>
            <div className="flex items-center justify-end gap-[9px] max-[560px]:w-full">
              <button type="button" className="inline-flex min-h-[38px] items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[var(--tf-line)] bg-[var(--tf-surface)] px-[14px] py-[9px] text-xs font-semibold text-[var(--tf-copy)] transition-colors hover:bg-[var(--tf-surface-soft)] hover:text-[var(--tf-blue)] disabled:cursor-not-allowed disabled:opacity-[.58] [&:where([data-theme=dark] *)]:bg-[var(--tf-surface)]" onClick={handleCancelEdit} disabled={saving}>Cancel</button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[38px] items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[var(--tf-blue)] bg-[var(--tf-blue)] px-[14px] py-[9px] text-xs font-semibold text-[var(--tf-on-primary)] transition-colors hover:border-[var(--tf-blue-pressed)] hover:bg-[var(--tf-blue-pressed)] disabled:cursor-not-allowed disabled:opacity-[.58]"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-[var(--tf-on-primary)]" />
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
          <div className="grid grid-cols-[minmax(0,1fr)_284px] items-start gap-4 max-[850px]:grid-cols-1">
            <div className="col-start-1 grid gap-4">
              <ProfileViewSection title="Basic information" subtitle="Personal and contact details.">
                <div className="grid grid-cols-2 gap-x-4 gap-y-[14px] max-[560px]:grid-cols-1">
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
                <div className="grid grid-cols-2 gap-x-4 gap-y-[14px] max-[560px]:grid-cols-1">
                  <ProfileViewItem label="Qualifications" value={formData.qualification} />
                  <ProfileViewItem label="Teaching experience" value={formData.teachingYOE ? `${formData.teachingYOE} years` : ""} />
                  <ProfileViewItem label="Website or profile URL" value={formData.webURL} full link />
                </div>
              </ProfileViewSection>

              <ProfileViewSection title="Address" subtitle="Current or teaching location.">
                <ProfileViewItem label="" value={formData.address} multiline />
              </ProfileViewSection>

              <ProfileViewSection title="Social profiles" subtitle="Your public social links.">
                <div className="flex flex-wrap gap-2">
                  {socialPlatforms.filter(({ key }) => socialLinks[key].trim()).map(({ key, label, mark }) => {
                    const safeUrl = getSafeProfileUrl(socialLinks[key]);
                    const content = <><span className={`inline-grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-[var(--tf-sky)] text-xs font-bold text-[var(--tf-blue)] ${key === "facebook" ? "text-[#1877f2]" : key === "instagram" ? "text-[#c13584]" : key === "whatsapp" ? "text-[#128c7e]" : key === "telegram" ? "text-[#229ed9]" : key === "linkedin" ? "text-[#0a66c2]" : key === "youtube" ? "text-[#e62117]" : "text-[var(--tf-ink)]"}`}>{mark}</span>{label}</>;
                    return safeUrl ? (
                      <a key={key} className="inline-flex items-center gap-[7px] rounded-lg border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-[9px] py-1.5 text-[10px] text-[var(--tf-copy)] hover:text-[var(--tf-blue)] [&:where([data-theme=dark] *)]:bg-[var(--tf-surface-soft)]" href={safeUrl} target="_blank" rel="noreferrer">
                        {content}
                      </a>
                    ) : (
                      <span key={key} className="inline-flex items-center gap-[7px] rounded-lg border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-[9px] py-1.5 text-[10px] text-[var(--tf-copy)] [&:where([data-theme=dark] *)]:bg-[var(--tf-surface-soft)]">{content}</span>
                    );
                  })}
                  {!socialPlatforms.some(({ key }) => socialLinks[key].trim()) && (
                    <span className="text-[11px] text-[var(--tf-muted)]">No social links added</span>
                  )}
                </div>
              </ProfileViewSection>
            </div>
            <aside className="col-start-2 row-span-5 sticky top-5 max-[850px]:col-start-1 max-[850px]:row-auto max-[850px]:static">
              <section className="tf-card min-w-0 p-5 shadow-sm">
                <h2 className="tf-section-title mt-0 mb-1">Profile picture</h2>
                <p className="mb-[17px] mt-0 text-[11px] text-[var(--tf-muted)]">Photo shown on your tutor profile.</p>
                <div className="flex min-h-28 items-center justify-center gap-3.5 rounded-[11px] border border-dashed border-[var(--tf-blue)] bg-gradient-to-br from-[var(--tf-surface-soft)] to-[var(--tf-sky)] px-2.5 py-[22px] [&:where([data-theme=dark] *)]:from-[var(--tf-surface-soft)] [&:where([data-theme=dark] *)]:to-[var(--tf-sky)]">
                  <div className="grid h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-white bg-[var(--tf-sky)] text-[var(--tf-blue-pressed)] shadow-[0_0_0_1px_#e1eaf4] [&:where([data-theme=dark] *)]:border-[var(--tf-line)] [&_svg]:h-[33px] [&_svg]:w-[33px] [&_img]:h-full [&_img]:w-full [&_img]:object-cover">
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
                <div className="mt-2.5 text-center text-xs font-semibold text-[var(--tf-ink)] max-[850px]:text-left">
                  {imagePreview ? "Profile picture uploaded" : "No profile picture uploaded"}
                </div>
                <div className="mt-[14px] border-t border-[var(--tf-line)] pt-3 text-[10px] leading-relaxed text-[var(--tf-muted)]">To update your photo, choose Edit profile.</div>
              </section>
            </aside>
            <div className="col-span-full flex justify-end max-[850px]:col-start-1">
              <button type="button" onClick={handleEdit} className="inline-flex min-h-[38px] items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[var(--tf-blue)] bg-[var(--tf-blue)] px-[14px] py-[9px] text-xs font-semibold text-[var(--tf-on-primary)] transition-colors hover:border-[var(--tf-blue-pressed)] hover:bg-[var(--tf-blue-pressed)]">Edit profile</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;

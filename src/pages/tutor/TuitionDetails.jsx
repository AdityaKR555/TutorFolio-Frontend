import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { UPLOAD_LIMITS } from "../../api/uploadLimits";

const { maxSizeBytes: MAX_LOGO_SIZE, label: MAX_LOGO_LABEL } = UPLOAD_LIMITS["tuition-logo"];

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
  const [savedFormData, setSavedFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [coordinatesOpen, setCoordinatesOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

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
          const loadedFormData = {
            tuitionName: tuition.tuitionName ?? "",
            owners: tuition.owners ?? "",
            description:
              tuition["descript]ion"] ?? tuition.description ?? "",
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
          };
          setLogoUrl(tuition.logo ?? tuition.logoUrl ?? tuition.logo_url ?? "");
          setFormData(loadedFormData);
          setSavedFormData(loadedFormData);
          setCoordinatesOpen(
            loadedFormData.latitude !== "" || loadedFormData.longitude !== ""
          );
          setIsEditing(false);
        } else if (data?.status === 404) {
          setFormData(initialForm);
          setSavedFormData(initialForm);
          setIsEditing(false);
        } else {
          setError(
            data?.message ||
              "Unable to load your tuition details. Please try again."
          );
        }
      } catch (err) {
        if (err.code === "ECONNABORTED") {
          setError("The server is taking too long to respond. Please try again.");
        } else if (err.response?.status === 422) {
          setError("The tuition details request was invalid.");
        } else if (err.response?.status >= 500) {
          setError("The server is currently unavailable. Please try again in a moment.");
        } else if (err.request) {
          setError("Could not connect to the server. Please check your internet connection.");
        } else {
          setError("Something went wrong while loading your tuition details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTuitionDetails();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleEdit = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setFormData(savedFormData);
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!supportedTypes.includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image for your tuition logo.");
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setError(`Logo is too large. Maximum allowed size is ${MAX_LOGO_LABEL}.`);
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      setUploadingLogo(true);
      setError("");
      setSuccess("");
      const response = await api.post("/tuitionDetails/logo", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });
      const data = response.data;

      if (data?.status === 200) {
        const uploadResult = data?.data;
        const uploadedUrl =
          (typeof uploadResult === "string" ? uploadResult : null) ??
          uploadResult?.logoUrl ??
          uploadResult?.logo ??
          uploadResult?.fileUrl ??
          data?.logoUrl ??
          data?.logo ??
          data?.fileUrl;
        if (uploadedUrl) {
          setLogoUrl(uploadedUrl);
        } else {
          const userId = getUserId();
          if (userId) {
            try {
              const detailsResponse = await api.get("/tuitionDetails", {
                params: { userId },
                timeout: 15000,
              });
              const refreshedLogo = detailsResponse.data?.data?.logo;
              if (refreshedLogo) {
                setLogoUrl(refreshedLogo);
              } else {
                setError("Logo uploaded, but the server didn't return its preview URL. Reload the page to verify it.");
              }
            } catch {
              setError("Logo uploaded, but its preview couldn't be refreshed. Reload the page to verify it.");
            }
          }
        }
        setSuccess("Tuition logo uploaded successfully.");
      } else {
        setError(data?.message || "Unable to upload your tuition logo. Please try again.");
      }
    } catch (err) {
      if (err.response?.status === 413) {
        setError("This image is too large to upload. Choose a smaller image.");
      } else if (err.response?.status === 415 || err.response?.status === 422) {
        setError("Choose a valid JPEG, PNG, or WebP image.");
      } else if (err.response?.status >= 500) {
        setError("The server is currently unavailable. Please try again in a moment.");
      } else if (err.request) {
        setError("Could not connect to the server. Please check your internet connection.");
      } else {
        setError("Something went wrong while uploading your tuition logo.");
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

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
      formData.establishedYear === "" ? null : Number(formData.establishedYear);
    if (
      establishedYear !== null &&
      (!Number.isInteger(establishedYear) ||
        establishedYear < 1900 ||
        establishedYear > new Date().getFullYear())
    ) {
      setError("Please enter a valid established year.");
      return;
    }

    const latitude = formData.latitude === "" ? null : Number(formData.latitude);
    const longitude =
      formData.longitude === "" ? null : Number(formData.longitude);
    if (
      latitude !== null &&
      (Number.isNaN(latitude) || latitude < -90 || latitude > 90)
    ) {
      setError("Latitude must be between -90 and 90.");
      return;
    }
    if (
      longitude !== null &&
      (Number.isNaN(longitude) || longitude < -180 || longitude > 180)
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
        const tuition = data.data ?? {};
        const savedData = {
          tuitionName: tuition.tuitionName ?? payload.tuitionName,
          owners: tuition.owners ?? payload.owners ?? "",
          description:
            tuition["descript]ion"] ??
            tuition.description ??
            payload.description ??
            "",
          languages: tuition.languages ?? payload.languages ?? "",
          teachingSubjects:
            tuition.teachingSubjects ?? payload.teachingSubjects ?? "",
          establishedYear:
            tuition.establishedYear ?? payload.establishedYear ?? "",
          state: tuition.state ?? payload.state ?? "",
          district: tuition.district ?? payload.district ?? "",
          city: tuition.city ?? payload.city ?? "",
          latitude: tuition.latitude ?? payload.latitude ?? "",
          longitude: tuition.longitude ?? payload.longitude ?? "",
          services: tuition.services ?? payload.services ?? "",
          eligibleClasses:
            tuition.eligibleClasses ?? payload.eligibleClasses ?? "",
          tags: tuition.tags ?? payload.tags ?? "",
        };
        setFormData(savedData);
        setSavedFormData(savedData);
        setSuccess("Tuition details updated successfully.");
        setIsEditing(false);
      } else if (data?.status === 404) {
        setError(data?.message || "User account was not found. Please login again.");
      } else if (data?.status === 422) {
        setError("Please check the information you entered.");
      } else {
        setError(data?.message || "Unable to update tuition details. Please try again.");
      }
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Your changes may not have been saved. Please check your tuition details before trying again."
        );
      } else if (err.response?.status === 422) {
        setError("Some tuition information is invalid. Please check the form.");
      } else if (err.response?.status >= 500) {
        setError("The server is currently unavailable. Please try again in a moment.");
      } else if (err.request) {
        setError("Could not connect to the server. Please check your internet connection.");
      } else {
        setError("Something went wrong while updating your tuition details.");
      }
    } finally {
      setSaving(false);
    }
  };

  const chips = (value) =>
    value.split(",").map((item) => item.trim()).filter(Boolean);

  const field = (name, label, options = {}) => (
    <div className={`flex min-w-0 flex-col gap-1.5${options.full ? " col-span-full" : ""}`}>
      {isEditing ? (
        <>
          <label className="text-xs font-semibold text-[var(--tf-copy)]" htmlFor={name}>
            {label}
            {options.required && <span className="text-[var(--tf-blue)]"> *</span>}
            {options.count && (
              <span className="float-right font-normal text-[var(--tf-muted)]">
                {formData[name].length} / {options.maxLength}
              </span>
            )}
          </label>
          {options.multiline ? (
            <textarea
              id={name}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              placeholder={options.placeholder}
              maxLength={options.maxLength}
              rows={options.rows ?? 4}
              className="tf-field min-h-[86px] resize-y"
            />
          ) : (
            <input
              id={name}
              name={name}
              type={options.type ?? "text"}
              value={formData[name]}
              onChange={handleChange}
              placeholder={options.placeholder}
              maxLength={options.maxLength}
              min={options.min}
              max={options.max}
              step={options.step}
              className="tf-field"
            />
          )}
          {options.hint && <span className="text-[11px] text-[var(--tf-muted)]">{options.hint}</span>}
          {options.chips && !!chips(formData[name]).length && (
            <div className={`${options.full ? "-mt-1.5" : "mt-2"} flex flex-wrap gap-[7px]`} aria-live="polite">
              {chips(formData[name]).map((item, index) => (
                <span className="rounded-full border border-[var(--tf-line)] bg-[var(--tf-sky)] px-[9px] py-1 text-[11px] text-[var(--tf-blue)]" key={`${item}-${index}`}>{item}</span>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <span className="text-[11px] font-semibold text-[var(--tf-muted)]">{label}</span>
          {options.chips ? (
            chips(formData[name]).length ? (
              <div className={`${options.full ? "-mt-1.5" : "mt-2"} flex flex-wrap gap-[7px]`}>
                {chips(formData[name]).map((item, index) => (
                  <span className="rounded-full border border-[var(--tf-line)] bg-[var(--tf-sky)] px-[9px] py-1 text-[11px] text-[var(--tf-blue)]" key={`${item}-${index}`}>{item}</span>
                ))}
              </div>
            ) : (
              <span className="text-[13px] font-normal text-[var(--tf-muted)]">Not provided</span>
            )
          ) : (
            <span className={`break-words text-[13px] font-medium text-[var(--tf-ink)]${options.multiline ? " whitespace-pre-line" : ""}`}>
              {String(formData[name] ?? "").trim() || (
                <span className="font-normal text-[var(--tf-muted)]">Not provided</span>
              )}
            </span>
          )}
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-[var(--tf-bg)] px-[42px] py-[34px] text-[var(--tf-ink)] [font:14px/1.5_Inter,ui-sans-serif,system-ui,-apple-system,'Segoe_UI',sans-serif] max-[1000px]:px-6 max-[1000px]:py-[26px] max-[760px]:px-4 max-[760px]:py-[22px] max-[560px]:px-[14px] max-[560px]:pb-[38px]">
        <div className="mx-auto flex min-h-[400px] w-full max-w-[1120px] flex-col items-center justify-center">
          <span className="h-[38px] w-[38px] animate-spin rounded-full border-4 border-[var(--tf-line)] border-t-[var(--tf-blue)]" aria-hidden="true" />
          <p className="mt-[14px] text-[13px]">Loading tuition details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[var(--tf-bg)] px-[42px] py-[34px] text-[var(--tf-ink)] [font:14px/1.5_Inter,ui-sans-serif,system-ui,-apple-system,'Segoe_UI',sans-serif] [&:where([data-theme=dark] *)]:bg-[var(--tf-bg)] [&:where([data-theme=dark] *)]:text-[var(--tf-ink)] max-[1000px]:px-6 max-[1000px]:py-[26px] max-[760px]:px-4 max-[760px]:py-[22px] max-[560px]:px-[14px] max-[560px]:pb-[38px]">
    <main className="mx-auto w-full max-w-[1120px]">
      <header className="mb-6 flex items-start justify-between gap-5 max-[760px]:flex-col">
          <div>
            <h1 className="tf-page-title mt-0 mb-2">Tuition details</h1>
            <p className="m-0 text-[var(--tf-copy)]">Manage the information students see about your tuition classes.</p>
          </div>
          <div className="flex items-center gap-[9px] self-start max-[560px]:flex-wrap">
            {isEditing ? (
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[var(--tf-line)] bg-[var(--tf-surface)] px-[14px] py-[9px] font-semibold text-[var(--tf-copy)] transition-colors hover:not-disabled:border-[var(--tf-blue)] hover:not-disabled:text-[var(--tf-blue)] disabled:cursor-not-allowed disabled:opacity-[.62] [&:where([data-theme=dark] *)]:bg-[var(--tf-surface)]"
                type="button"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            ) : (
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[var(--tf-line)] bg-[var(--tf-surface)] px-[14px] py-[9px] font-semibold text-[var(--tf-copy)] transition-colors hover:not-disabled:border-[var(--tf-blue)] hover:not-disabled:text-[var(--tf-blue)] disabled:cursor-not-allowed disabled:opacity-[.62] [&:where([data-theme=dark] *)]:bg-[var(--tf-surface)]"
                type="button"
                onClick={handleEdit}
              >
                Edit details
              </button>
            )}
          </div>
        </header>

        {error && <div className="mb-4 rounded-[10px] border border-[var(--tf-line)] bg-[var(--tf-danger-soft)] px-[14px] py-3 text-[13px] text-[var(--tf-danger)]" role="alert">{error}</div>}
        {success && <div className="mb-4 rounded-[10px] border border-[var(--tf-line)] bg-[var(--tf-success-soft)] px-[14px] py-3 text-[13px] text-[var(--tf-success)]" role="status">{success}</div>}

        <form className="grid grid-cols-[minmax(0,1fr)_294px] items-start gap-[18px] max-[900px]:grid-cols-1" onSubmit={handleSubmit}>
          <div className="grid gap-4">
          <section className="tf-card p-5 shadow-sm max-[560px]:p-4">
            <div className="mb-[17px] flex items-start justify-between">
              <div>
                <h2 className="tf-section-title mt-0 mb-1">About your tuition</h2>
                <p className="m-0 text-xs text-[var(--tf-muted)]">Name, ownership and a short introduction.</p>
              </div>
              {!isEditing && <button className="cursor-pointer border-0 bg-transparent p-[3px] text-xs font-semibold text-[var(--tf-blue)]" type="button" onClick={handleEdit}>Edit</button>}
            </div>
            <div className="grid grid-cols-2 gap-x-[15px] gap-y-[14px] max-[560px]:grid-cols-1">
              {field("tuitionName", "Tuition name", { required: true, maxLength: 100, placeholder: "Enter tuition name" })}
              {field("owners", "Owner or tutor name", { maxLength: 100, placeholder: "Enter owner or tutor name" })}
              {field("establishedYear", "Established year", { type: "number", min: 1800, max: 2100, placeholder: "e.g. 2018" })}
              {field("languages", "Languages taught in", { maxLength: 500, placeholder: "e.g. English, Hindi", hint: "Separate multiple languages with commas" })}
              {field("description", "About the classes", { full: true, multiline: true, maxLength: 5000, count: true, placeholder: "Tell students about your tuition classes." })}
            </div>
          </section>

          <section className="tf-card p-5 shadow-sm max-[560px]:p-4">
            <div className="mb-[17px] flex items-start justify-between">
              <div>
                <h2 className="tf-section-title mt-0 mb-1">Subjects and classes</h2>
                <p className="m-0 text-xs text-[var(--tf-muted)]">Help families find the right subject and grade.</p>
              </div>
              {!isEditing && <button className="cursor-pointer border-0 bg-transparent p-[3px] text-xs font-semibold text-[var(--tf-blue)]" type="button" onClick={handleEdit}>Edit</button>}
            </div>
            <div className="grid grid-cols-2 gap-x-[15px] gap-y-[14px] max-[560px]:grid-cols-1">
              {field("teachingSubjects", "Teaching subjects", { full: true, chips: true, maxLength: 500, placeholder: "e.g. Mathematics, Science, English" })}
              {field("eligibleClasses", "Eligible classes", { full: true, maxLength: 1000, placeholder: "e.g. Class 6-10, Class 12" })}
              {field("services", "Services and support", { full: true, multiline: true, maxLength: 2000, rows: 3, placeholder: "e.g. Practice tests, doubt-clearing, exam preparation" })}
            </div>
          </section>

          <section className="tf-card p-5 shadow-sm max-[560px]:p-4">
            <div className="mb-[17px] flex items-start justify-between">
              <div>
                <h2 className="tf-section-title mt-0 mb-1">Location</h2>
                <p className="m-0 text-xs text-[var(--tf-muted)]">Where students can attend your classes.</p>
              </div>
              {!isEditing && <button className="cursor-pointer border-0 bg-transparent p-[3px] text-xs font-semibold text-[var(--tf-blue)]" type="button" onClick={handleEdit}>Edit</button>}
            </div>
            <div className="grid grid-cols-3 gap-3 max-[560px]:grid-cols-1">
              {field("state", "State", { maxLength: 100, placeholder: "Enter state" })}
              {field("district", "District", { maxLength: 100, placeholder: "Enter district" })}
              {field("city", "City", { maxLength: 100, placeholder: "Enter city" })}
              {isEditing ? (
                <>
                  <div className="col-span-full flex items-center justify-between gap-3 rounded-lg border border-dashed border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-3 py-2.5 text-[11px] text-[var(--tf-copy)] max-[560px]:col-auto">
                    <span>Coordinates help display your location accurately.</span>
                    <button className="shrink-0 cursor-pointer border-0 bg-transparent p-0 font-semibold text-[var(--tf-blue)]" type="button" onClick={() => setCoordinatesOpen((current) => !current)}>
                      {coordinatesOpen ? "Hide coordinates" : "Set coordinates"}
                    </button>
                  </div>
                  {coordinatesOpen && (
                    <>
                      {field("latitude", "Latitude", { type: "number", min: -90, max: 90, step: "any", placeholder: "e.g. 25.4182" })}
                      {field("longitude", "Longitude", { type: "number", min: -180, max: 180, step: "any", placeholder: "e.g. 86.1274" })}
                    </>
                  )}
                </>
              ) : (
                (formData.latitude || formData.longitude) && (
                  <>
                    {field("latitude", "Latitude")}
                    {field("longitude", "Longitude")}
                  </>
                )
              )}
            </div>
          </section>

          <footer className="flex min-h-[58px] items-center justify-between gap-4 px-0.5 pt-2 text-[11px] text-[var(--tf-muted)] max-[560px]:flex-col max-[560px]:items-start">
            <span>Profile details are saved to your account</span>
            {isEditing && (
              <div className="flex items-center gap-[9px] max-[560px]:flex-wrap">
                <button className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[var(--tf-line)] bg-[var(--tf-surface)] px-[14px] py-[9px] font-semibold text-[var(--tf-copy)] transition-colors hover:not-disabled:border-[var(--tf-blue)] hover:not-disabled:text-[var(--tf-blue)] disabled:cursor-not-allowed disabled:opacity-[.62] [&:where([data-theme=dark] *)]:bg-[var(--tf-surface)]" type="button" onClick={handleCancel} disabled={saving}>Cancel</button>
                <button className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[var(--tf-blue)] bg-[var(--tf-blue)] px-[14px] py-[9px] font-semibold text-[var(--tf-on-primary)] transition-colors hover:not-disabled:border-[var(--tf-blue-pressed)] hover:not-disabled:bg-[var(--tf-blue-pressed)] disabled:cursor-not-allowed disabled:opacity-[.62]" type="submit" disabled={saving}>
                  {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-[var(--tf-on-primary)]" aria-hidden="true" />}
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            )}
          </footer>
          </div>

          <div className="sticky top-[92px] grid gap-4 max-[900px]:static">
          <section className="tf-card p-5 shadow-sm max-[560px]:p-4">
            <div className="mb-[17px] flex items-start justify-between">
              <div>
                <h2 className="tf-section-title mt-0 mb-1">Tuition logo</h2>
                <p className="m-0 text-xs text-[var(--tf-muted)]">Upload a logo to represent your tuition classes.</p>
              </div>
            </div>
            <input
              className="absolute h-px w-px overflow-hidden [clip:rect(0,0,0,0)] whitespace-nowrap [clip-path:inset(50%)] focus-visible:[&+label]:outline focus-visible:[&+label]:outline-3 focus-visible:[&+label]:outline-[var(--tf-blue)] focus-visible:[&+label]:outline-offset-2"
              id="tuitionLogoFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
            />
            <label
              className={`flex min-h-[194px] cursor-pointer flex-col items-center gap-[7px] rounded-xl border border-dashed border-[var(--tf-blue)] bg-gradient-to-br from-[var(--tf-surface-soft)] to-[var(--tf-sky)] px-4 pb-[14px] pt-[22px] text-center text-[var(--tf-copy)] transition-all hover:border-[var(--tf-blue)] hover:shadow-[0_5px_16px_rgb(24_117_209_/_8%)] ${uploadingLogo ? "cursor-progress opacity-75" : ""}`}
              htmlFor="tuitionLogoFile"
            >
              {logoUrl ? (
                <img
                  className="h-12 w-12 rounded-xl border border-[var(--tf-line)] bg-[var(--tf-surface)] object-cover"
                  src={logoUrl}
                  alt={`${formData.tuitionName || "Tuition"} logo`}
                />
              ) : (
                <span className="grid h-[46px] w-[46px] place-items-center rounded-[13px] border border-[var(--tf-line)] bg-[var(--tf-surface)] text-[var(--tf-blue)] [&:where([data-theme=dark] *)]:bg-[var(--tf-surface)]" aria-hidden="true">
                  <svg className="h-[22px] w-[22px] stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" fill="none">
                    <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v4A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-4" />
                  </svg>
                </span>
              )}
              <strong className="text-[13px] font-semibold text-[var(--tf-ink)]">{uploadingLogo ? "Uploading logo..." : logoUrl ? "Replace tuition logo" : "Upload tuition logo"}</strong>
              <span className="text-[11px] text-[var(--tf-muted)]">
                {logoUrl ? "Choose a new image for your tuition logo" : "Choose an image for your tuition logo"}
              </span>
              <span className="mt-auto self-stretch pt-3 text-left text-[11px] text-[var(--tf-muted)]">JPG, PNG or WebP · up to {MAX_LOGO_LABEL}</span>
            </label>
          </section>

          <section className="tf-card p-5 shadow-sm max-[560px]:p-4">
            <div className="mb-[17px] flex items-start justify-between">
              <div>
                <h2 className="tf-section-title mt-0 mb-1">Search tags</h2>
                <p className="m-0 text-xs text-[var(--tf-muted)]">Short keywords that help students discover you.</p>
              </div>
              {!isEditing && <button className="cursor-pointer border-0 bg-transparent p-[3px] text-xs font-semibold text-[var(--tf-blue)]" type="button" onClick={handleEdit}>Edit</button>}
            </div>
            {field("tags", "Tags", { chips: true, maxLength: 1000, placeholder: "e.g. maths, science, exam preparation", hint: "Separate tags with commas" })}
          </section>
          </div>
        </form>
      </main>
    </div>
  );
}

export default TuitionDetails;

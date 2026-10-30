import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import "./TuitionDetails.css";

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
          setLogoUrl(tuition.logo ?? "");
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
    <div className={`tuition-field${options.full ? " tuition-field--full" : ""}`}>
      {isEditing ? (
        <>
          <label htmlFor={name}>
            {label}
            {options.required && <span className="tuition-required"> *</span>}
            {options.count && (
              <span className="tuition-count">
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
            />
          )}
          {options.hint && <span className="tuition-hint">{options.hint}</span>}
          {options.chips && !!chips(formData[name]).length && (
            <div className="tuition-chips" aria-live="polite">
              {chips(formData[name]).map((item, index) => (
                <span className="tuition-chip" key={`${item}-${index}`}>{item}</span>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <span className="tuition-view-label">{label}</span>
          {options.chips ? (
            chips(formData[name]).length ? (
              <div className="tuition-chips">
                {chips(formData[name]).map((item, index) => (
                  <span className="tuition-chip" key={`${item}-${index}`}>{item}</span>
                ))}
              </div>
            ) : (
              <span className="tuition-view-value tuition-view-value--empty">Not provided</span>
            )
          ) : (
            <span className={`tuition-view-value${options.multiline ? " tuition-view-value--multiline" : ""}`}>
              {String(formData[name] ?? "").trim() || (
                <span className="tuition-view-value--empty">Not provided</span>
              )}
            </span>
          )}
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="tuition-page">
        <div className="tuition-content tuition-loading">
          <span className="tuition-spinner" aria-hidden="true" />
          <p>Loading tuition details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tuition-page">
      <main className="tuition-content">
        <header className="tuition-heading">
          <div>
            <h1>Tuition details</h1>
            <p>Manage the information students see about your tuition classes.</p>
          </div>
          <div className="tuition-heading-actions">
            {isEditing ? (
              <button
                className="tuition-button"
                type="button"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            ) : (
              <button
                className="tuition-button"
                type="button"
                onClick={handleEdit}
              >
                Edit details
              </button>
            )}
          </div>
        </header>

        {error && <div className="tuition-alert tuition-alert--error" role="alert">{error}</div>}
        {success && <div className="tuition-alert tuition-alert--success" role="status">{success}</div>}

        <form className="tuition-form-grid" onSubmit={handleSubmit}>
          <div className="tuition-main-stack">
          <section className="tuition-card">
            <div className="tuition-card-heading">
              <div>
                <h2>About your tuition</h2>
                <p>Name, ownership and a short introduction.</p>
              </div>
              {!isEditing && <button className="tuition-edit-link" type="button" onClick={handleEdit}>Edit</button>}
            </div>
            <div className="tuition-fields">
              {field("tuitionName", "Tuition name", { required: true, maxLength: 100, placeholder: "Enter tuition name" })}
              {field("owners", "Owner or tutor name", { maxLength: 100, placeholder: "Enter owner or tutor name" })}
              {field("establishedYear", "Established year", { type: "number", min: 1800, max: 2100, placeholder: "e.g. 2018" })}
              {field("languages", "Languages taught in", { maxLength: 500, placeholder: "e.g. English, Hindi", hint: "Separate multiple languages with commas" })}
              {field("description", "About the classes", { full: true, multiline: true, maxLength: 5000, count: true, placeholder: "Tell students about your tuition classes." })}
            </div>
          </section>

          <section className="tuition-card">
            <div className="tuition-card-heading">
              <div>
                <h2>Subjects and classes</h2>
                <p>Help families find the right subject and grade.</p>
              </div>
              {!isEditing && <button className="tuition-edit-link" type="button" onClick={handleEdit}>Edit</button>}
            </div>
            <div className="tuition-fields">
              {field("teachingSubjects", "Teaching subjects", { full: true, chips: true, maxLength: 500, placeholder: "e.g. Mathematics, Science, English" })}
              {field("eligibleClasses", "Eligible classes", { full: true, maxLength: 1000, placeholder: "e.g. Class 6-10, Class 12" })}
              {field("services", "Services and support", { full: true, multiline: true, maxLength: 2000, rows: 3, placeholder: "e.g. Practice tests, doubt-clearing, exam preparation" })}
            </div>
          </section>

          <section className="tuition-card">
            <div className="tuition-card-heading">
              <div>
                <h2>Location</h2>
                <p>Where students can attend your classes.</p>
              </div>
              {!isEditing && <button className="tuition-edit-link" type="button" onClick={handleEdit}>Edit</button>}
            </div>
            <div className="tuition-location-fields">
              {field("state", "State", { maxLength: 100, placeholder: "Enter state" })}
              {field("district", "District", { maxLength: 100, placeholder: "Enter district" })}
              {field("city", "City", { maxLength: 100, placeholder: "Enter city" })}
              {isEditing ? (
                <>
                  <div className="tuition-map-row">
                    <span>Coordinates help display your location accurately.</span>
                    <button type="button" onClick={() => setCoordinatesOpen((current) => !current)}>
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

          <footer className="tuition-footer">
            <span>Profile details are saved to your account</span>
            {isEditing && (
              <div className="tuition-footer-actions">
                <button className="tuition-button" type="button" onClick={handleCancel} disabled={saving}>Cancel</button>
                <button className="tuition-button tuition-button--primary" type="submit" disabled={saving}>
                  {saving && <span className="tuition-spinner tuition-spinner--small" aria-hidden="true" />}
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            )}
          </footer>
          </div>

          <div className="tuition-side-stack">
          <section className="tuition-card tuition-logo-card">
            <div className="tuition-card-heading">
              <div>
                <h2>Tuition logo</h2>
                <p>Upload a logo to represent your tuition classes.</p>
              </div>
            </div>
            <input
              className="tuition-file-input"
              id="tuitionLogoFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
            />
            <label
              className={`tuition-upload-tile${uploadingLogo ? " is-uploading" : ""}`}
              htmlFor="tuitionLogoFile"
            >
              {logoUrl ? (
                <img
                  className="tuition-logo-preview"
                  src={logoUrl}
                  alt={`${formData.tuitionName || "Tuition"} logo`}
                />
              ) : (
                <span className="tuition-upload-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v4A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-4" />
                  </svg>
                </span>
              )}
              <strong>{uploadingLogo ? "Uploading logo..." : logoUrl ? "Replace tuition logo" : "Upload tuition logo"}</strong>
              <span className="tuition-upload-prompt">
                {logoUrl ? "Choose a new image for your tuition logo" : "Choose an image for your tuition logo"}
              </span>
              <span className="tuition-upload-formats">JPG, PNG or WebP</span>
            </label>
          </section>

          <section className="tuition-card tuition-tags-card">
            <div className="tuition-card-heading">
              <div>
                <h2>Search tags</h2>
                <p>Short keywords that help students discover you.</p>
              </div>
              {!isEditing && <button className="tuition-edit-link" type="button" onClick={handleEdit}>Edit</button>}
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

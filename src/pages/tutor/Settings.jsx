import React, { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import "./Settings.css";

const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

const updateStoredUser = (updates) => {
  try {
    const user = getStoredUser();

    if (!user) return;

    localStorage.setItem(
      "user",
      JSON.stringify({
        ...user,
        ...updates,
      })
    );

    // Notify TutorLayout that username/avatar has changed.
    window.dispatchEvent(
      new Event("tutorfolio-user-updated")
    );
  } catch (error) {
    console.error("Unable to update local user:", error);
  }
};

const getErrorMessage = (err, fallback) => {
  const response = err?.response?.data;

  if (response?.message) {
    return response.message;
  }

  if (Array.isArray(response?.detail) && response.detail[0]?.msg) {
    return response.detail[0].msg;
  }

  if (err?.code === "ECONNABORTED") {
    return "The server is taking too long to respond. Please try again.";
  }

  if (err?.response?.status >= 500) {
    return "The server is currently unavailable. Please try again.";
  }

  if (err?.request) {
    return "Could not connect to the server. Please check your internet connection.";
  }

  return fallback;
};

function Settings() {
  const storedUser = getStoredUser();

  const [currentUsername, setCurrentUsername] = useState(
    storedUser?.username || ""
  );
  const [usernameDraft, setUsernameDraft] = useState(
    storedUser?.username || ""
  );

  const [usernameAvailability, setUsernameAvailability] = useState({
    status: "idle",
    message: "",
  });
  const [usernameEditing, setUsernameEditing] = useState(false);

  const availabilityRequest = useRef(0);

  const [profilePicture, setProfilePicture] = useState(
    storedUser?.profilePicture || ""
  );
  const [hasProfile, setHasProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [usernameSaving, setUsernameSaving] = useState(false);
  const [pictureSaving, setPictureSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [notice, setNotice] = useState({
    type: "",
    text: "",
  });

  const notify = (type, text) => {
    setNotice({ type, text });
  };

  const getUserId = () => {
    const user = getStoredUser();
    return user?.user_id || null;
  };

  // Load existing profile picture and latest username from backend.
  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      const id = getUserId();

      if (!id) {
        setProfileLoading(false);
        notify(
          "error",
          "Your login session could not be found. Please login again."
        );
        return;
      }

      try {
        const response = await api.get("/personalDetails", {
          params: { userId: id },
          timeout: 15000,
        });

        if (cancelled) return;

        const result = response.data;

        if (result?.status === 200 && result?.data) {
          const details = result.data;

          setHasProfile(true);
          setProfilePicture(details.profilePicture || "");

          if (details.username) {
            setCurrentUsername(details.username);
            setUsernameDraft(details.username);

            updateStoredUser({
              username: details.username,
            });
          }
        } else if (result?.status === 404) {
          setHasProfile(false);
          setProfilePicture("");
        } else {
          notify(
            "error",
            result?.message ||
              "Unable to load your current profile settings."
          );
        }
      } catch (err) {
        if (cancelled) return;

        // A missing personal-details row is allowed,
        // but the picture endpoint requires the row to exist.
        if (err.response?.status === 404) {
          setHasProfile(false);
          setProfilePicture("");
        } else {
          notify(
            "error",
            getErrorMessage(
              err,
              "Unable to load your profile settings."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  // Check username availability after the user pauses typing.
  useEffect(() => {
    const requestId = ++availabilityRequest.current;
    const candidate = usernameDraft.trim();
    let localResult = null;
    if (!candidate) {
      localResult = { status: "idle", message: "" };
    } else if (candidate === currentUsername) {
      localResult = {
        status: "same",
        message: "This is your current username.",
      };
    } else if (
      candidate.length < 3 ||
      candidate.length > 30 ||
      !USERNAME_REGEX.test(candidate)
    ) {
      localResult = {
        status: "invalid",
        message:
          "Use 3–30 characters: letters, numbers, dots, underscores or hyphens.",
      };
    }

    const timer = setTimeout(async () => {
      if (localResult) {
        setUsernameAvailability(localResult);
        return;
      }

      setUsernameAvailability({
        status: "checking",
        message: "Checking availability...",
      });

      try {
        const response = await api.get(
          "/profile/settings/username/availability",
          {
            params: { username: candidate },
            timeout: 10000,
          }
        );

        if (requestId !== availabilityRequest.current) {
          return;
        }

        const result = response.data;

        if (
          result?.status === 200 &&
          result?.data?.available === true
        ) {
          setUsernameAvailability({
            status: "available",
            message: "Username is available.",
          });
        } else if (
          result?.status === 200 &&
          result?.data?.available === false
        ) {
          setUsernameAvailability({
            status: "taken",
            message: "This username is already taken.",
          });
        } else {
          setUsernameAvailability({
            status: "error",
            message:
              result?.message ||
              "Could not verify username availability.",
          });
        }
      } catch (err) {
        if (requestId !== availabilityRequest.current) {
          return;
        }

        setUsernameAvailability({
          status: "error",
          message: getErrorMessage(
            err,
            "Could not verify username availability."
          ),
        });
      }
    }, localResult ? 0 : 450);

    return () => clearTimeout(timer);
  }, [usernameDraft, currentUsername]);

  const handleCheckUsername = async () => {
    const candidate = usernameDraft.trim();

    if (
      candidate.length < 3 ||
      candidate.length > 30 ||
      !USERNAME_REGEX.test(candidate)
    ) {
      setUsernameAvailability({
        status: "invalid",
        message:
          "Use 3–30 characters: letters, numbers, dots, underscores or hyphens.",
      });
      return;
    }

    if (candidate === currentUsername) {
      setUsernameAvailability({
        status: "same",
        message: "This is your current username.",
      });
      return;
    }

    const requestId = ++availabilityRequest.current;
    setUsernameAvailability({
      status: "checking",
      message: "Checking availability...",
    });

    try {
      const response = await api.get(
        "/profile/settings/username/availability",
        { params: { username: candidate }, timeout: 10000 }
      );
      if (requestId !== availabilityRequest.current) return;

      const result = response.data;
      if (result?.status === 200 && result?.data?.available === true) {
        setUsernameAvailability({
          status: "available",
          message: "Username is available.",
        });
      } else if (result?.status === 200 && result?.data?.available === false) {
        setUsernameAvailability({
          status: "taken",
          message: "This username is already taken.",
        });
      } else {
        setUsernameAvailability({
          status: "error",
          message: result?.message || "Could not verify username availability.",
        });
      }
    } catch (err) {
      if (requestId !== availabilityRequest.current) return;
      setUsernameAvailability({
        status: "error",
        message: getErrorMessage(err, "Could not verify username availability."),
      });
    }
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();

    const id = getUserId();
    const newUsername = usernameDraft.trim();

    if (!id) {
      notify("error", "Please login again.");
      return;
    }

    if (
      newUsername.length < 3 ||
      newUsername.length > 30 ||
      !USERNAME_REGEX.test(newUsername)
    ) {
      notify(
        "error",
        "Username must be 3–30 characters and can contain letters, numbers, dots, underscores and hyphens."
      );
      return;
    }

    if (newUsername === currentUsername) {
      notify("info", "Your username has not changed.");
      return;
    }

    if (usernameAvailability.status === "taken") {
      notify(
        "error",
        "This username is already taken. Please choose another."
      );
      return;
    }

    try {
      setUsernameSaving(true);
      setNotice({ type: "", text: "" });

      const response = await api.patch(
        "/profile/settings/username/change",
        {
          userId: id,
          newUsername,
        },
        {
          timeout: 15000,
        }
      );

      const result = response.data;

      if (result?.status === 200) {
        const savedUsername =
          result?.data?.newUsername || newUsername;

        setCurrentUsername(savedUsername);
        setUsernameDraft(savedUsername);

        updateStoredUser({
          username: savedUsername,
        });

        notify(
          "success",
          "Username updated successfully."
        );
        setUsernameEditing(false);
      } else {
        notify(
          "error",
          result?.message || "Unable to update username."
        );
      }
    } catch (err) {
      notify(
        "error",
        getErrorMessage(
          err,
          "Unable to update username."
        )
      );
    } finally {
      setUsernameSaving(false);
    }
  };

  const handlePictureSubmit = async (e) => {
    e.preventDefault();

    const id = getUserId();
    const url = profilePicture.trim();

    if (!id) {
      notify("error", "Please login again.");
      return;
    }

    if (!hasProfile) {
      notify(
        "error",
        "Please complete your Personal Details before updating your profile picture."
      );
      return;
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(url);
    } catch {
      notify(
        "error",
        "Please enter a valid profile picture URL."
      );
      return;
    }

    if (
      !["http:", "https:"].includes(parsedUrl.protocol)
    ) {
      notify(
        "error",
        "Profile picture URL must start with http:// or https://."
      );
      return;
    }

    try {
      setPictureSaving(true);
      setNotice({ type: "", text: "" });

      const response = await api.patch(
        "/profile/settings/profile-picture",
        {
          userId: id,
          profilePicture: url,
        },
        {
          timeout: 15000,
        }
      );

      const result = response.data;

      if (result?.status === 200) {
        const savedPicture =
          result?.data?.profilePicture || url;

        setProfilePicture(savedPicture);

        updateStoredUser({
          profilePicture: savedPicture,
        });

        notify(
          "success",
          "Profile picture updated successfully."
        );
      } else {
        notify(
          "error",
          result?.message ||
            "Unable to update profile picture."
        );
      }
    } catch (err) {
      notify(
        "error",
        getErrorMessage(
          err,
          "Unable to update profile picture."
        )
      );
    } finally {
      setPictureSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const id = getUserId();

    if (!id) {
      notify("error", "Please login again.");
      return;
    }

    if (!currentPassword) {
      notify("error", "Enter your current password.");
      return;
    }

    if (
      newPassword.length < 6 ||
      newPassword.length > 128 ||
      !newPassword.trim()
    ) {
      notify(
        "error",
        "New password must be 6–128 characters and cannot be blank."
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      notify(
        "error",
        "New password and confirm password do not match."
      );
      return;
    }

    if (newPassword === currentPassword) {
      notify(
        "error",
        "Your new password must be different from the current password."
      );
      return;
    }

    try {
      setPasswordSaving(true);
      setNotice({ type: "", text: "" });

      const response = await api.patch(
        "/profile/settings/password/change",
        {
          userId: id,
          currentPassword,
          newPassword,
          confirmNewPassword,
        },
        {
          timeout: 15000,
        }
      );

      const result = response.data;

      if (result?.status === 200) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");

        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);

        notify(
          "success",
          "Password changed successfully. Use your new password next time you log in."
        );
      } else {
        notify(
          "error",
          result?.message || "Unable to change password."
        );
      }
    } catch (err) {
      notify(
        "error",
        getErrorMessage(
          err,
          "Unable to change password."
        )
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const inputClass = "settings-input";
  const labelClass = "settings-label";

  const availabilityColor = {
    available: "is-ok",
    taken: "is-bad",
    invalid: "is-bad",
    error: "is-bad",
    checking: "",
    same: "",
    idle: "",
  }[usernameAvailability.status];

  const toggleButton = (visible, onClick, label) => (
    <button
      type="button"
      onClick={onClick}
      className="settings-reveal"
      aria-label={visible ? `Hide ${label}` : `Show ${label}`}
    >
      {visible ? "Hide" : "Show"}
    </button>
  );

  return (
    <div className="settings-page">
      <div className="settings-content">
        <header className="settings-heading">
          <div>
            <h1>Settings</h1>
            <p>Manage your username, profile picture and password.</p>
          </div>
        </header>

        {notice.text && (
          <div className={`settings-notice settings-notice--${notice.type || "info"}`} role="status">
            {notice.text}
          </div>
        )}

        <div className="settings-layout">
          <div className="settings-cards">
          <section className="settings-card" id="account">
            <div className="settings-card-head">
              <div>
                <span className="settings-eyebrow">Account</span>
                <h2>Username</h2>
                <p>Choose how students identify you on Tutorfolio.</p>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-main">
                <strong>Current username</strong>
                <span>{currentUsername || "Not set"}</span>
              </div>
              {!usernameEditing && (
                <button type="button" className="settings-button" onClick={() => setUsernameEditing(true)}>
                  Change username
                </button>
              )}
            </div>
            {usernameEditing && (
              <form onSubmit={handleUsernameSubmit} className="settings-username-edit">
                <div className="settings-field">
                  <label className={labelClass}>New username</label>
                  <div className="settings-input-row">
                    <input
                      type="text"
                      value={usernameDraft}
                      onChange={(e) => {
                        setUsernameDraft(e.target.value);
                        setNotice({ type: "", text: "" });
                      }}
                      autoComplete="username"
                      minLength={3}
                      maxLength={30}
                      placeholder="Enter a new username"
                      className={inputClass}
                      required
                    />
                    <button
                      type="button"
                      className="settings-button"
                      onClick={handleCheckUsername}
                      disabled={usernameAvailability.status === "checking"}
                    >
                      Check availability
                    </button>
                  </div>
                  <span className="settings-hint">Use 3 to 30 letters, numbers, dots, underscores, or hyphens.</span>
                  <span className={`settings-status ${availabilityColor}`} aria-live="polite">{usernameAvailability.message}</span>
                </div>
                <div className="settings-card-actions">
                  <button
                    type="button"
                    className="settings-button"
                    onClick={() => {
                      setUsernameEditing(false);
                      setUsernameDraft(currentUsername);
                      setNotice({ type: "", text: "" });
                    }}
                    disabled={usernameSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="settings-button settings-button--primary"
                    disabled={usernameSaving || usernameDraft.trim() === currentUsername || usernameAvailability.status === "taken" || usernameAvailability.status === "invalid"}
                  >
                    {usernameSaving ? "Updating…" : "Save username"}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="settings-card" id="profile-picture">
            <div className="settings-card-head">
              <div>
                <span className="settings-eyebrow">Profile</span>
                <h2>Profile picture</h2>
                <p>Update your profile picture using an image URL.</p>
              </div>
            </div>

            {profileLoading ? (
              <p className="settings-hint">Loading profile picture…</p>
            ) : (
              <>
                {profilePicture && (
                  <div className="settings-picture-row">
                    <img
                      src={profilePicture}
                      alt="Current profile"
                      className="settings-avatar"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />

                    <div className="settings-picture-copy">
                      <strong>Current profile picture</strong>
                      <span>Preview of your saved image URL.</span>
                    </div>
                  </div>
                )}

                {!hasProfile && (
                  <p className="settings-warning">
                    Complete your Personal Details first. The backend requires an existing profile row before it can update the picture.
                  </p>
                )}

                <form
                  onSubmit={handlePictureSubmit}
                  className="settings-picture-form"
                >
                  <div>
                    <label className={labelClass}>
                      Profile Picture URL
                    </label>

                    <input
                      type="url"
                      value={profilePicture}
                      onChange={(e) => {
                        setProfilePicture(e.target.value);
                        setNotice({ type: "", text: "" });
                      }}
                      placeholder="https://example.com/profile.jpg"
                      className={inputClass}
                      disabled={!hasProfile}
                      required
                    />
                  </div>

                  <div className="settings-card-actions">
                    <button
                      type="submit"
                      disabled={
                        pictureSaving ||
                        profileLoading ||
                        !hasProfile
                      }
                      className="settings-button settings-button--primary"
                    >
                      {pictureSaving ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Picture"
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>

          {/* Password */}
          <section className="settings-card" id="security">
            <div className="settings-card-head">
              <div>
                <span className="settings-eyebrow">Security</span>
                <h2>Change password</h2>
                <p>Use a strong password that you do not use elsewhere.</p>
              </div>
            </div>

            <form
              onSubmit={handlePasswordSubmit}
              className="settings-password-form"
            >
              <div className="settings-field settings-field--current">
                <label className={labelClass}>
                  Current password
                </label>

                <div className="settings-password-wrap">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setNotice({ type: "", text: "" });
                    }}
                    autoComplete="current-password"
                    className={inputClass}
                    placeholder="Enter current password"
                    required
                  />

                  {toggleButton(
                    showCurrentPassword,
                    () =>
                      setShowCurrentPassword((prev) => !prev),
                    "current password"
                  )}
                </div>
              </div>

              {/* New password */}
              <div className="settings-field">
                <label className={labelClass}>
                  New password
                </label>

                <div className="settings-password-wrap">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setNotice({ type: "", text: "" });
                    }}
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={128}
                    className={inputClass}
                    placeholder="Enter new password"
                    required
                  />

                  {toggleButton(
                    showNewPassword,
                    () => setShowNewPassword((prev) => !prev),
                    "new password"
                  )}
                </div>

                <p className="settings-hint">
                  Use between 6 and 128 characters.
                </p>
              </div>

              {/* Confirm new password */}
              <div className="settings-field">
                <label className={labelClass}>
                  Confirm new password
                </label>

                <div className="settings-password-wrap">
                  <input
                    type={
                      showConfirmPassword ? "text" : "password"
                    }
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      setNotice({ type: "", text: "" });
                    }}
                    autoComplete="new-password"
                    className={inputClass}
                    placeholder="Re-enter new password"
                    required
                  />

                  {toggleButton(
                    showConfirmPassword,
                    () =>
                      setShowConfirmPassword((prev) => !prev),
                    "confirm password"
                  )}
                </div>

                {confirmNewPassword &&
                  confirmNewPassword !== newPassword && (
                    <p className="settings-inline-error">
                      Passwords do not match.
                    </p>
                  )}
              </div>

              <div className="settings-security-tip">
                  <span aria-hidden="true">✓</span>
                  <span>Passwords must be 6 to 128 characters. Your new password and confirmation must match.</span>
              </div>

              <div className="settings-card-actions">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="settings-button settings-button--primary"
                >
                  {passwordSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </div>
            </form>
          </section>

          <p className="settings-bottom-note">Account and security changes are saved to your Tutorfolio account.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
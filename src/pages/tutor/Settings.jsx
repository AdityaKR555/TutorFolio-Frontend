import React, { useEffect, useRef, useState } from "react";
import api from "../../api/axios";

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
  const userId = storedUser?.user_id;

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

    if (!candidate) {
      setUsernameAvailability({
        status: "idle",
        message: "",
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

    const timer = setTimeout(async () => {
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
    }, 450);

    return () => clearTimeout(timer);
  }, [usernameDraft, currentUsername]);

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

  const inputClass =
    "w-full bg-[#0a1628] border border-blue-500/10 rounded-xl px-4 py-3 text-white placeholder-[#617391] outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all";

  const labelClass =
    "block text-sm text-[#c7d8f5] mb-2";

  const availabilityColor = {
    available: "text-green-400",
    taken: "text-red-400",
    invalid: "text-red-400",
    error: "text-yellow-400",
    checking: "text-[#94a8c7]",
    same: "text-[#94a8c7]",
    idle: "text-[#94a8c7]",
  }[usernameAvailability.status];

  const toggleButton = (visible, onClick, label) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94a8c7] hover:text-white"
      aria-label={visible ? `Hide ${label}` : `Show ${label}`}
    >
      {visible ? "Hide" : "Show"}
    </button>
  );

  return (
    <div className="p-5 sm:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Page heading */}
        <div className="mb-8">
          <p className="text-[#94a8c7] text-sm mb-2">
            Account
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Profile Settings
          </h1>

          <p className="text-[#94a8c7] mt-2 text-sm sm:text-base">
            Manage your username, profile picture and password.
          </p>
        </div>

        {/* Global feedback */}
        {notice.text && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 ${
              notice.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-300"
                : notice.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-300"
                : "bg-blue-500/10 border-blue-500/20 text-blue-300"
            }`}
            role="status"
          >
            <p className="text-sm">{notice.text}</p>
          </div>
        )}

        <div className="space-y-6">

          {/* Username */}
          <section className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Change Username
              </h2>

              <p className="text-[#6f84a5] text-sm mt-1">
                Your username identifies your TutorFolio account.
              </p>
            </div>

            <form
              onSubmit={handleUsernameSubmit}
              className="space-y-4"
            >
              <div>
                <label className={labelClass}>
                  Username
                </label>

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

                <p
                  className={`text-xs mt-2 ${availabilityColor}`}
                  aria-live="polite"
                >
                  {usernameAvailability.message}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    usernameSaving ||
                    usernameDraft.trim() === currentUsername ||
                    usernameAvailability.status === "taken" ||
                    usernameAvailability.status === "invalid"
                  }
                  className="w-full sm:w-auto min-w-[160px] bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {usernameSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Username"
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Profile picture */}
          <section className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Profile Picture
              </h2>

              <p className="text-[#6f84a5] text-sm mt-1">
                Update your profile picture using an image URL.
              </p>
            </div>

            {profileLoading ? (
              <p className="text-[#94a8c7] text-sm">
                Loading profile picture...
              </p>
            ) : (
              <>
                {profilePicture && (
                  <div className="mb-5 flex items-center gap-4">
                    <img
                      src={profilePicture}
                      alt="Current profile"
                      className="w-16 h-16 rounded-full object-cover border border-blue-500/20 bg-[#0a1628]"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />

                    <div>
                      <p className="text-white text-sm font-medium">
                        Current profile picture
                      </p>

                      <p className="text-[#6f84a5] text-xs mt-1">
                        Preview of your saved image URL.
                      </p>
                    </div>
                  </div>
                )}

                {!hasProfile && (
                  <p className="text-yellow-300 text-sm mb-4">
                    Complete your Personal Details first. The backend requires an existing profile row before it can update the picture.
                  </p>
                )}

                <form
                  onSubmit={handlePictureSubmit}
                  className="space-y-4"
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

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={
                        pictureSaving ||
                        profileLoading ||
                        !hasProfile
                      }
                      className="w-full sm:w-auto min-w-[160px] bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
          <section className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Change Password
              </h2>

              <p className="text-[#6f84a5] text-sm mt-1">
                Enter your current password before setting a new one.
              </p>
            </div>

            <form
              onSubmit={handlePasswordSubmit}
              className="space-y-5"
            >
              {/* Current password */}
              <div>
                <label className={labelClass}>
                  Current Password
                </label>

                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setNotice({ type: "", text: "" });
                    }}
                    autoComplete="current-password"
                    className={`${inputClass} pr-16`}
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
              <div>
                <label className={labelClass}>
                  New Password
                </label>

                <div className="relative">
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
                    className={`${inputClass} pr-16`}
                    placeholder="Enter new password"
                    required
                  />

                  {toggleButton(
                    showNewPassword,
                    () => setShowNewPassword((prev) => !prev),
                    "new password"
                  )}
                </div>

                <p className="text-[#617391] text-xs mt-2">
                  Use between 6 and 128 characters.
                </p>
              </div>

              {/* Confirm new password */}
              <div>
                <label className={labelClass}>
                  Confirm New Password
                </label>

                <div className="relative">
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
                    className={`${inputClass} pr-16`}
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
                    <p className="text-red-400 text-xs mt-2">
                      Passwords do not match.
                    </p>
                  )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full sm:w-auto min-w-[160px] bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
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

        </div>

        <div className="pb-6" />
      </div>
    </div>
  );
}

export default Settings;
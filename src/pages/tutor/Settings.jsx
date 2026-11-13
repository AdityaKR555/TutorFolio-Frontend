import React, { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import SystemThemeSettings from "../../components/SystemThemeSettings";
import { setAuthSession } from "../../utils/auth";

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
  const [currentEmail, setCurrentEmail] = useState(storedUser?.email || "");
  const [emailDraft, setEmailDraft] = useState("");
  const [emailEditing, setEmailEditing] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailLoading, setEmailLoading] = useState(true);
  const [resendAt, setResendAt] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);

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
    return user?.userId || user?.user_id || user?.id || null;
  };

  useEffect(() => {
    if (!resendAt) return;
    const tick = () => setResendSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [resendAt]);

  useEffect(() => {
    let cancelled = false;
    api.get("/profile/settings/account", { timeout: 15000 }).then(({ data: result }) => {
      if (cancelled) return;
      if (result.status !== 200 || !result.data) throw new Error("Unable to load account settings");
      setCurrentEmail(result.data.email);
      setCurrentUsername(result.data.username);
      setUsernameDraft(result.data.username);
      updateStoredUser({ email: result.data.email, username: result.data.username });
    }).catch((error) => {
      if (!cancelled) setNotice({ type: "error", text: getErrorMessage(error, "Unable to load account settings. Please reload to try again.") });
    }).finally(() => {
      if (!cancelled) setEmailLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Load the independently editable public profile picture.
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
          setProfilePicture(
            details.profilePicture ||
              details.profile_picture ||
              details.profilepicture ||
              ""
          );
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

  const handleEmailRequest = async (event) => {
    event.preventDefault();
    const newEmail = emailDraft.trim().toLowerCase();
    if (newEmail === currentEmail.trim().toLowerCase()) {
      notify("info", "Your email has not changed.");
      return;
    }
    setEmailSaving(true);
    setNotice({ type: "", text: "" });
    try {
      const { data: result } = await api.post("/profile/settings/email/change/request", { newEmail }, { timeout: 30000 });
      if (result.status !== 200 || !result.data?.newEmail) {
        notify("error", result.message || "Unable to send verification code.");
        return;
      }
      setPendingEmail(result.data.newEmail);
      setEmailCode("");
      setResendAt(Date.now() + result.data.resendAfterSeconds * 1000);
      notify("success", result.message);
    } catch (error) {
      notify("error", getErrorMessage(error, "Unable to send verification code."));
    } finally {
      setEmailSaving(false);
    }
  };

  const handleEmailConfirm = async (event) => {
    event.preventDefault();
    setEmailSaving(true);
    setNotice({ type: "", text: "" });
    try {
      const { data: result } = await api.patch("/profile/settings/email/change", {
        newEmail: pendingEmail, otp: emailCode,
      }, { timeout: 15000 });
      if (result.status !== 200 || !result.data?.email || !result.data?.accessToken) {
        notify("error", result.message || "Unable to change email.");
        return;
      }
      // Keep user data and the separately stored Bearer token in sync.
      setAuthSession({ ...getStoredUser(), ...result.data });
      setCurrentEmail(result.data.email);
      setPendingEmail("");
      setEmailCode("");
      setEmailDraft("");
      setEmailEditing(false);
      notify("success", "Email changed successfully. Use your new email next time you log in.");
    } catch (error) {
      notify("error", getErrorMessage(error, "Unable to change email."));
    } finally {
      setEmailSaving(false);
    }
  };

  const inputClass = "tf-field disabled:cursor-not-allowed disabled:bg-tf-surface-soft disabled:text-tf-muted";
  const labelClass = "tf-label my-0";
  const secondaryButtonClass = "inline-flex min-h-[34px] items-center justify-center rounded-lg border border-[var(--tf-line)] bg-[var(--tf-surface)] px-3 py-2 text-[11px] font-semibold text-[var(--tf-copy)] hover:bg-[var(--tf-surface-soft)] disabled:cursor-not-allowed disabled:opacity-55";
  const primaryButtonClass = "inline-flex min-h-[34px] items-center justify-center rounded-lg border border-[var(--tf-blue)] bg-[var(--tf-blue)] px-3 py-2 text-[11px] font-semibold text-[var(--tf-on-primary)] hover:bg-[var(--tf-blue-pressed)] disabled:cursor-not-allowed disabled:opacity-55";

  const availabilityColor = {
    available: "text-[var(--tf-success)]",
    taken: "text-[var(--tf-danger)]",
    invalid: "text-[var(--tf-danger)]",
    error: "text-[var(--tf-danger)]",
    checking: "",
    same: "",
    idle: "",
  }[usernameAvailability.status];

  const toggleButton = (visible, onClick, label) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-[7px] top-1/2 grid min-h-[30px] min-w-[42px] -translate-y-1/2 cursor-pointer place-items-center border-0 bg-transparent p-1 text-[10px] text-[var(--tf-muted)] hover:text-[var(--tf-blue)]"
      aria-label={visible ? `Hide ${label}` : `Show ${label}`}
    >
      {visible ? "Hide" : "Show"}
    </button>
  );

  return (
    <div className="mobile-page mobile-settings min-h-full bg-[var(--tf-bg)] px-8 pt-[34px] pb-14 text-[var(--tf-ink)] [font:14px/1.5_Inter,ui-sans-serif,system-ui,-apple-system,'Segoe_UI',sans-serif] max-[800px]:px-[18px] max-[800px]:pt-6 max-[800px]:pb-10 max-[560px]:px-[14px] max-[560px]:pt-5 max-[560px]:pb-8 [&:where([data-theme=dark] *)]:bg-[var(--tf-bg)] [&:where([data-theme=dark] *)]:text-[var(--tf-ink)]">
      <div className="mx-auto max-w-[1080px]">
        <header className="mobile-heading mb-6 flex items-start justify-between gap-[18px]">
          <div>
            <h1 className="tf-page-title mt-0 mb-2">Settings</h1>
            <p className="m-0 text-[13px] text-[var(--tf-copy)]">Manage your appearance, username, email, profile picture and password.</p>
          </div>
        </header>

        {notice.text && (
          <div className={`mb-4 rounded-lg border border-[var(--tf-line)] px-3 py-2.5 text-[11px] ${notice.type === "success" ? "bg-[var(--tf-success-soft)] text-[var(--tf-success)]" : notice.type === "error" ? "bg-[var(--tf-danger-soft)] text-[var(--tf-danger)]" : "bg-[var(--tf-sky)] text-[var(--tf-blue)]"}`} role="status">
            {notice.text}
          </div>
        )}

        <div className="grid grid-cols-1">
          <div className="grid gap-[15px]">
          <SystemThemeSettings />

          <section className="tf-card min-w-0 p-5 shadow-sm max-[560px]:p-4" id="account">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <span className="mb-[3px] block text-[10px] font-bold uppercase tracking-[.08em] text-[var(--tf-muted)]">Account</span>
                <h2 className="tf-section-title mt-0 mb-1">Username</h2>
                <p className="m-0 text-[11px] text-[var(--tf-muted)]">Choose how students identify you on Tutorfolio.</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 border-t border-[var(--tf-line)] py-3 max-[560px]:items-start max-[560px]:flex-wrap">
              <div className="min-w-0 flex-1 max-[560px]:min-w-[calc(100%_-_74px)] [&_strong]:mb-0.5 [&_strong]:block [&_strong]:text-xs [&_strong]:text-[var(--tf-ink)] [&_span]:block [&_span]:break-words [&_span]:text-[11px] [&_span]:text-[var(--tf-muted)]">
                <strong>Current username</strong>
                <span>{currentUsername || "Not set"}</span>
              </div>
              {!usernameEditing && (
                <button type="button" className="inline-flex min-h-[34px] items-center justify-center gap-[7px] whitespace-nowrap rounded-lg border border-[var(--tf-line)] bg-[var(--tf-surface)] px-3 py-2 text-[11px] font-semibold text-[var(--tf-copy)] transition-colors hover:bg-[var(--tf-surface-soft)] hover:text-[var(--tf-blue-pressed)] disabled:cursor-not-allowed disabled:opacity-[.55] [&:where([data-theme=dark] *)]:bg-[var(--tf-surface)]" onClick={() => setUsernameEditing(true)}>
                  Change username
                </button>
              )}
            </div>
            {usernameEditing && (
              <form onSubmit={handleUsernameSubmit} className="mt-3 grid gap-[13px] border-t border-[var(--tf-line)] pt-[13px]">
                <div className="grid min-w-0 gap-1.5">
                  <label className={labelClass}>New username</label>
                  <div className="flex items-center gap-[9px] max-[560px]:items-stretch max-[560px]:flex-col">
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
                      className="inline-flex min-h-[34px] items-center justify-center gap-[7px] whitespace-nowrap rounded-lg border border-[var(--tf-line)] bg-[var(--tf-surface)] px-3 py-2 text-[11px] font-semibold text-[var(--tf-copy)] transition-colors hover:bg-[var(--tf-surface-soft)] hover:text-[var(--tf-blue-pressed)] disabled:cursor-not-allowed disabled:opacity-[.55] [&:where([data-theme=dark] *)]:bg-[var(--tf-surface)]"
                      onClick={handleCheckUsername}
                      disabled={usernameAvailability.status === "checking"}
                    >
                      Check availability
                    </button>
                  </div>
                  <span className="text-[10px] text-[var(--tf-muted)]">Use 3 to 30 letters, numbers, dots, underscores, or hyphens.</span>
                  <span className={`min-h-[14px] text-[10px] text-[var(--tf-muted)] ${availabilityColor}`} aria-live="polite">{usernameAvailability.message}</span>
                </div>
                <div className="mt-[14px] flex justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-[34px] items-center justify-center gap-[7px] whitespace-nowrap rounded-lg border border-[var(--tf-line)] bg-[var(--tf-surface)] px-3 py-2 text-[11px] font-semibold text-[var(--tf-copy)] transition-colors hover:bg-[var(--tf-surface-soft)] hover:text-[var(--tf-blue-pressed)] disabled:cursor-not-allowed disabled:opacity-[.55] [&:where([data-theme=dark] *)]:bg-[var(--tf-surface)]"
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
                    className="inline-flex min-h-[34px] items-center justify-center gap-[7px] whitespace-nowrap rounded-lg border border-[var(--tf-blue)] bg-[var(--tf-blue)] px-3 py-2 text-[11px] font-semibold text-[var(--tf-on-primary)] transition-colors hover:border-[var(--tf-blue-pressed)] hover:bg-[var(--tf-blue-pressed)] disabled:cursor-not-allowed disabled:opacity-[.55]"
                    disabled={usernameSaving || usernameDraft.trim() === currentUsername || usernameAvailability.status === "taken" || usernameAvailability.status === "invalid"}
                  >
                    {usernameSaving ? "Updating…" : "Save username"}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="tf-card min-w-0 p-5 shadow-sm max-[560px]:p-4" id="email">
            <h2 className="tf-section-title mt-0 mb-1">Email address</h2>
            <p className="mb-4 text-[11px] text-[var(--tf-muted)]">Your login email. Verify your new address before saving. Your public contact email is managed in Personal Details.</p>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <strong className="block text-xs">Current email</strong>
                <span className="break-all text-[11px] text-[var(--tf-muted)]">{emailLoading ? "Loading…" : currentEmail || "Not set"}</span>
              </div>
              {!emailEditing && <button type="button" className={secondaryButtonClass} disabled={emailLoading} onClick={() => { setEmailEditing(true); setEmailDraft(""); setNotice({ type: "", text: "" }); }}>Change email</button>}
            </div>
            {emailEditing && (
              <div className="mt-4 grid gap-3 border-t border-[var(--tf-line)] pt-4">
                <form onSubmit={handleEmailRequest} className="grid gap-3">
                  <label htmlFor="new-email" className={labelClass}>New email address</label>
                  <input id="new-email" type="email" autoComplete="email" maxLength={254} required className={inputClass}
                    value={emailDraft} disabled={emailSaving}
                    onChange={(event) => { setEmailDraft(event.target.value); setPendingEmail(""); setEmailCode(""); setNotice({ type: "", text: "" }); }}
                    placeholder="Enter a new email address" />
                  <button type="submit" className={secondaryButtonClass} disabled={emailSaving || resendSeconds > 0 || !emailDraft.trim() || emailDraft.trim().toLowerCase() === currentEmail.trim().toLowerCase()}>
                    {emailSaving ? "Please wait…" : resendSeconds > 0 ? `Resend available in ${resendSeconds}s` : pendingEmail ? "Resend code" : "Send verification code"}
                  </button>
                </form>
                {pendingEmail && (
                  <form onSubmit={handleEmailConfirm} className="grid gap-3">
                    <p className="m-0 break-words text-[11px] text-[var(--tf-muted)]">Enter the code sent to {pendingEmail}. It expires in 10 minutes.</p>
                    <label htmlFor="email-code" className={labelClass}>Verification code</label>
                    <input id="email-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required
                      value={emailCode} onChange={(event) => setEmailCode(event.target.value.replace(/[^0-9]/g, ""))} disabled={emailSaving} className={inputClass} placeholder="6-digit code" />
                    <button type="submit" className={primaryButtonClass} disabled={emailSaving || emailCode.length !== 6}>{emailSaving ? "Updating…" : "Verify and save email"}</button>
                  </form>
                )}
                <button type="button" className={secondaryButtonClass} disabled={emailSaving} onClick={() => { setEmailEditing(false); setPendingEmail(""); setEmailCode(""); setEmailDraft(""); setNotice({ type: "", text: "" }); }}>Cancel</button>
              </div>
            )}
          </section>

          <section className="tf-card min-w-0 p-5 shadow-sm max-[560px]:p-4" id="profile-picture">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <span className="mb-[3px] block text-[10px] font-bold uppercase tracking-[.08em] text-[var(--tf-muted)]">Profile</span>
                <h2 className="tf-section-title mt-0 mb-1">Profile picture</h2>
                <p className="m-0 text-[11px] text-[var(--tf-muted)]">Update your profile picture using an image URL.</p>
              </div>
            </div>

            {profileLoading ? (
              <p className="text-[10px] text-[var(--tf-muted)]">Loading profile picture…</p>
            ) : (
              <>
                {profilePicture && (
                  <div className="flex items-center gap-[13px]">
                    <img
                      src={profilePicture}
                      alt="Current profile"
                      className="grid h-[58px] w-[58px] shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white bg-[var(--tf-sky)] text-lg font-bold text-[var(--tf-blue-pressed)] shadow-[0_0_0_1px_#e1eaf4] [&:where([data-theme=dark] *)]:border-[var(--tf-line)] [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />

                    <div className="grid gap-[3px] [&_strong]:text-xs [&_strong]:text-[var(--tf-ink)] [&_span]:text-[10px] [&_span]:text-[var(--tf-muted)]">
                      <strong>Current profile picture</strong>
                      <span>Preview of your saved image URL.</span>
                    </div>
                  </div>
                )}

                {!hasProfile && (
                  <p className="mb-3 rounded-lg border border-[#f1dfbf] bg-[var(--tf-warning-soft)] px-3 py-2.5 text-[11px] text-[var(--tf-warning)] [&:where([data-theme=dark] *)]:border-[var(--tf-line)]">
                    Complete your Personal Details first. The backend requires an existing profile row before it can update the picture.
                  </p>
                )}

                <form
                  onSubmit={handlePictureSubmit}
                  className="grid gap-[14px]"
                >
                  <div className="grid min-w-0 gap-1.5">
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

                  <div className="mt-[14px] flex justify-end gap-2">
                    <button
                      type="submit"
                      disabled={
                        pictureSaving ||
                        profileLoading ||
                        !hasProfile
                      }
                      className="inline-flex min-h-[34px] items-center justify-center gap-[7px] whitespace-nowrap rounded-lg border border-[var(--tf-blue)] bg-[var(--tf-blue)] px-3 py-2 text-[11px] font-semibold text-[var(--tf-on-primary)] transition-colors hover:border-[var(--tf-blue-pressed)] hover:bg-[var(--tf-blue-pressed)] disabled:cursor-not-allowed disabled:opacity-[.55]"
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
          <section className="tf-card min-w-0 p-5 shadow-sm max-[560px]:p-4" id="security">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <span className="mb-[3px] block text-[10px] font-bold uppercase tracking-[.08em] text-[var(--tf-muted)]">Security</span>
                <h2 className="tf-section-title mt-0 mb-1">Change password</h2>
                <p className="m-0 text-[11px] text-[var(--tf-muted)]">Use a strong password that you do not use elsewhere.</p>
              </div>
            </div>

            <form
              onSubmit={handlePasswordSubmit}
              className="grid grid-cols-2 gap-x-[14px] gap-y-[13px] max-[560px]:grid-cols-1"
            >
              <div className="col-span-full grid min-w-0 gap-1.5 max-[560px]:col-auto">
                <label className={labelClass}>
                  Current password
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
                    className={`${inputClass} pr-[58px]`}
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
              <div className="grid min-w-0 gap-1.5">
                <label className={labelClass}>
                  New password
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
                    className={`${inputClass} pr-[58px]`}
                    placeholder="Enter new password"
                    required
                  />

                  {toggleButton(
                    showNewPassword,
                    () => setShowNewPassword((prev) => !prev),
                    "new password"
                  )}
                </div>

                <p className="text-[10px] text-[var(--tf-muted)]">
                  Use between 6 and 128 characters.
                </p>
              </div>

              {/* Confirm new password */}
              <div className="grid min-w-0 gap-1.5">
                <label className={labelClass}>
                  Confirm new password
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
                    className={`${inputClass} pr-[58px]`}
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
                    <p className="m-0 text-[10px] text-[var(--tf-danger)]">
                      Passwords do not match.
                    </p>
                  )}
              </div>

              <div className="col-span-full mt-px flex items-start gap-[9px] rounded-lg border border-[var(--tf-line)] bg-[var(--tf-surface-soft)] px-3 py-2.5 text-[10px] text-[var(--tf-copy)] max-[560px]:col-auto [&:where([data-theme=dark] *)]:bg-[var(--tf-surface-soft)]">
                  <span className="font-bold text-[var(--tf-blue)]" aria-hidden="true">✓</span>
                  <span>Passwords must be 6 to 128 characters. Your new password and confirmation must match.</span>
              </div>

              <div className="col-span-full mt-[14px] flex justify-end gap-2 max-[560px]:col-auto">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="inline-flex min-h-[34px] items-center justify-center gap-[7px] whitespace-nowrap rounded-lg border border-[var(--tf-blue)] bg-[var(--tf-blue)] px-3 py-2 text-[11px] font-semibold text-[var(--tf-on-primary)] transition-colors hover:border-[var(--tf-blue-pressed)] hover:bg-[var(--tf-blue-pressed)] disabled:cursor-not-allowed disabled:opacity-[.55]"
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

          <p className="m-0 text-right text-[10px] text-[var(--tf-muted)]">Account and security changes are saved to your Tutorfolio account.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { setAuthSession } from "../utils/auth";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    account_type: "Tutor",
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      const role = (formData.account_type || "Tutor").toLowerCase();

      const response = await api.get("/auth/google", {
        params: { account_type: role },
      });

      if (response.data?.status === 200 && response.data?.data?.authUrl) {
        window.location.href = response.data.data.authUrl;
      } else {
        const rawBase =
          api.defaults.baseURL || import.meta.env.VITE_API_BASE_URL || "";
        const base = rawBase.replace(/\/+$/, "");
        window.location.href = `${base}/auth/google/redirect?account_type=${role}`;
      }
    } catch (error) {
      console.error("Google signup redirect error:", error);
      const rawBase =
        api.defaults.baseURL || import.meta.env.VITE_API_BASE_URL || "";
      const base = rawBase.replace(/\/+$/, "");
      const role = (formData.account_type || "Tutor").toLowerCase();
      window.location.href = `${base}/auth/google/redirect?account_type=${role}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      formData.username.trim() === "" ||
      formData.email.trim() === "" ||
      formData.password.trim() === ""
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/register", {
        accountType: formData.account_type.toLowerCase(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      const data = response.data;

      if (data.status === 200 || data.status === 201) {
        if (data.data?.accessToken) {
          setAuthSession(data.data);
          const role = (
            data.data.accountType ||
            formData.account_type
          ).toLowerCase();

          if (role === "student") {
            navigate("/student");
          } else {
            navigate("/dashboard");
          }
        } else {
          alert("Account created successfully. Please login.");
          navigate("/login");
        }
      } else {
        alert(data.message || "Unable to create account.");
      }
    } catch (error) {
      console.error("Registration error:", error);

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 422) {
          if (Array.isArray(data.detail)) {
            const messages = data.detail
              .map((item) => item.msg)
              .join("\n");

            alert(messages || "Please enter valid information.");
          } else {
            alert("Please enter valid information.");
          }
        } else {
          alert(data.message || "Something went wrong.");
        }
      } else if (error.request) {
        alert(
          "Unable to connect to the server. Please check your internet connection and try again."
        );
      } else {
        alert("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] px-5 sm:px-8 flex items-center justify-center">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-10 items-center">
        {/* Left Side */}
        <div className="hidden lg:block">
          <Link
            to="/"
            className="inline-flex items-center text-[#94a8c7] hover:text-white transition-colors mb-8"
          >
            ← Back to Home
          </Link>

          <img src="/tf-logo.png" alt="TutorFolio" className="w-56" />

          <h1 className="text-5xl font-bold text-white mt-8 leading-tight">
            Join TutorFolio.
          </h1>

          <p className="text-[#94a8c7] text-lg mt-5 max-w-md leading-relaxed">
            Create your professional teaching portfolio and start building your
            online presence.
          </p>

          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-3 text-[#c7d8f5]">
              <span className="text-blue-400">✓</span>
              Create Your Tutor Portfolio
            </div>

            <div className="flex items-center gap-3 text-[#c7d8f5]">
              <span className="text-blue-400">✓</span>
              Get Discovered By Students
            </div>

            <div className="flex items-center gap-3 text-[#c7d8f5]">
              <span className="text-blue-400">✓</span>
              Connect Directly
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="w-full">
          <Link
            to="/"
            className="lg:hidden inline-flex items-center text-[#94a8c7] hover:text-white transition-colors mb-6"
          >
            ← Back to Home
          </Link>

          <div className="bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-6 sm:p-8">
            <h2 className="text-white text-3xl font-bold">Create Account</h2>

            <p className="text-[#94a8c7] mt-2">
              Start your TutorFolio journey.
            </p>

            {/* Account Type Selector */}
            <div className="mt-6">
              <label className="block text-[#c7d8f5] mb-3 text-sm">
                Account Type
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      account_type: "Student",
                    }))
                  }
                  className={`py-3 rounded-xl border transition-all cursor-pointer ${
                    formData.account_type === "Student"
                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "bg-[#0a1628] border-blue-500/10 text-[#94a8c7] hover:text-white"
                  }`}
                >
                  Student
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      account_type: "Tutor",
                    }))
                  }
                  className={`py-3 rounded-xl border transition-all cursor-pointer ${
                    formData.account_type === "Tutor"
                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "bg-[#0a1628] border-blue-500/10 text-[#94a8c7] hover:text-white"
                  }`}
                >
                  Tutor
                </button>
              </div>
            </div>

            {/* Google Signup Button */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={googleLoading || loading}
              className="w-full mt-6 flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-[#0a1628] font-medium py-3 rounded-xl transition-all shadow-sm disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.15C3.25 21.37 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.24A7.18 7.18 0 0 1 4.9 12c0-.78.13-1.54.37-2.24V6.61H1.26A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.26 5.39l4.01-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.63 1.26 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span>
                {googleLoading
                  ? "Connecting to Google..."
                  : `Sign up as ${formData.account_type} with Google`}
              </span>
            </button>

            <div className="relative my-6 flex items-center justify-center">
              <div className="border-t border-blue-500/10 w-full"></div>
              <span className="bg-[#0f1f36] px-3 text-xs uppercase tracking-wider text-[#6b7f9f]">
                or register with email
              </span>
              <div className="border-t border-blue-500/10 w-full"></div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-[#c7d8f5] mb-2 text-sm">
                  Username
                </label>

                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  className="w-full bg-[#0a1628] border border-blue-500/10 rounded-xl px-4 py-3 text-white placeholder:text-[#6b7f9f] focus:border-blue-500/40 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#c7d8f5] mb-2 text-sm">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full bg-[#0a1628] border border-blue-500/10 rounded-xl px-4 py-3 text-white placeholder:text-[#6b7f9f] focus:border-blue-500/40 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#c7d8f5] mb-2 text-sm">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    className="w-full bg-[#0a1628] border border-blue-500/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-[#6b7f9f] focus:border-blue-500/40 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a8c7] hover:text-white"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="text-center text-[#94a8c7] mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-400 hover:text-blue-300">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;    
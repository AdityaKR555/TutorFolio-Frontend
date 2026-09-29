import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      formData.email.trim() === "" ||
      formData.password.trim() === ""
    ) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/login", {
        email: formData.email.trim(),
        password: formData.password.trim(),
      });

      const data = response.data;

      if (data.status === 200) {
        localStorage.setItem("user", JSON.stringify(data.data));
        navigate("/dashboard");
      } else {
        alert(data.message || "Unable to login.");
      }
    } catch (error) {
      console.error("Login error:", error);

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
            Welcome Back.
          </h1>

          <p className="text-[#94a8c7] text-lg mt-5 max-w-md leading-relaxed">
            Access your TutorFolio account and continue building your teaching
            presence online.
          </p>

          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-3 text-[#c7d8f5]">
              <span className="text-blue-400">✓</span>
              Portfolio-Based Profiles
            </div>

            <div className="flex items-center gap-3 text-[#c7d8f5]">
              <span className="text-blue-400">✓</span>
              Direct Student Connections
            </div>

            <div className="flex items-center gap-3 text-[#c7d8f5]">
              <span className="text-blue-400">✓</span>
              Built For Indian Tutors
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
            <h2 className="text-white text-3xl font-bold">Login</h2>

            <p className="text-[#94a8c7] mt-2">
              Sign in to your account.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
                    placeholder="Enter your password"
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
                disabled={loading}
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="text-center text-[#94a8c7] mt-6">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-400 hover:text-blue-300"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
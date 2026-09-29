import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    account_type: "Tutor",
    username: "",
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

      if (data.status === 200) {
        alert("Account created successfully. Please login.");
        navigate("/login");
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

            {/* Account Type */}
            <div className="mt-8">
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
                  className={`py-3 rounded-xl border transition-all ${
                    formData.account_type === "Student"
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-[#0a1628] border-blue-500/10 text-[#94a8c7]"
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
                  className={`py-3 rounded-xl border transition-all ${
                    formData.account_type === "Tutor"
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-[#0a1628] border-blue-500/10 text-[#94a8c7]"
                  }`}
                >
                  Tutor
                </button>
              </div>
            </div>

            <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
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
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
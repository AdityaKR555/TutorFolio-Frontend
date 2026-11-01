import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { setAuthSession } from "../utils/auth";

/* Same fonts and graph-paper pattern as the landing page.
   If you move these into your global CSS, delete this block and the <style> tag below. */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Instrument+Sans:wght@400;500;600&family=Fraunces:opsz,wght@9..144,600&display=swap');
.tf{font-family:'Instrument Sans',system-ui,sans-serif}
.tf-d{font-family:'Bricolage Grotesque','Instrument Sans',sans-serif;letter-spacing:-.025em}
.tf-s{font-family:'Fraunces',Georgia,serif}
.tf-grid{background-image:linear-gradient(rgba(148,168,199,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(148,168,199,.05) 1px,transparent 1px),linear-gradient(rgba(148,168,199,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(148,168,199,.09) 1px,transparent 1px);background-size:28px 28px,28px 28px,140px 140px,140px 140px;background-position:-1px -1px;-webkit-mask-image:radial-gradient(ellipse 85% 75% at 50% 25%,#000 20%,transparent 100%);mask-image:radial-gradient(ellipse 85% 75% at 50% 25%,#000 20%,transparent 100%)}
`;

const ICONS = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  back: "M19 12H5M11 18l-6-6 6-6",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  eyeOff: "M3 3l18 18M10.6 5.1A9.7 9.7 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 3.9M6.6 6.6A17 17 0 002 12s4 7 10 7c1.7 0 3.3-.4 4.7-1.1M9.9 9.9a3 3 0 004.2 4.2",
};
const Icon = ({ n, c = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={c} aria-hidden="true">
    <path d={ICONS[n]} />
  </svg>
);

const inputCls =
  "w-full rounded-lg border border-white/10 bg-[#0a1628] px-4 py-3 text-white placeholder:text-[#5f7aa0] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25";

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

  const benefits = [
    "Your own professional teaching page",
    "Subjects, qualifications, achievements and batches in one place",
    "Be discovered by students and receive their enquiries",
  ];

  return (
    <div className="tf relative min-h-screen overflow-x-clip bg-[#0a1628] text-white antialiased">
      <style>{CSS}</style>
      <div aria-hidden="true" className="tf-grid pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8 lg:justify-center lg:py-10">
        {/* Top bar: mobile / tablet */}
        <div className="mb-8 flex items-center justify-between lg:hidden">
          <Link to="/" aria-label="TutorFolio home">
            <img src="/tf-logo.png" alt="TutorFolio" className="w-14 sm:w-22" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#9cb2d2] transition-colors hover:text-white rounded-full border border-white/10 bg-white/[.03] p-1.5 pr-2">
            <Icon n="back" c="w-4 h-4" /> Back to home
          </Link>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-20">
          {/* Left side */}
          <div className="hidden lg:block">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#9cb2d2] transition-colors hover:text-white rounded-full border border-white/10 bg-white/[.03] p-2">
              <Icon n="back" c="w-4 h-4" /> Back to home
            </Link>

            <Link to="/" className="mt-10 block w-fit" aria-label="TutorFolio home">
              <img src="/tf-logo.png" alt="TutorFolio" className="w-24" />
            </Link>

            <h1 className="tf-d mt-8 max-w-md text-5xl font-bold leading-[1.06] text-white">
              Start your teaching website.
            </h1>

            <p className="mt-5 max-w-md text-lg leading-relaxed text-[#94a8c7]">
              Create your account and build the page students will find you on.
            </p>

            <ul className="mt-9 max-w-md space-y-4">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[#c7d8f5]">
                  <Icon n="check" c="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Form */}
          <div className="w-full">
            <div className="rounded-2xl border border-white/10 bg-[#0f1f36] p-6 shadow-2xl shadow-black/30 sm:p-8">
              <h2 className="tf-d text-3xl font-bold text-white">Create your tutor account</h2>
              <p className="mt-2 text-[#94a8c7]">Free to start. It takes a minute.</p>

              {/* Google Signup Button */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading || loading}
                className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-white py-3 font-medium text-slate-800 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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
                  {googleLoading ? "Connecting to Google..." : "Sign up with Google"}
                </span>
              </button>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-sm text-[#6d86aa]">or sign up with email</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="username" className="mb-2 block text-sm font-medium text-[#c7d8f5]">Username</label>
                  <input
                    id="username"
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#c7d8f5]">Email</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#c7d8f5]">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      className={`${inputCls} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-[#94a8c7] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <Icon n={showPassword ? "eyeOff" : "eye"} c="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full cursor-pointer rounded-lg bg-blue-600 py-3.5 font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              <p className="mt-6 text-center text-[#94a8c7]">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-blue-400 underline-offset-4 transition-colors hover:text-blue-300 hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
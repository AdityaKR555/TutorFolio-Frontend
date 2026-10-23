import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { setAuthSession } from "../utils/auth";

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("processing"); // "processing" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const handleAuth = async () => {
      // 1. Check for error from Google or Backend
      const errorParam = searchParams.get("error");
      const messageParam = searchParams.get("message");

      if (errorParam || messageParam) {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage(
          messageParam ||
            (errorParam === "access_denied"
              ? "Access was denied during Google Sign-In."
              : `Authentication error: ${errorParam}`)
        );
        return;
      }

      // 2. Check Option A: Backend redirected with tokens in query params
      const accessToken = searchParams.get("accessToken");
      if (accessToken) {
        const refreshToken = searchParams.get("refreshToken") || "";
        const userId = searchParams.get("userId");
        const accountType = (
          searchParams.get("accountType") || "tutor"
        ).trim().toLowerCase();
        const username = searchParams.get("username") || "";
        const email = searchParams.get("email") || "";

        setAuthSession({
          userId,
          accountType,
          username,
          email,
          accessToken,
          refreshToken,
        });

        if (!isMounted) return;
        setStatus("success");

        setTimeout(() => {
          if (accountType === "student") {
            navigate("/student", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }, 500);
        return;
      }

      // 3. Check Option B: Google redirected directly with code & state
      const code = searchParams.get("code");
      const state = searchParams.get("state") || "";

      if (code) {
        try {
          const response = await api.get("/auth/google/callback", {
            params: { code, state },
          });

          const resData = response.data;

          if (
            (resData.status === 200 || resData.status === 201) &&
            resData.data?.accessToken
          ) {
            setAuthSession(resData.data);

            if (!isMounted) return;
            setStatus("success");

            const accountType = String(
              resData.data.accountType || "tutor"
            ).trim().toLowerCase();

            setTimeout(() => {
              if (accountType === "student") {
                navigate("/student", { replace: true });
              } else {
                navigate("/dashboard", { replace: true });
              }
            }, 500);
            return;
          } else {
            if (!isMounted) return;
            setStatus("error");
            setErrorMessage(
              resData.message || "Failed to complete Google authentication."
            );
            return;
          }
        } catch (err) {
          console.error("Callback API error:", err);
          if (!isMounted) return;
          setStatus("error");
          setErrorMessage(
            err.response?.data?.message ||
              "Unable to complete Google authentication. Please try again."
          );
          return;
        }
      }

      // 4. Neither tokens nor code found
      if (!isMounted) return;
      setStatus("error");
      setErrorMessage("No authentication details received. Please try logging in again.");
    };

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#0f1f36] border border-blue-500/10 rounded-3xl p-8 text-center shadow-xl">
        <img
          src="/tf-logo.png"
          alt="TutorFolio"
          className="w-44 mx-auto mb-6"
        />

        {status === "processing" && (
          <div>
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-5" />
            <h2 className="text-xl font-bold text-white mb-2">
              Signing you in...
            </h2>
            <p className="text-[#94a8c7] text-sm">
              Please wait while we verify your Google credentials.
            </p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl">
              ✓
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Authentication Successful
            </h2>
            <p className="text-[#94a8c7] text-sm">
              Redirecting you to your account...
            </p>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center mx-auto mb-5 text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Authentication Failed
            </h2>
            <p className="text-red-300 text-sm mb-6 bg-red-950/30 border border-red-800/30 rounded-xl p-3">
              {errorMessage}
            </p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-colors"
              >
                Back to Login
              </Link>
              <Link
                to="/"
                className="block w-full bg-[#0a1628] hover:bg-white/5 border border-blue-500/10 text-[#94a8c7] hover:text-white py-3 rounded-xl font-medium transition-colors"
              >
                Go to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;


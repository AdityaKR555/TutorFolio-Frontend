import axios from "axios";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
  getStoredUser,
} from "../utils/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach Authorization header
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401 Unauthorized & refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Do not attempt to refresh for login or token refresh endpoints
      const url = originalRequest.url || "";
      if (url.includes("/login") || url.includes("/token/refresh") || url.includes("/register")) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
          const rawBase =
            api.defaults.baseURL || import.meta.env.VITE_API_BASE_URL || "";
          const base = rawBase.replace(/\/+$/, "");

          const refreshResponse = await axios.post(
            `${base}/token/refresh`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" } }
          );

          const result = refreshResponse.data;

          if (result?.status === 200 && result?.data?.accessToken) {
            const newAccessToken = result.data.accessToken;

            const currentUser = getStoredUser() || {};
            setAuthSession({
              ...currentUser,
              accessToken: newAccessToken,
              refreshToken,
            });

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          console.error("Token refresh failed:", refreshErr);
        }
      }

      // If refresh failed or no refresh token, wipe session and redirect
      clearAuthSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';
const key = 'tutorfolio-admin-session';
export const session = () => { try { return JSON.parse(sessionStorage.getItem(key)) || null; } catch { return null; } };
export const saveSession = value => sessionStorage.setItem(key, JSON.stringify(value));
export const clearSession = () => sessionStorage.removeItem(key);
export const adminApi = axios.create({ baseURL: import.meta.env.VITE_ADMIN_API_BASE_URL || import.meta.env.VITE_API_BASE_URL, timeout: 25000 });
adminApi.interceptors.request.use(config => {
  if (session()?.accessToken) config.headers.Authorization = `Bearer ${session().accessToken}`;
  return config;
});
let refreshing;
adminApi.interceptors.response.use(response => response, async error => {
  const config = error.config;
  if (error.response?.status === 401 && config && !config._retry && !['/auth/login', '/auth/verify-otp', '/auth/refresh'].some(path => config.url.includes(path))) {
    config._retry = true;
    try {
      if (!session()?.refreshToken) throw error;
      refreshing ||= axios.post(`${(adminApi.defaults.baseURL || '').replace(/\/$/, '')}/admin/auth/refresh`, { refreshToken: session().refreshToken }).then(({data}) => { saveSession(data); }).finally(() => { refreshing = null; });
      await refreshing;
      return adminApi(config);
    } catch {
      clearSession();
      window.location.assign('/login?mode=admin');
    }
  }
  return Promise.reject(error);
});
export const errorText = error => {
  const detail = error.response?.data?.detail;
  return Array.isArray(detail) ? detail.map(item => item.msg).join('. ') : detail || error.response?.data?.message || 'Unable to connect. Please try again.';
};

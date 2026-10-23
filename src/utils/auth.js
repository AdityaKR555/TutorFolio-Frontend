export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getAccessToken = () => {
  try {
    const token = localStorage.getItem("accessToken");
    if (token) return token;
    const user = getStoredUser();
    return user?.accessToken || null;
  } catch {
    return null;
  }
};

export const getRefreshToken = () => {
  try {
    const token = localStorage.getItem("refreshToken");
    if (token) return token;
    const user = getStoredUser();
    return user?.refreshToken || null;
  } catch {
    return null;
  }
};

export const setAuthSession = (data) => {
  if (!data) return;

  const rawUserId = data.userId ?? data.user_id ?? data.id;
  const parsedUserId =
    typeof rawUserId === "number" || (typeof rawUserId === "string" && !isNaN(Number(rawUserId)))
      ? Number(rawUserId)
      : rawUserId;

  const rawAccountType = data.accountType || data.type || "tutor";
  const normalizedAccountType = String(rawAccountType).trim().toLowerCase();

  const userData = {
    ...data,
    userId: parsedUserId,
    user_id: parsedUserId,
    id: parsedUserId,
    accountType: normalizedAccountType,
    email: data.email || "",
    username: data.username || "",
  };

  localStorage.setItem("user", JSON.stringify(userData));

  if (data.accessToken) {
    localStorage.setItem("accessToken", data.accessToken);
  }
  if (data.refreshToken) {
    localStorage.setItem("refreshToken", data.refreshToken);
  }

  window.dispatchEvent(new Event("tutorfolio-user-updated"));
};

export const clearAuthSession = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.dispatchEvent(new Event("tutorfolio-user-updated"));
};

export const isAuthenticated = () => {
  return Boolean(getAccessToken() || getStoredUser());
};


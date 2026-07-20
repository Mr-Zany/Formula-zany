const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const ACCESS_KEY = "fz_access_token";
const REFRESH_KEY = "fz_refresh_token";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function rawRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await resp.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { resp, data };
}

async function tryRefresh() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  const { resp, data } = await rawRequest("/auth/token/refresh/", {
    method: "POST",
    body: { refresh },
    auth: false,
  });
  if (resp.ok && data?.access) {
    setTokens({ access: data.access });
    return true;
  }
  clearTokens();
  return false;
}

// Thin fetch wrapper: attaches the JWT access token, and on a 401 retries
// once after refreshing (Step 5's /api/auth/token/refresh/).
export async function apiFetch(path, options = {}) {
  let { resp, data } = await rawRequest(path, options);

  if (resp.status === 401 && options.auth !== false) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      ({ resp, data } = await rawRequest(path, options));
    }
  }

  if (!resp.ok) {
    const message =
      (data && typeof data === "object" && (data.detail || firstFieldError(data))) ||
      `Request failed (${resp.status})`;
    throw new ApiError(message, resp.status, data);
  }

  return data;
}

// Serializer field errors come back as {"field": ["message", ...]} --
// surface the first one as a readable fallback when there's no top-level
// "detail".
function firstFieldError(data) {
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (Array.isArray(value) && value.length) return `${key}: ${value[0]}`;
  }
  return null;
}

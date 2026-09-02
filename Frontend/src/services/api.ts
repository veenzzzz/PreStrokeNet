import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const refreshClient = axios.create({ baseURL: API_BASE_URL, headers: { "Content-Type": "application/json" } });
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const clearSession = () => {
  localStorage.removeItem("prestrokenet-token");
  localStorage.removeItem("prestrokenet-refresh-token");
  localStorage.removeItem("prestrokenet-user");
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("prestrokenet-refresh-token");
  if (!refreshToken) return null;
  try {
    const response = await refreshClient.post<{ access_token: string; refresh_token: string }>("/auth/refresh", { refresh_token: refreshToken });
    localStorage.setItem("prestrokenet-token", response.data.access_token);
    localStorage.setItem("prestrokenet-refresh-token", response.data.refresh_token);
    return response.data.access_token;
  } catch {
    clearSession();
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("prestrokenet-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const isAuthRequest = Boolean(original?.url?.includes("/auth/"));
    if (error.response?.status !== 401 || !original || original._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    original._retry = true;
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }
    const token = await (refreshPromise ?? Promise.resolve(null));
    if (!token) {
      window.location.assign("/login");
      return Promise.reject(error);
    }
    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  },
);

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const token = localStorage.getItem("prestrokenet-token") || localStorage.getItem("token") || "";
  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    if (contentType.includes("application/json")) {
      const errJson = await response.json();
      throw new Error(errJson.detail || errJson.message || `Request failed with HTTP ${response.status}`);
    }
    const errText = await response.text();
    throw new Error(`API returned HTTP ${response.status}: ${errText.slice(0, 100)}`);
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export { API_BASE_URL, clearSession };
export default api;

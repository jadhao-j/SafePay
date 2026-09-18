import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

/**
 * Dynamically resolves the backend API base URL.
 * When in the browser, adapts to window.location.hostname so switching between
 * localhost, different Wi-Fi networks, or mobile LAN IPs never breaks connectivity.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return `${window.location.protocol}//${host}:8000/api/v1`;
    }
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
}

const apiBaseUrl = getApiBaseUrl();

/**
 * Generate a stable device fingerprint from browser characteristics.
 * This is sent as X-Device-ID so the backend can look up trusted devices.
 */
function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "";
  const cached = sessionStorage.getItem("_sp_device_fp");
  if (cached) return cached;

  const raw = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency ?? "",
  ].join("|");

  // Simple hash (djb2) — deterministic per browser/device
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash + raw.charCodeAt(i)) >>> 0;
  }
  const fp = `web-${hash.toString(36)}`;
  sessionStorage.setItem("_sp_device_fp", fp);
  return fp;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Track whether a token refresh is already in-flight to avoid loops
let isRefreshing = false;

// Inject Bearer token + device fingerprint on every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    config.baseURL = getApiBaseUrl();
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Always send device fingerprint so backend can match trusted devices
    const fp = getDeviceFingerprint();
    if (fp) {
      config.headers["X-Device-ID"] = fp;
    }
  }
  return config;
});

// On 401: attempt token refresh before redirecting to login.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window === "undefined" || error?.response?.status !== 401) {
      return Promise.reject(error);
    }

    // If we're already refreshing or this IS the refresh call, go to login
    const originalRequest = error.config;
    if (isRefreshing || originalRequest?._retry) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?returnTo=${returnTo}`;
      return Promise.reject(error);
    }

    // Try refreshing the token
    const refreshToken = localStorage.getItem("refresh_token");
    const accessToken = localStorage.getItem("access_token");
    if (refreshToken && accessToken) {
      isRefreshing = true;
      try {
        const res = await axios.post(`${apiBaseUrl}/auth/refresh`, {
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        const newAccess: string = res.data?.access_token;
        const newRefresh: string = res.data?.refresh_token;
        if (newAccess) {
          localStorage.setItem("access_token", newAccess);
          if (newRefresh) localStorage.setItem("refresh_token", newRefresh);
          // Retry the original request with the new token
          originalRequest._retry = true;
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          isRefreshing = false;
          return apiClient(originalRequest);
        }
      } catch {
        // Refresh failed — fall through to login redirect
      } finally {
        isRefreshing = false;
      }
    }

    // No refresh token or refresh failed — redirect to login
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?returnTo=${returnTo}`;
    return Promise.reject(error);
  }
);

// Expose token helpers for login/logout flows
export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", token);
  }
}

/** Save both access + refresh tokens after login. */
export function setAuthTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", accessToken);
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }
  }
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
}


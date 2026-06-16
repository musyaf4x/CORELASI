/**
 * @file src/services/api.ts
 * @description Axios instance singleton for CORELASI.
 *
 * This is the single HTTP client for all real API calls.
 * Currently configured with placeholder interceptors that will activate
 * when VITE_API_BASE_URL points to a real backend.
 *
 * Mock services (localStorage) do NOT use this instance.
 * When integrating real API, services will swap to call this instance.
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { ApiError } from "@/types/api";
import {
  clearSession,
  getAccessToken,
  setAccessToken,
} from "@/services/sessionStore";

// ─── Configuration ─────────────────────────────────────────────────────────────

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const TIMEOUT_MS = 15_000;

// ─── Axios Instance ────────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

// ─── Request Interceptor ───────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach the short-lived access token from module memory.
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ─── Response Interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  // Pass-through for successful responses
  (response) => response,

  // Handle errors: normalize to ApiError instances
  async (error: AxiosError) => {
    const status = error.response?.status;
    const responseData = error.response?.data as
      | Record<string, unknown>
      | undefined;
    const retryConfig = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // 401 Unauthorized — token expired, attempt refresh
    if (
      status === 401 &&
      retryConfig &&
      !retryConfig._retry &&
      !retryConfig.url?.includes("/auth/refresh/")
    ) {
      retryConfig._retry = true;
      const refreshed = await refreshSession();
      if (refreshed) {
        // Retry original request with new token
        const newToken = getAccessToken();
        if (newToken && retryConfig.headers) {
          retryConfig.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(retryConfig);
      }
      // Refresh failed — clear session and redirect to login
      clearSession();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(
        new ApiError("Sesi habis, silakan login kembali.", 401),
      );
    }

    if (status === 401) {
      clearSession();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(
        new ApiError("Sesi habis, silakan login kembali.", 401),
      );
    }

    // 403 Forbidden
    if (status === 403) {
      return Promise.reject(
        new ApiError(
          "Anda tidak memiliki izin untuk mengakses halaman ini.",
          403,
        ),
      );
    }

    const errors = responseData?.["errors"] as
      | Record<string, string[]>
      | undefined;

    // 422 Validation error
    if (status === 422) {
      const message =
        typeof responseData?.["message"] === "string"
          ? responseData["message"]
          : "Data tidak valid.";
      return Promise.reject(new ApiError(message, 422, errors));
    }

    // 404 Not Found
    if (status === 404) {
      return Promise.reject(new ApiError("Data tidak ditemukan.", 404));
    }

    // 5xx Server errors
    if (status !== undefined && status >= 500) {
      return Promise.reject(
        new ApiError("Terjadi kesalahan pada server. Coba lagi nanti.", status),
      );
    }

    // Network error (no response) or other client errors
    if (!error.response) {
      return Promise.reject(
        new ApiError(
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
          0,
        ),
      );
    }

    // Generic fallback
    const fallbackMessage =
      typeof responseData?.["message"] === "string"
        ? responseData["message"]
        : "Terjadi kesalahan yang tidak diketahui.";

    return Promise.reject(new ApiError(fallbackMessage, status ?? 0, errors));
  },
);

// ─── Token Management Helpers ──────────────────────────────────────────────────

let csrfPromise: Promise<void> | null = null;

export function ensureCsrfCookie(): Promise<void> {
  if (!csrfPromise) {
    csrfPromise = axios
      .get(`${BASE_URL}/auth/csrf/`, {
        withCredentials: true,
        timeout: TIMEOUT_MS,
      })
      .then(() => undefined)
      .finally(() => {
        csrfPromise = null;
      });
  }
  return csrfPromise;
}

/** Coordinates token rotation so concurrent 401 responses share one request. */
let refreshPromise: Promise<boolean> | null = null;

async function performTokenRefresh(): Promise<boolean> {
  try {
    await ensureCsrfCookie();

    const response = await axios.post<{
      success: true;
      data: { accessToken: string };
    }>(
      `${BASE_URL}/auth/refresh/`,
      {},
      {
        withCredentials: true,
        withXSRFToken: true,
        xsrfCookieName: "csrftoken",
        xsrfHeaderName: "X-CSRFToken",
        timeout: TIMEOUT_MS,
      },
    );
    const tokens = response.data.data;
    if (!tokens.accessToken) return false;

    setAccessToken(tokens.accessToken);
    return true;
  } catch {
    clearSession();
    return false;
  }
}

export function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ─── Convenience Wrappers ──────────────────────────────────────────────────────

/**
 * GET request wrapper that unwraps the `data` field from ApiResponse<T>.
 * Use this when real API follows the { success, message, data } envelope.
 */
export async function apiGet<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const response = await apiClient.get<{ success: true; data: T }>(url, {
    params,
  });
  return response.data.data;
}

/**
 * POST request wrapper that unwraps the `data` field from ApiResponse<T>.
 */
export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiClient.post<{ success: true; data: T }>(url, body);
  return response.data.data;
}

/**
 * PATCH request wrapper that unwraps the `data` field from ApiResponse<T>.
 */
export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiClient.patch<{ success: true; data: T }>(url, body);
  return response.data.data;
}

/**
 * DELETE request wrapper.
 */
export async function apiDelete(url: string): Promise<void> {
  await apiClient.delete(url);
}

/**
 * Multipart form data upload wrapper (for file uploads).
 */
export async function apiUpload<T>(
  url: string,
  formData: FormData,
): Promise<T> {
  const response = await apiClient.post<{ success: true; data: T }>(
    url,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data.data;
}

import axios from "axios";
import { env } from "@/config/env";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/errors/ApiError";
import { logError } from "@/errors/errorHandler";

export const httpClient = axios.create({
  baseURL: env.EXPO_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ── Request Interceptor ──────────────────────────────────────
httpClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    logError(error, "httpClient:request");
    return Promise.reject(error);
  }
);

// ── Response Interceptor ─────────────────────────────────────
httpClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const statusCode: number = error?.response?.status ?? 500;
    const endpoint: string = error?.config?.url ?? "unknown";
    const message: string =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";

    const apiError = ApiError.fromResponse(statusCode, message, endpoint);
    logError(apiError, `httpClient:response [${endpoint}]`);

    return Promise.reject(apiError);
  }
);
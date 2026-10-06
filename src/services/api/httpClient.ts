import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/errors/ApiError";
import { logError } from "@/errors/errorHandler";

export const httpClient = axios.create({
  baseURL: env.EXPO_PUBLIC_API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
  timeout: 15000,
});

httpClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    logError(error, "httpClient:request");
    return Promise.reject(error);
  }
);

httpClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<any>) => {
    const statusCode: number = error?.response?.status ?? 500;
    const endpoint: string = error?.config?.url ?? "unknown";
    let message: string =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.response?.data?.error;

    if (!message && error?.response?.data && typeof error.response.data === "object") {
      const formatErrorVal = (val: any): string => {
        if (typeof val === "string") return val;
        if (Array.isArray(val)) {
          return val.map((v) => formatErrorVal(v)).join(", ");
        }
        if (typeof val === "object" && val !== null) {
          return Object.entries(val)
            .map(([k, v]) => `${k}: ${formatErrorVal(v)}`)
            .join("; ");
        }
        return String(val);
      };

      const fieldErrors = Object.entries(error.response.data)
        .map(([field, errs]) => `${field}: ${formatErrorVal(errs)}`)
        .join("\n");
      if (fieldErrors) message = fieldErrors;
    }

    if (!message) {
      message = error?.message || "Something went wrong";
    }

    const responseData = error?.response?.data;
    const apiError = ApiError.fromResponse(statusCode, message, endpoint, responseData);
    logError(apiError, `httpClient:response [${endpoint}]`);

    return Promise.reject(apiError);
  }
);

import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/errors/ApiError";
import { logError } from "@/errors/errorHandler";
import {
  getAppVersionHeaders,
  resultFromBackendPayload,
} from "@/features/version/services/versionService";
import { useVersionStore } from "@/features/version/store/versionStore";

export const httpClient = axios.create({
  baseURL: env.EXPO_PUBLIC_API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
  timeout: 15000,
});

httpClient.interceptors.request.use(
  (config) => {
    config.headers = config.headers ?? {};
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Lets the backend reject outdated builds with 426 Upgrade Required
    Object.assign(config.headers, getAppVersionHeaders());
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
    const message: string =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";

    const responseData = error?.response?.data;

    // 426 = build below minimum version, 503 + maintenance payload = maintenance mode
    if (
      statusCode === 426 ||
      (statusCode === 503 && responseData?.status === "maintenance")
    ) {
      // A 426 always means "update required", even if the body lacks version fields
      const versionResult =
        resultFromBackendPayload(responseData) ??
        (statusCode === 426
          ? resultFromBackendPayload({
              status: "force_update",
              force_update: true,
              soft_update: false,
              maintenance_mode: false,
              message: responseData?.detail,
            })
          : null);
      if (versionResult) {
        useVersionStore.getState().setCheckResult(versionResult);
      }
    }

    const apiError = ApiError.fromResponse(statusCode, message, endpoint, responseData);
    
    // 404 (Not Found) is a normal response for missing/optional resources and should not log as a critical ErrorHandler error
    if (statusCode !== 404) {
      logError(apiError, `httpClient:response [${endpoint}]`);
    }

    return Promise.reject(apiError);
  }
);

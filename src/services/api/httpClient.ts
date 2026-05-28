import axios, { AxiosError } from "axios";
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

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

httpClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    const domainName = useAuthStore.getState().domain_name;
    if (domainName) {
      const tenant = domainName.replace(/^https?:\/\//, "").split(".")[0];
      config.headers = config.headers ?? {};
      config.headers["X-Tenant"] = tenant;
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
  async (error: AxiosError<any>) => {
    const originalRequest = error.config;
    const statusCode: number = error?.response?.status ?? 500;
    const endpoint: string = originalRequest?.url ?? "unknown";

    // Intercept 401 Unauthorized errors
    if (statusCode === 401 && originalRequest && !originalRequest.headers?.["_retry"]) {
      if (endpoint.includes("/accounts/login/")) {
        return Promise.reject(error);
      }

      if (endpoint.includes("/accounts/login/refresh/")) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return httpClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Mark request as retried
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers["_retry"] = "true";
      isRefreshing = true;

      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }

      try {
        const refreshUrl = `${env.EXPO_PUBLIC_API_BASE_URL}/api/accounts/login/refresh/`;
        // Use plain axios instance to avoid interceptor loops
        const response = await axios.post(refreshUrl, { refresh: refreshToken });
        const { access } = response.data;

        // Update tokens in store
        useAuthStore.getState().setTokens(access, refreshToken);

        processQueue(null, access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return httpClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

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

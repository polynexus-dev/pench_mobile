import { AppError } from "./AppError";
import { ApiError } from "./ApiError";
import { errorMessages } from "./errorMessages";

/**
 * Normalise any thrown value into a human-readable message.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.data && typeof error.data === "object") {
      const messages: string[] = [];
      for (const key of Object.keys(error.data)) {
        const val = error.data[key];
        if (Array.isArray(val)) {
          messages.push(...val.map(String));
        } else if (typeof val === "string") {
          messages.push(val);
        }
      }
      if (messages.length > 0) {
        return messages.join(" ");
      }
    }

    switch (error.statusCode) {
      case 401: {
        const msg = error.message?.toLowerCase() || "";
        if (
          msg.includes("no active account found") &&
          (msg.includes("credentilas") || msg.includes("credentials"))
        ) {
          return "Please create an account or login with valid credentials.";
        }
        return errorMessages.UNAUTHORIZED;
      }
      case 403:
        return errorMessages.FORBIDDEN;
      case 404: {
        const msg = error.message?.toLowerCase() || "";
        if (
          error.endpoint?.includes("request-otp") ||
          msg.includes("no customer found")
        ) {
          return "Enter correct phone number";
        }
        return errorMessages.NOT_FOUND;
      }
      case 429: {
        const msg = error.message?.toLowerCase() || "";
        if (
          msg.includes("please wait") &&
          (msg.includes("seconds") || msg.includes("otp"))
        ) {
          return "Please wait 60 seconds before requesting a new OTP";
        }
        return error.message || "Too many requests. Please try again later.";
      }
      case 500:
        return errorMessages.SERVER_ERROR;
      default:
        return error.message || errorMessages.UNKNOWN;
    }
  }

  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    if (
      error.message.includes("Network") ||
      error.message.includes("network")
    ) {
      return errorMessages.NETWORK_ERROR;
    }
    if (error.message.includes("timeout")) {
      return errorMessages.TIMEOUT;
    }
    return error.message;
  }

  return errorMessages.UNKNOWN;
}

/**
 * Log error to console (extend to remote logging when needed).
 */
export function logError(error: unknown, context?: string): void {
  if (__DEV__) {
    console.error(`[ErrorHandler]${context ? ` [${context}]` : ""}`, error);
  }
}

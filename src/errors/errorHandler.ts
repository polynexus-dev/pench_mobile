import { AppError } from "./AppError";
import { ApiError } from "./ApiError";
import { errorMessages } from "./errorMessages";

/**
 * Normalise any thrown value into a human-readable message.
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        switch (error.statusCode) {
            case 401:
                return errorMessages.UNAUTHORIZED;
            case 403:
                return errorMessages.FORBIDDEN;
            case 404:
                return errorMessages.NOT_FOUND;
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
        if (error.message.includes("Network") || error.message.includes("network")) {
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

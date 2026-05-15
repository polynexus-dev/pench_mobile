import { httpClient } from "@services/api/httpClient";
import type {
    LoginPayload,
    OTPRequestPayload,
    OTPVerifyPayload,
    RegisterPayload,
    AuthResponse,
    OTPRequestResponse
} from "../types/auth.types";
// import type { ApiResponse } from "@/types/api/responses.types";

export const authApi = {
    login: (payload: LoginPayload): Promise<AuthResponse> =>
        httpClient.post("accounts/login/", payload),

    requestOTP: (payload: OTPRequestPayload): Promise<OTPRequestResponse> =>
        httpClient.post("accounts/request-otp/", payload),

    verifyOTP: (payload: OTPVerifyPayload): Promise<AuthResponse> =>
        httpClient.post("accounts/login-otp/", payload),

    register: (payload: RegisterPayload): Promise<AuthResponse> =>
        httpClient.post("accounts/register/", payload),
};


import { httpClient } from "@services/api/httpClient";
import type {
    LoginPayload,
    OTPRequestPayload,
    OTPVerifyPayload,
    RegisterPayload,
    AuthResponse,
    OTPRequestResponse,
    ResetPasswordPayload,
    ForgotPasswordPayload,
    ForgotPasswordResponse,
    ResetPasswordResponse,
} from "../types/auth.types";

export const authApi = {
    login: (payload: LoginPayload): Promise<AuthResponse> =>
        httpClient.post("accounts/login/", payload),

    requestOTP: (payload: OTPRequestPayload): Promise<OTPRequestResponse> =>
        httpClient.post("accounts/request-otp/", payload),

    verifyOTP: (payload: OTPVerifyPayload): Promise<AuthResponse> =>
        httpClient.post("accounts/login-otp/", payload),

    register: (payload: RegisterPayload): Promise<AuthResponse> =>
        httpClient.post("accounts/register/", payload),

    forgotPassword: (payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> =>
        httpClient.post("accounts/forgot-password/", payload),

    resetPassword: (payload: ResetPasswordPayload): Promise<ResetPasswordResponse> =>
        httpClient.post("accounts/reset-password/", payload),
};
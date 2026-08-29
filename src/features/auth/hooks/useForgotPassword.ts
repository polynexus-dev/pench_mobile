import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/authApi";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/errors/errorHandler";
import type {
    ForgotPasswordPayload,
    ForgotPasswordResponse,
} from "../types/auth.types";

export function useForgotPassword() {
    const { show } = useToast();

    return useMutation<ForgotPasswordResponse, Error, ForgotPasswordPayload>({
        mutationFn: (payload: ForgotPasswordPayload) =>
            authApi.forgotPassword(payload),

        onSuccess: (res) => {
            show({
                message: res.message,
                type: "success",
            });
        },

        onError: (error) => {
            show({
                message: getErrorMessage(error),
                type: "error",
            });
        },
    });
}
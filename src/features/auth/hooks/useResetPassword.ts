import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { authApi } from "../api/authApi";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/errors/errorHandler";
import { ROUTES } from "@/constants/route";
import type {
    ResetPasswordPayload,
    ResetPasswordResponse,
} from "../types/auth.types";

export function useResetPassword() {
    const router = useRouter();
    const { show } = useToast();

    return useMutation<ResetPasswordResponse, Error, ResetPasswordPayload>({
        mutationFn: (payload: ResetPasswordPayload) =>
            authApi.resetPassword(payload),

        onSuccess: (res) => {
            show({
                message: res.message,
                type: "success",
            });

            router.replace(ROUTES.AUTH.LOGIN as any);
        },

        onError: (error) => {
            show({
                message: getErrorMessage(error),
                type: "error",
            });
        },
    });
}
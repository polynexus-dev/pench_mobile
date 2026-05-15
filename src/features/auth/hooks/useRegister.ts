import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { authApi } from "../api/authApi";
import { useAuthStore } from "@store/authStore";
import { tokenUtils } from "../utils/tokenUtils";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/errors/errorHandler";
import { ROUTES } from "@/constants/route";
import type { RegisterPayload } from "../types/auth.types";

export function useRegister() {
    const router = useRouter();
    const { setUser, setTokens, setDomainAndRoute } = useAuthStore();
    const { show } = useToast();

    return useMutation({
        mutationFn: (payload: RegisterPayload) => authApi.register(payload),
        onSuccess: async (data) => {
            await tokenUtils.saveTokens(data.access, data.refresh);
            setTokens(data.access, data.refresh);
            setUser(data.user);

            const domain = data.domain_name ?? data.tenant_domain ?? "";
            setDomainAndRoute(domain, null);

            router.replace(ROUTES.CUSTOMER.DASHBOARD as any);
        },
        onError: (error) => {
            show({
                message: getErrorMessage(error),
                type: "error",
            });
        },
    });
}
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { authApi } from "../api/authApi";
import { useAuthStore } from "@/store/authStore";
import { tokenUtils } from "../utils/tokenUtils";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/errors/errorHandler";
import { ROUTES } from "@/constants/route";
import type { LoginPayload } from "../types/auth.types";
import { asyncStorage } from "@services/storage/asyncStorage";

export function useLogin() {
  const router = useRouter();
  const { setUser, setTokens, setDomainAndRoute } = useAuthStore();
  const { show } = useToast();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: async (res) => {
      const { user, access, refresh, active_route_id } = res;

      await tokenUtils.saveTokens(access, refresh);
      setTokens(access, refresh);
      setUser(user);

      const domain = res.domain_name ?? res.tenant_domain ?? "";
      await asyncStorage.setItem("domain_name", domain);
      setDomainAndRoute(domain, active_route_id ?? null);

      if (user.is_driver) {
        router.replace(ROUTES.DRIVER.DASHBOARD as any);
      } else if (user.is_customer) {
        router.replace(ROUTES.CUSTOMER.DASHBOARD as any);
      } else {
        // Unknown role — clear auth and show error
        show({
          message: "Unauthorized access. Please contact support.",
          type: "error",
        });
      }
    },
    onError: (error) => {
      show({
        message: getErrorMessage(error),
        type: "error",
      });
    },
  });
}
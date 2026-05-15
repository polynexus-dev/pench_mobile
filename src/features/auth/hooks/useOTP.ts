import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { authApi } from "../api/authApi";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/useToast";
import { tokenUtils } from "../utils/tokenUtils";
import { getErrorMessage } from "@/errors/errorHandler";
import { ROUTES } from "@/constants/route";
import type { OTPRequestPayload, OTPVerifyPayload } from "../types/auth.types";

export function useRequestOTP() {
  const { show } = useToast();

  return useMutation({
    mutationFn: (payload: OTPRequestPayload) => authApi.requestOTP(payload),
    onSuccess: (data) => {
      if (data?.otp) {
        show({
          message: `🔐 OTP (testing only): ${data.otp}`,
          type: "info",
          duration: 10000,
        });
      } else {
        show({
          message: data?.message ?? "OTP sent successfully.",
          type: "success",
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

export function useVerifyOTP() {
  const router = useRouter();
  const { setUser, setTokens, setDomainAndRoute } = useAuthStore();
  const { show } = useToast();

  return useMutation({
    mutationFn: (payload: OTPVerifyPayload) => authApi.verifyOTP(payload),
    onSuccess: async (data) => {
      await tokenUtils.saveTokens(data.access, data.refresh);
      setTokens(data.access, data.refresh);
      setUser(data.user);

      const domain = data.tenant_domain ?? data.domain_name ?? "";
      const routeId = data.active_route_id ?? null;
      setDomainAndRoute(domain, routeId);

      if (data.user.is_driver) {
        router.replace(ROUTES.DRIVER.DASHBOARD as any);
      } else if (data.user.is_customer) {
        router.replace(ROUTES.CUSTOMER.DASHBOARD as any);
      } else {
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
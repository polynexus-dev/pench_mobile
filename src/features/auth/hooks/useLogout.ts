import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { tokenUtils } from "../utils/tokenUtils";
import { ROUTES } from "@/constants/route";
import { asyncStorage } from "@/services/storage";

export function useLogout() {
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const router = useRouter();

    const logout = async () => {
        await tokenUtils.clearTokens();
        await asyncStorage.removeItem("domain_name");
        clearAuth();
        router.replace(ROUTES.AUTH.LOGIN as any);
    };

    return { logout };
}
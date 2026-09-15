import { useRouter } from "expo-router";
import { ROUTES } from "@/constants/route";
import { clearLocalSession } from "../utils/clearSession";

export function useLogout() {
    const router = useRouter();

    const logout = async () => {
        await clearLocalSession();
        router.replace(ROUTES.AUTH.LOGIN as any);
    };

    return { logout };
}

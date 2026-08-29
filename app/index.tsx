import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { tokenUtils } from "@/features/auth/utils/tokenUtils";

export default function Index() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        async function redirect() {
            try {
                const access = await tokenUtils.getAccessToken();
                if (access) {
                    router.replace("/(auth)/login" as any);
                } else {
                    router.replace("/(auth)/onboarding" as any);
                }
            } catch {
                router.replace("/(auth)/onboarding" as any);
            } finally {
                setChecking(false);
            }
        }
        redirect();
    }, []);

    // ── Render nothing until redirect fires ─────────────────────
    // This prevents any screen flashing before navigation settles
    if (checking) return null;

    return null;
}
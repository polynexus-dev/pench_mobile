import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { tokenUtils } from "@/features/auth/utils/tokenUtils";
import { asyncStorage } from "@/services/storage/asyncStorage";
import { guestCityFromSchema } from "@/constants/guestTenants";
import { GUEST_CITY_KEY } from "@/features/auth/hooks/useGuestSession";
import { onboardingUtils } from "@/features/onboarding/utils/onboardingUtils";
import { ROUTES } from "@/constants/route";

export default function Index() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        async function redirect() {
            try {
                const access = await tokenUtils.getAccessToken();
                if (access) {
                    router.replace("/(auth)/login" as any);
                    return;
                }

                // ── Guest session from a previous run → straight to the catalog ──
                const storedCity = await asyncStorage.getItem(GUEST_CITY_KEY);
                if (guestCityFromSchema(storedCity)?.domain) {
                    router.replace(ROUTES.CUSTOMER.DASHBOARD as any);
                    return;
                }

                // ── Onboarding only on a genuinely first run ─────────────────
                const seenOnboarding = await onboardingUtils.isComplete();
                router.replace(
                    (seenOnboarding ? ROUTES.AUTH.LOGIN : "/(auth)/onboarding") as any
                );
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

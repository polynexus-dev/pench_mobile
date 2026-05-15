import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";

type AppRoute =
    | "/(driver)/(tabs)/dashboard"
    | "/(customer)/(tabs)/dashboard"
    | "/(admin)/(tabs)/dashboard"
    | "/(auth)/login";

const ROLE_ROUTES: Record<string, AppRoute> = {
    driver: "/(driver)/(tabs)/dashboard",
    customer: "/(customer)/(tabs)/dashboard",
    admin: "/(admin)/(tabs)/dashboard",
};

export default function AuthLayout() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        if (user?.role) {
            // user.role is PascalCase from API ("Driver", "Customer", "Admin")
            // ROLE_ROUTES keys are lowercase — normalize before lookup
            const appRole = user.role.toLowerCase();
            const route = ROLE_ROUTES[appRole] ?? "/(auth)/login";
            router.replace(route as any);
        }
    }, [user]);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="otp" />
            <Stack.Screen name="register" />
            <Stack.Screen name="onboarding" />
        </Stack>
    );
}
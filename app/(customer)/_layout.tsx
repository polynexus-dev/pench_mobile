import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Stack } from "expo-router";

export default function CustomerLayout() {
    const user = useAuthStore((s) => s.user);

    if (!user?.is_customer) {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}
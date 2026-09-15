import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Stack } from "expo-router";

export default function CustomerLayout() {
    const user = useAuthStore((s) => s.user);
    const isGuest = useAuthStore((s) => s.isGuest);

    // Guests browse the customer stack without a session. Per-action gates
    // (add to cart, subscribe, wallet) live in the screens themselves.
    if (!user?.is_customer && !isGuest) {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
                name="product/[id]"
                options={{
                    presentation: "modal",
                    headerShown: false
                }}
            />
        </Stack>
    );
}

import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Stack } from "expo-router";
import { useStartupSync } from "@/features/map/hooks/useStartupSync";

export default function DriverLayout() {
  const user = useAuthStore((s) => s.user);
  useStartupSync();

  if (!user?.is_driver) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
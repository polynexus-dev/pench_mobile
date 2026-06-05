import React, { useEffect } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/constants/route";
import { Text } from "@/shared/ui/Text/Text";

export default function DeepLinkProfileQR() {
  const { qr_id } = useLocalSearchParams<{ qr_id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      Alert.alert("Authentication Required", "Please log in to continue.");
      router.replace(ROUTES.AUTH.LOGIN as any);
      return;
    }

    // Redirect customer to customer dashboard
    router.replace(ROUTES.CUSTOMER.DASHBOARD as any);
  }, [qr_id, user, router]);

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <ActivityIndicator size="large" color="#1B5E37" />
      <Text variant="body" color="muted" className="mt-4 text-center">
        Redirecting to dashboard...
      </Text>
    </View>
  );
}

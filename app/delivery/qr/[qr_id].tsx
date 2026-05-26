import React, { useEffect } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useGeofenceStore } from "@/store/geofenceStore";
import { httpClient } from "@/services/api/httpClient";
import { buildUrl } from "@/services/api/buildUrl";
import { ROUTES } from "@/constants/route";
import { Text } from "@/shared/ui/Text/Text";

export default function DeepLinkDeliveryQR() {
  const { qr_id } = useLocalSearchParams<{ qr_id: string }>();
  const router = useRouter();
  const { user, domain_name } = useAuthStore();

  useEffect(() => {
    async function resolve() {
      if (!user) {
        Alert.alert("Authentication Required", "Please log in to continue.");
        router.replace(ROUTES.AUTH.LOGIN as any);
        return;
      }

      if (!user.is_driver) {
        // Silently route customers directly to their personal dashboard
        router.replace(ROUTES.CUSTOMER.DASHBOARD as any);
        return;
      }

      try {
        if (!domain_name) {
          throw new Error("Missing domain configuration.");
        }

        // Call resolve-qr endpoint
        const url = buildUrl(
          domain_name,
          `/api/erp/orders/driver/resolve-qr/${qr_id}/`,
        );
        const response: any = await httpClient.get(url);

        const order = response?.order;
        if (!order) {
          Alert.alert(
            "No Active Order",
            "No pending delivery order was found for this customer today.",
            [
              {
                text: "OK",
                onPress: () => router.replace(ROUTES.DRIVER.DASHBOARD as any),
              },
            ],
          );
          return;
        }

        // Look up matching stop in active route if available
        const stops = useGeofenceStore.getState().route?.stops || [];
        const matchingStop = stops.find((s) => s.order === order.id);

        // Redirect driver to submit delivery page
        router.replace({
          pathname: ROUTES.DRIVER.FINALIZE_DELIVERY,
          params: {
            routeId: useGeofenceStore.getState().route?.id || "N/A",
            stopId: matchingStop?.id || "N/A",
            orderId: order.id,
          },
        } as any);
      } catch (err: any) {
        Alert.alert(
          "Resolution Failed",
          err?.message ||
            "Failed to resolve QR code. Invalid code or connection error.",
          [
            {
              text: "OK",
              onPress: () => router.replace(ROUTES.DRIVER.DASHBOARD as any),
            },
          ],
        );
      }
    }

    if (qr_id) {
      resolve();
    }
  }, [qr_id, user, domain_name, router]);

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <ActivityIndicator size="large" color="#1B5E37" />
      <Text variant="body" color="muted" className="mt-4 text-center">
        Resolving delivery QR code...
      </Text>
    </View>
  );
}

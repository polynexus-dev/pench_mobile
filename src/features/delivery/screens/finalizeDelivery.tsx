import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/shared/ui/Button/Button";
import { Text } from "@/shared/ui/Text/Text";
import { useAuthStore } from "@/store/authStore";
import { useGeofenceStore } from "@/store/geofenceStore";
import { useSubmitDelivery } from "../hooks/useSubmitDelivery";
import { httpClient } from "@/services/api/httpClient";
import { buildUrl } from "@/services/api/buildUrl";

const matchProductToBottleType = (productName: string, bottleTypes: any[]) => {
  const nameLower = productName.toLowerCase();
  
  if (
    nameLower.includes("1l") ||
    nameLower.includes("1 l") ||
    nameLower.includes("1litre") ||
    nameLower.includes("1 litre") ||
    nameLower.includes("1 ltr") ||
    nameLower.includes("1ltr")
  ) {
    return bottleTypes.find(
      (bt) => bt.name.toLowerCase().includes("1l") || bt.volume_ml === 1000
    );
  }
  
  if (
    nameLower.includes("500") ||
    nameLower.includes("half") ||
    nameLower.includes("500ml") ||
    nameLower.includes("500g")
  ) {
    if (nameLower.includes("glass") || nameLower.includes("curd")) {
      return bottleTypes.find(
        (bt) =>
          bt.name.toLowerCase().includes("500ml glass") ||
          (bt.name.toLowerCase().includes("glass") && bt.volume_ml === 500)
      );
    }
    if (nameLower.includes("pet") || nameLower.includes("standard")) {
      return bottleTypes.find(
        (bt) =>
          bt.name.toLowerCase().includes("pet") ||
          (bt.name.toLowerCase().includes("pet") && bt.volume_ml === 500)
      );
    }
    return bottleTypes.find((bt) => bt.volume_ml === 500);
  }
  
  return null;
};

export function FinalizeDeliveryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<any>();
  if (__DEV__) {
    console.log("[FinalizeDeliveryScreen] Received Params:", params);
  }
  const stopId = params.stopId || params.stop_id;
  const orderId = params.orderId || params.order_id;

  const storeRoute = useGeofenceStore((s) => s.route);
  const stops = storeRoute?.stops || [];
  const stop = stops.find((s) => s.order === orderId || s.id === stopId);

  const resolvedCustomerName =
    params.customerName ||
    params.customer_name ||
    params.customer ||
    stop?.customer_name ||
    "N/A";

  const todayDateStr = new Date().toISOString().split("T")[0];
  const resolvedDate =
    params.deliveryDate ||
    params.delivery_date ||
    params.date ||
    storeRoute?.delivery_date ||
    todayDateStr;

  const { domain_name } = useAuthStore((s) => s);

  const [bottleTypes, setBottleTypes] = useState<any[]>([]);
  const [deliveryTransactions, setDeliveryTransactions] = useState<
    Record<string, { issued: number; returned: number; broken: number }>
  >({});
  const [isLoadingBottleTypes, setIsLoadingBottleTypes] = useState(true);
  const [showBrokenColumn, setShowBrokenColumn] = useState(false);

  // Fetch admin setting for broken bottle tracking
  useEffect(() => {
    async function fetchDriverSettings() {
      if (!domain_name) return;
      try {
        const url = buildUrl(domain_name, "/api/erp/administration/config/driver-settings/");
        const res: any = await httpClient.get(url);
        setShowBrokenColumn(!!res?.charge_bottle_penalty);
      } catch (err) {
        console.error("Failed to load driver settings:", err);
        // Default to hidden if we can't fetch the setting
        setShowBrokenColumn(false);
      }
    }
    fetchDriverSettings();
  }, [domain_name]);

  useEffect(() => {
    async function fetchBottleTypes() {
      if (!domain_name) return;
      try {
        const url = buildUrl(domain_name, "/api/erp/inventory/bottle-types/");
        const res: any = await httpClient.get(url);
        const activeTypes = Array.isArray(res) ? res.filter((bt: any) => bt.is_active) : [];
        setBottleTypes(activeTypes);

        // Initialize state
        const initialCounts: Record<string, { issued: number; returned: number; broken: number }> = {};
        activeTypes.forEach((bt: any) => {
          initialCounts[bt.id] = { issued: 0, returned: 0, broken: 0 };
        });

        // Match with stop's product list
        if (stop?.product_list) {
          stop.product_list.forEach((item: any) => {
            const bt = matchProductToBottleType(item.product_name, activeTypes);
            if (bt && initialCounts[bt.id]) {
              initialCounts[bt.id].issued += item.quantity;
              initialCounts[bt.id].returned += item.quantity;
            }
          });
        } else {
          // If no product list, fallback to 1st bottle type with defaults
          if (activeTypes.length > 0) {
            const firstId = activeTypes[0].id;
            initialCounts[firstId].issued = 1;
            initialCounts[firstId].returned = 2;
          }
        }

        setDeliveryTransactions(initialCounts);
      } catch (err) {
        console.error("Failed to load bottle types:", err);
      } finally {
        setIsLoadingBottleTypes(false);
      }
    }
    fetchBottleTypes();
  }, [domain_name, stop]);

  const { mutateAsync: submitDelivery, isPending: isSubmitting } =
    useSubmitDelivery();

  const handleSubmit = async () => {
    if (!domain_name || !orderId) {
      Alert.alert("Error", "Missing city or order id");
      return;
    }

    const txnsPayload = Object.entries(deliveryTransactions)
      .map(([btId, counts]) => ({
        bottle_type_id: btId,
        issued: counts.issued,
        returned: counts.returned,
        broken: counts.broken,
      }))
      .filter((t) => t.issued > 0 || t.returned > 0 || t.broken > 0);

    const totalIssued = txnsPayload.reduce((sum, t) => sum + t.issued, 0);
    const totalReturned = txnsPayload.reduce((sum, t) => sum + t.returned, 0);

    try {
      const result = await submitDelivery({
        domainName: domain_name,
        orderId,
        payload: {
          bottles_issued: totalIssued,
          bottles_returned: totalReturned,
          bottle_transactions: txnsPayload,
        } as any,
      });

      if (!result) return;
      if (__DEV__) console.log("Delivery submission result", result);
      if (typeof orderId !== "string" || !orderId.trim()) {
        Alert.alert("Error", "Invalid order id");
        return;
      }

      const store = useGeofenceStore.getState();
      store.markStopDelivered(orderId);
      store.setActiveStopId(null);
      router.back();
    } catch {
      // handled in hook
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-screen">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="mb-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-bg-card"
          >
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>

          <Text variant="heading" weight="bold" color="primary">
            Finalize Delivery
          </Text>

          <View className="h-11 w-11" />
        </View>

        <View className="rounded-card border border-border-default bg-bg-card p-4">
          <Text variant="label" color="muted">
            Customer Name
          </Text>
          <Text
            variant="body"
            weight="semibold"
            color="primary"
            className="mt-1 text-lg"
          >
            {resolvedCustomerName}
          </Text>

          <Text variant="label" color="muted" className="mt-4">
            Delivery Date
          </Text>
          <Text variant="body" color="primary" className="mt-1">
            {resolvedDate}
          </Text>
        </View>

        <View className="mt-4 rounded-card border border-border-default bg-bg-card p-4">
          <Text variant="body-lg" weight="bold" color="primary">
            Delivery Details
          </Text>
          <Text variant="body-sm" color="muted" className="mt-2">
            {showBrokenColumn
              ? "Confirm the quantity of issued, returned, and broken bottles for each bottle type:"
              : "Confirm the quantity of issued and returned bottles for each bottle type:"}
          </Text>
        </View>

        {isLoadingBottleTypes ? (
          <View className="mt-4 items-center justify-center p-8 bg-bg-card border border-border-default rounded-card">
            <ActivityIndicator size="small" color="#1B5E37" />
            <Text variant="body-sm" color="muted" className="mt-2">
              Loading bottle types...
            </Text>
          </View>
        ) : (
          bottleTypes.map((bt) => {
            const tx = deliveryTransactions[bt.id] || { issued: 0, returned: 0, broken: 0 };
            return (
              <View key={bt.id} className="mt-4 rounded-card border border-border-default bg-bg-card p-4">
                <View className="flex-row items-center justify-between border-b border-border-default pb-2">
                  <Text variant="body" weight="bold" color="primary">
                    {bt.name}
                  </Text>
                  <Text variant="caption" color="muted">
                    {bt.volume_ml}ml
                  </Text>
                </View>

                {/* Counter controls */}
                <View className="mt-3 flex-row justify-between gap-x-2">
                  {/* Issued */}
                  <View className="flex-1 items-center bg-bg-screen border border-border-default rounded-xl p-2">
                    <Text variant="caption" weight="semibold" color="muted" className="mb-1 text-[10px] uppercase">
                      Issued
                    </Text>
                    <View className="flex-row items-center justify-between w-full px-1">
                      <TouchableOpacity
                        onPress={() => {
                          setDeliveryTransactions(prev => ({
                            ...prev,
                            [bt.id]: { ...prev[bt.id], issued: Math.max(0, prev[bt.id].issued - 1) }
                          }));
                        }}
                        className="w-7 h-7 rounded-full bg-bg-card border border-border-default items-center justify-center"
                      >
                        <Ionicons name="remove" size={14} color="#1A1A1A" />
                      </TouchableOpacity>
                      <Text variant="body" weight="bold" color="primary">
                        {tx.issued}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setDeliveryTransactions(prev => ({
                            ...prev,
                            [bt.id]: { ...prev[bt.id], issued: prev[bt.id].issued + 1 }
                          }));
                        }}
                        className="w-7 h-7 rounded-full bg-bg-card border border-border-default items-center justify-center"
                      >
                        <Ionicons name="add" size={14} color="#1A1A1A" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Returned */}
                  <View className="flex-1 items-center bg-bg-screen border border-border-default rounded-xl p-2">
                    <Text variant="caption" weight="semibold" color="muted" className="mb-1 text-[10px] uppercase">
                      Returned
                    </Text>
                    <View className="flex-row items-center justify-between w-full px-1">
                      <TouchableOpacity
                        onPress={() => {
                          setDeliveryTransactions(prev => ({
                            ...prev,
                            [bt.id]: { ...prev[bt.id], returned: Math.max(0, prev[bt.id].returned - 1) }
                          }));
                        }}
                        className="w-7 h-7 rounded-full bg-bg-card border border-border-default items-center justify-center"
                      >
                        <Ionicons name="remove" size={14} color="#1A1A1A" />
                      </TouchableOpacity>
                      <Text variant="body" weight="bold" color="primary">
                        {tx.returned}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setDeliveryTransactions(prev => ({
                            ...prev,
                            [bt.id]: { ...prev[bt.id], returned: prev[bt.id].returned + 1 }
                          }));
                        }}
                        className="w-7 h-7 rounded-full bg-bg-card border border-border-default items-center justify-center"
                      >
                        <Ionicons name="add" size={14} color="#1A1A1A" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Broken — only shown if charge_bottle_penalty is enabled */}
                  {showBrokenColumn && (
                  <View className="flex-1 items-center bg-bg-screen border border-border-default rounded-xl p-2">
                    <Text variant="caption" weight="semibold" color="muted" className="mb-1 text-[10px] uppercase">
                      Broken
                    </Text>
                    <View className="flex-row items-center justify-between w-full px-1">
                      <TouchableOpacity
                        onPress={() => {
                          setDeliveryTransactions(prev => ({
                            ...prev,
                            [bt.id]: { ...prev[bt.id], broken: Math.max(0, prev[bt.id].broken - 1) }
                          }));
                        }}
                        className="w-7 h-7 rounded-full bg-bg-card border border-border-default items-center justify-center"
                      >
                        <Ionicons name="remove" size={14} color="#1A1A1A" />
                      </TouchableOpacity>
                      <Text variant="body" weight="bold" color="primary">
                        {tx.broken}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setDeliveryTransactions(prev => ({
                            ...prev,
                            [bt.id]: { ...prev[bt.id], broken: prev[bt.id].broken + 1 }
                          }));
                        }}
                        className="w-7 h-7 rounded-full bg-bg-card border border-border-default items-center justify-center"
                      >
                        <Ionicons name="add" size={14} color="#1A1A1A" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  )}
                </View>
              </View>
            );
          })
        )}

        <View className="mt-6 gap-y-3">
          <Button
            label={isSubmitting ? "Submitting..." : "Finalize Delivery"}
            intent="primary"
            size="lg"
            fullWidth
            disabled={isSubmitting}
            onPress={handleSubmit}
          />
          <Button
            label="Mark as Undelivered"
            intent="outline"
            size="lg"
            fullWidth
            disabled={isSubmitting}
            onPress={() => {
              router.push({
                pathname: "/(driver)/capture-pod",
                params: { orderId }
              });
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

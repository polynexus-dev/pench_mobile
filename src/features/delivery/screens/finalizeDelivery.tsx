import React, { useMemo, useState } from "react";
import {
    ScrollView,
    View,
    TouchableOpacity,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/shared/ui/Button/Button";
import { Text } from "@/shared/ui/Text/Text";
import { useAuthStore } from "@/store/authStore";
import { useGeofenceStore } from "@/store/geofenceStore";
import { useSubmitDelivery } from "../hooks/useSubmitDelivery";

export function FinalizeDeliveryScreen() {
    const router = useRouter();
    const { orderId, customerName, deliveryDate } = useLocalSearchParams<{
        orderId: string;
        customerName?: string;
        deliveryDate?: string;
    }>();

    const { domain_name } = useAuthStore((s) => s);
    const route = useGeofenceStore((s) => s.route);
    const { markStopDelivered } = useGeofenceStore((s) => s);
    const advanceNavigation = useGeofenceStore((s) => s.advanceNavigation);

    const [issued, setIssued] = useState("0");
    const [returned, setReturned] = useState("0");
    const { mutateAsync: submitDelivery, isPending: isSubmitting } = useSubmitDelivery();

    const currentStop = useMemo(() => {
        if (!route?.stops?.length || !orderId) return null;
        return route.stops.find((s) => s.order === orderId) ?? null;
    }, [route?.stops, orderId]);

    React.useEffect(() => {
        if (currentStop) {
            const deliverTotal = currentStop.bottles_to_deliver?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0;
            const takeBackTotal = currentStop.bottles_to_take_back?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0;
            setIssued(String(deliverTotal));
            setReturned(String(takeBackTotal));
        }
    }, [currentStop]);

    const resolvedCustomerName =
        customerName || currentStop?.customer_name || "Customer";

    const resolvedDate =
        deliveryDate || route?.delivery_date || new Date().toISOString().split("T")[0];

    const resolvedItems =
        currentStop?.product_list ??
        currentStop?.subscription_details?.items ??
        [];

    const totalAmount =
        currentStop?.order_total ??
        resolvedItems.reduce((sum: number, item: any) => {
            const price = Number(item.unit_price ?? item.line_total ?? 0);
            const qty = Number(item.quantity ?? 0);
            return sum + price * qty;
        }, 0);

    const initials = resolvedCustomerName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const handleSubmit = async () => {
        if (!domain_name || !orderId) {
            Alert.alert("Error", "Missing city or order id");
            return;
        }

        try {
            await submitDelivery({
                domainName: domain_name,
                orderId,
                payload: {
                    bottles_issued: Number(issued),
                    bottles_returned: Number(returned),
                },
            });
            markStopDelivered(orderId);
            advanceNavigation(); // June 1 ← already called inside markStopDelivered, but safe if called again
            router.back();
        } catch {
            // handled in hook
        }
    };

    const increment = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => setter(String(Number(value || 0) + 1));

    const decrement = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => setter(String(Math.max(0, Number(value || 0) - 1)));

    return (
        <SafeAreaView className="flex-1 bg-bg-screen">
            {/* ── Top Bar ─────────────────────────────────────────────── */}
            <View className="px-5 pt-4 pb-3 flex-row items-center justify-between border-b border-border-default/45 bg-bg-card">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="h-10 w-10 items-center justify-center rounded-full bg-bg-screen border border-border-default/30 active:bg-gray-100"
                >
                    <Ionicons name="chevron-back" size={20} color="#1A1A1A" />
                </TouchableOpacity>

                <Text variant="body-lg" weight="bold" color="primary">
                    Finalize Delivery
                </Text>

                <View className="h-10 w-10" />
            </View>

            <ScrollView 
                contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Customer Details Profile Card (Proximity Principle) ── */}
                <View className={`rounded-card border ${currentStop?.is_new_customer ? "border-brand-primary/20 bg-brand-light" : "border-border-default bg-bg-card"} p-5 mb-5`}>
                    <View className="flex-row items-center gap-x-4">
                        {/* Avatar initials circle */}
                        <View className="h-14 w-14 rounded-full bg-brand-primary/10 items-center justify-center">
                            <Text variant="body-lg" weight="bold" color="brand">
                                {initials || "C"}
                            </Text>
                        </View>

                        <View className="flex-1">
                            <View className="flex-row items-center gap-x-2 flex-wrap">
                                <Text variant="body-lg" weight="bold" color="primary">
                                    {resolvedCustomerName}
                                </Text>
                                {currentStop?.is_new_customer && (
                                    <View className="bg-brand-primary/10 rounded-full px-2.5 py-0.5">
                                        <Text variant="caption-sm" color="brand" weight="bold" className="uppercase text-[9px]">
                                            New Customer
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text variant="caption" color="muted" className="mt-1">
                                Order ID: #{orderId?.slice(-6).toUpperCase() ?? "N/A"}
                            </Text>
                        </View>
                    </View>

                    {/* Divider line */}
                    <View className="h-px bg-border-default/60 my-4" />

                    {/* Metadata items aligned horizontally */}
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text variant="caption-sm" color="muted" weight="bold" className="uppercase tracking-wider">
                                Delivery Date
                            </Text>
                            <View className="flex-row items-center gap-x-1.5 mt-1">
                                <Ionicons name="calendar-outline" size={14} color="#666" />
                                <Text variant="body-sm" weight="semibold" color="primary">
                                    {resolvedDate}
                                </Text>
                            </View>
                        </View>

                        <View className="items-end">
                            <Text variant="caption-sm" color="muted" weight="bold" className="uppercase tracking-wider">
                                Total Amount
                            </Text>
                            <Text variant="body-lg" weight="extrabold" color="brand" className="mt-0.5">
                                ₹{Number(totalAmount || 0).toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Order details (Products & Expected Containers) ───── */}
                <View className="rounded-card border border-border-default bg-bg-card p-5 mb-5">
                    <Text variant="body-sm" weight="bold" color="primary" className="mb-3 uppercase tracking-wider text-text-secondary">
                        Order Details
                    </Text>

                    {/* Products List */}
                    <View className="gap-y-3">
                        {resolvedItems.length > 0 ? (
                            resolvedItems.map((item: any, index: number) => (
                                <View
                                    key={String(item.id ?? index)}
                                    className="flex-row items-center justify-between py-2 border-b border-border-default/30 last:border-b-0"
                                >
                                    <View className="flex-1 pr-3">
                                        <Text variant="body-sm" weight="semibold" color="primary">
                                            {item.product_name}
                                        </Text>
                                        <Text variant="caption" color="muted" className="mt-0.5">
                                            Qty: {item.quantity} {item.unit ?? ""}
                                        </Text>
                                    </View>
                                    <Text variant="body-sm" weight="bold" color="primary">
                                        ₹{Number((item.unit_price ?? 0) * (item.quantity ?? 1)).toFixed(2)}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <View className="py-2">
                                <Text variant="body-sm" color="muted" align="center">
                                    No product details available for this order.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Expected Containers Section */}
                    {((currentStop?.bottles_to_deliver && currentStop.bottles_to_deliver.length > 0) ||
                      (currentStop?.bottles_to_take_back && currentStop.bottles_to_take_back.length > 0)) && (
                        <>
                            <View className="h-px bg-border-default/60 my-4" />
                            
                            <Text variant="caption-sm" color="muted" weight="bold" className="uppercase tracking-wider mb-3">
                                Expected Containers
                            </Text>

                            <View className="gap-y-2">
                                {currentStop?.bottles_to_deliver?.map((item, idx) => (
                                    <View key={`del-${idx}`} className="flex-row items-center justify-between bg-bg-screen rounded-xl px-3 py-2 border border-border-default/30">
                                        <View className="flex-row items-center gap-x-2">
                                            <Ionicons name="water-outline" size={16} color="#1B5E37" />
                                            <Text variant="caption" color="primary" weight="semibold">
                                                Deliver: {item.bottle_type_name}
                                            </Text>
                                        </View>
                                        <Text variant="caption" color="primary" weight="bold">
                                            Qty: {item.quantity}
                                        </Text>
                                    </View>
                                ))}

                                {currentStop?.bottles_to_take_back?.map((item, idx) => (
                                    <View key={`ret-${idx}`} className="flex-row items-center justify-between bg-bg-screen rounded-xl px-3 py-2 border border-border-default/30">
                                        <View className="flex-row items-center gap-x-2">
                                            <Ionicons name="return-down-back-outline" size={16} color="#D4872A" />
                                            <Text variant="caption" color="primary" weight="semibold">
                                                Collect: {item.bottle_type_name}
                                            </Text>
                                        </View>
                                        <Text variant="caption" color="primary" weight="bold">
                                            Qty: {item.quantity}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </View>

                {/* ── Bottles Logging Section ────────────────────────────── */}
                <View className="rounded-card border border-border-default bg-bg-card p-5 mb-6">
                    <Text variant="body-sm" weight="bold" color="primary" className="mb-1 uppercase tracking-wider text-text-secondary">
                        Log Bottle Transfer
                    </Text>
                    <Text variant="caption" color="muted" className="mb-4">
                        Adjust numbers to reflect actual quantities transferred:
                    </Text>

                    <View className="flex-row gap-x-4">
                        {/* Bottles Issued */}
                        <View className="flex-1 bg-bg-screen rounded-2xl p-4 border border-border-default/40 items-center justify-center">
                            <Text
                                variant="caption"
                                weight="bold"
                                color="muted"
                                className="mb-3 text-[10px] uppercase tracking-wider text-center"
                            >
                                Bottles Issued
                            </Text>

                            <View className="flex-row items-center justify-between w-full px-1">
                                <TouchableOpacity
                                    onPress={() => decrement(issued, setIssued)}
                                    className="h-9 w-9 items-center justify-center rounded-full border border-border-default bg-white shadow-sm active:bg-gray-50"
                                >
                                    <Ionicons name="remove" size={16} color="#1A1A1A" />
                                </TouchableOpacity>

                                <Text variant="body-lg" weight="extrabold" color="primary">
                                    {issued}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => increment(issued, setIssued)}
                                    className="h-9 w-9 items-center justify-center rounded-full border border-border-default bg-white shadow-sm active:bg-gray-50"
                                >
                                    <Ionicons name="add" size={16} color="#1A1A1A" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Bottles Returned */}
                        <View className="flex-1 bg-bg-screen rounded-2xl p-4 border border-border-default/40 items-center justify-center">
                            <Text
                                variant="caption"
                                weight="bold"
                                color="muted"
                                className="mb-3 text-[10px] uppercase tracking-wider text-center"
                            >
                                Bottles Returned
                            </Text>

                            <View className="flex-row items-center justify-between w-full px-1">
                                <TouchableOpacity
                                    onPress={() => decrement(returned, setReturned)}
                                    className="h-9 w-9 items-center justify-center rounded-full border border-border-default bg-white shadow-sm active:bg-gray-50"
                                >
                                    <Ionicons name="remove" size={16} color="#1A1A1A" />
                                </TouchableOpacity>

                                <Text variant="body-lg" weight="extrabold" color="primary">
                                    {returned}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => increment(returned, setReturned)}
                                    className="h-9 w-9 items-center justify-center rounded-full border border-border-default bg-white shadow-sm active:bg-gray-50"
                                >
                                    <Ionicons name="add" size={16} color="#1A1A1A" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Actions ─────────────────────────────────────────────── */}
                <View className="gap-y-3">
                    <Button
                        label={isSubmitting ? "Submitting..." : "Finalize Delivery"}
                        intent="primary"
                        size="xl"
                        fullWidth
                        disabled={isSubmitting}
                        onPress={handleSubmit}
                        rightIcon={<Ionicons name="checkmark-circle-outline" size={20} color="white" />}
                    />
                    <Button
                        label="Mark as Undelivered"
                        intent="outline"
                        size="xl"
                        fullWidth
                        disabled={isSubmitting}
                        onPress={() => {
                            router.push({
                                pathname: "/(driver)/capture-pod",
                                params: { orderId },
                            } as any);
                        }}
                        rightIcon={<Ionicons name="close-circle-outline" size={20} color="#1B5E37" />}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
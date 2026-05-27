import React, { useMemo, useState } from "react";
import {
    ScrollView,
    View,
    TouchableOpacity,
    TextInput,
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

    const [issued, setIssued] = useState("0");
    const [returned, setReturned] = useState("0");
    const { mutateAsync: submitDelivery, isPending: isSubmitting } =
        useSubmitDelivery();

    const currentStop = useMemo(() => {
        if (!route?.stops?.length || !orderId) return null;
        return route.stops.find((s) => s.order === orderId) ?? null;
    }, [route?.stops, orderId]);

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

                    <Text variant="label" color="muted" className="mt-4">
                        Total Amount
                    </Text>
                    <Text variant="body" color="primary" className="mt-1">
                        ₹{Number(totalAmount || 0).toFixed(2)}
                    </Text>
                </View>

                <View className="mt-4 rounded-card border border-border-default bg-bg-card p-4">
                    <Text variant="body-lg" weight="bold" color="primary">
                        Delivery Details
                    </Text>
                    <Text variant="body-sm" color="muted" className="mt-2">
                        Confirm the items and bottle counts below:
                    </Text>
                </View>

                <View className="mt-4 rounded-card border border-border-default bg-bg-card p-4">
                    <Text variant="body-lg" weight="bold" color="primary">
                        Product Listing
                    </Text>

                    <View className="mt-4 gap-y-3">
                        {resolvedItems.length > 0 ? (
                            resolvedItems.map((item: any, index: number) => (
                                <View
                                    key={String(item.id ?? index)}
                                    className="rounded-xl border border-border-default bg-white p-3"
                                >
                                    <View className="flex-row items-start justify-between">
                                        <View className="flex-1 pr-3">
                                            <Text variant="body" weight="semibold" color="primary">
                                                {item.product_name}
                                            </Text>
                                            <Text variant="body-sm" color="muted" className="mt-1">
                                                Qty: {item.quantity} {item.unit ?? ""}
                                            </Text>
                                        </View>

                                        <Text variant="body" weight="bold" color="primary">
                                            ₹{Number((item.unit_price ?? 0) * (item.quantity ?? 1)).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View className="rounded-xl border border-dashed border-border-default bg-white p-4">
                                <Text variant="body-sm" color="muted">
                                    No product details available for this order.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View className="mt-4 rounded-card border border-border-default bg-bg-card p-4">
                    <View className="flex-row gap-x-2">
                        <View className="flex-1 rounded-xl border border-border-default bg-bg-screen p-3">
                            <Text
                                variant="caption"
                                weight="semibold"
                                color="muted"
                                className="mb-2 text-[10px] uppercase text-center"
                            >
                               Bottles Issued
                            </Text>

                            <View className="flex-row items-center justify-between px-1">
                                <TouchableOpacity
                                    onPress={() => decrement(issued, setIssued)}
                                    className="h-8 w-8 items-center justify-center rounded-full border border-border-default bg-bg-card"
                                >
                                    <Ionicons name="remove" size={16} color="#1A1A1A" />
                                </TouchableOpacity>

                                <Text variant="body" weight="bold" color="primary">
                                    {issued}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => increment(issued, setIssued)}
                                    className="h-8 w-8 items-center justify-center rounded-full border border-border-default bg-bg-card"
                                >
                                    <Ionicons name="add" size={16} color="#1A1A1A" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="flex-1 rounded-xl border border-border-default bg-bg-screen p-3">
                            <Text
                                variant="caption"
                                weight="semibold"
                                color="muted"
                                className="mb-2 text-[10px] uppercase text-center"
                            >
                                Bottles Returned
                            </Text>

                            <View className="flex-row items-center justify-between px-1">
                                <TouchableOpacity
                                    onPress={() => decrement(returned, setReturned)}
                                    className="h-8 w-8 items-center justify-center rounded-full border border-border-default bg-bg-card"
                                >
                                    <Ionicons name="remove" size={16} color="#1A1A1A" />
                                </TouchableOpacity>

                                <Text variant="body" weight="bold" color="primary">
                                    {returned}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => increment(returned, setReturned)}
                                    className="h-8 w-8 items-center justify-center rounded-full border border-border-default bg-bg-card"
                                >
                                    <Ionicons name="add" size={16} color="#1A1A1A" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

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
                                params: { orderId },
                            } as any);
                        }}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
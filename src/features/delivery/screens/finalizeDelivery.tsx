import React, { useState } from "react";
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
import { httpClient } from "@services/api/httpClient";
import { useGeofenceStore } from "@/store/geofenceStore";

type SubmitDeliveryResponse = {
    id: string;
    customer: string;
    customer_name: string;
    status: string;
    status_display: string;
    scheduled_delivery_date: string;
    total: string;
    items: Array<{
        id: string;
        product: string;
        product_name: string;
        quantity: number;
        unit_price: string;
        line_total: number;
    }>;
    delivery_address: string;
    latitude: number;
    longitude: number;
    expires_in_seconds: number;
};

export function FinalizeDeliveryScreen() {
    const router = useRouter();
    const { routeId, stopId, orderId } = useLocalSearchParams<{
        routeId: string;
        stopId: string;
        orderId: string;
    }>();

    const { domain_name } = useAuthStore((s) => s);
    const [bottlesIssued, setBottlesIssued] = useState("1");
    const [bottlesReturned, setBottlesReturned] = useState("2");
    const [loading, setLoading] = useState(false);

    const submitDelivery = async () => {
        if (!domain_name || !orderId) {
            Alert.alert("Error", "Missing city or order id");
            return;
        }

        const issued = Number(bottlesIssued);
        const returned = Number(bottlesReturned);

        if (Number.isNaN(issued) || Number.isNaN(returned)) {
            Alert.alert("Invalid input", "Please enter valid bottle counts");
            return;
        }

        try {
            setLoading(true);

            const data = (await httpClient.post(
                // `http://${domain_name}:8888/api/erp/orders/driver/${orderId}/submit-delivery/`,
                `https://${domain_name}/api/erp/orders/driver/${orderId}/submit-delivery/`,
                {
                    bottles_returned: returned,
                    bottles_issued: issued,
                }
            )) as SubmitDeliveryResponse;

            useGeofenceStore.getState().markStopDelivered(orderId);
            Alert.alert("Success", `Delivery submitted for ${data.customer_name}`);
            router.back();
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const customerNotHome = () => {
        Alert.alert("Not at home", "You can add your logic here later.");
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
                        Route ID
                    </Text>
                    <Text variant="body" color="primary" className="mt-1">
                        {routeId}
                    </Text>

                    <Text variant="label" color="muted" className="mt-4">
                        Stop ID
                    </Text>
                    <Text variant="body" color="primary" className="mt-1">
                        {stopId}
                    </Text>

                    <Text variant="label" color="muted" className="mt-4">
                        Order ID
                    </Text>
                    <Text variant="body" color="primary" className="mt-1">
                        {orderId}
                    </Text>
                </View>

                <View className="mt-4 rounded-card border border-border-default bg-bg-card p-4">
                    <Text variant="body-lg" weight="bold" color="primary">
                        Delivery Details
                    </Text>
                    <Text variant="body-sm" color="muted" className="mt-2">
                        Add bottle counts and submit the delivery for the active stop.
                    </Text>
                </View>

                <View className="mt-4 rounded-card border border-border-default bg-bg-card p-4">
                    <Text variant="label" color="muted">
                        Bottles Issued
                    </Text>
                    <TextInput
                        value={bottlesIssued}
                        onChangeText={setBottlesIssued}
                        keyboardType="number-pad"
                        className="mt-2 rounded-xl border border-border-default bg-bg-input px-4 py-3 text-text-primary"
                        placeholder="e.g. 1"
                    />

                    <Text variant="label" color="muted" className="mt-4">
                        Bottles Returned
                    </Text>
                    <TextInput
                        value={bottlesReturned}
                        onChangeText={setBottlesReturned}
                        keyboardType="number-pad"
                        className="mt-2 rounded-xl border border-border-default bg-bg-input px-4 py-3 text-text-primary"
                        placeholder="e.g. 2"
                    />
                </View>

                <View className="mt-6 gap-y-3">
                    <Button
                        label={loading ? "Submitting..." : "Finalize Delivery"}
                        intent="primary"
                        size="lg"
                        fullWidth
                        disabled={loading}
                        onPress={submitDelivery}
                    />

                    <Button
                        label="Customer is Not at Home"
                        intent="secondary"
                        size="lg"
                        fullWidth
                        disabled={loading}
                        onPress={customerNotHome}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
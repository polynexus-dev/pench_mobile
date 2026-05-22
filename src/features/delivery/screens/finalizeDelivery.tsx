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
import { useGeofenceStore } from "@/store/geofenceStore";
import { useSubmitDelivery } from "../hooks/useSubmitDelivery";
import { ROUTES } from "@/constants/route";

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

    const { mutateAsync: submitDelivery, isPending: isSubmitting } =
        useSubmitDelivery();

    const handleSubmit = async () => {
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
            await submitDelivery({
                domainName: domain_name,
                orderId,
                payload: {
                    bottles_issued: issued,
                    bottles_returned: returned,
                },
            });

            // useGeofenceStore.getState().markStopDelivered(orderId);
            // router.back();
            const store = useGeofenceStore.getState();
            store.markStopDelivered(orderId);
            store.setActiveStopId(null);
            router.back();
        } catch {
            // handled in hook
        }
    };

    const customerNotHome = () => {
        if (!orderId || !routeId || !stopId) {
            Alert.alert("Error", "Missing route params");
            return;
        }

        router.push({
            pathname: ROUTES.DRIVER.CAPTURE_POD,
            params: {
                orderId,
                routeId,
                stopId,
            },
        } as any);
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
                        label={isSubmitting ? "Submitting..." : "Finalize Delivery"}
                        intent="primary"
                        size="lg"
                        fullWidth
                        disabled={isSubmitting}
                        onPress={handleSubmit}
                    />

                    <Button
                        label="Customer is Not at Home"
                        intent="secondary"
                        size="lg"
                        fullWidth
                        disabled={isSubmitting}
                        onPress={customerNotHome}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
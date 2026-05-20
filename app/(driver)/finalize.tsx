import React from "react";
import { ScrollView, View, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/shared/ui/Button/Button";
import { Text } from "@/shared/ui/Text/Text";

export default function FinalizeDeliveryScreen() {
    const router = useRouter();
    const { routeId, stopId, orderId } = useLocalSearchParams<{
        routeId: string;
        stopId: string;
        orderId: string;
    }>();

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

                    <Text className="text-heading text-text-primary" fontWeight="bold">
                        Finalize Delivery
                    </Text>

                    <View className="h-11 w-11" />
                </View>

                <View className="rounded-card border border-border-default bg-bg-card p-4">
                    <Text className="text-label text-text-muted">Route ID</Text>
                    <Text className="mt-1 text-body text-text-primary">{routeId}</Text>

                    <Text className="mt-4 text-label text-text-muted">Stop ID</Text>
                    <Text className="mt-1 text-body text-text-primary">{stopId}</Text>

                    <Text className="mt-4 text-label text-text-muted">Order ID</Text>
                    <Text className="mt-1 text-body text-text-primary">{orderId}</Text>
                </View>

                <View className="mt-4 rounded-card border border-border-default bg-bg-card p-4">
                    <Text className="text-body-lg text-text-primary" fontWeight="bold">
                        Delivery Details
                    </Text>
                    <Text className="mt-2 text-body-sm text-text-muted">
                        Add quantity delivered, empty bottles, broken bottles, cash/UPI details, and proof before final submit.
                    </Text>
                </View>

                <View className="mt-4 rounded-card border border-border-default bg-bg-card p-4">
                    <Text className="text-label text-text-muted">Delivered Quantity</Text>
                    <TextInput
                        className="mt-2 rounded-xl border border-border-default bg-bg-input px-4 py-3 text-text-primary"
                        placeholder="e.g. 2 Litres"
                    />

                    <Text className="mt-4 text-label text-text-muted">Empty Bottles</Text>
                    <TextInput
                        className="mt-2 rounded-xl border border-border-default bg-bg-input px-4 py-3 text-text-primary"
                        placeholder="e.g. 2"
                    />

                    <Text className="mt-4 text-label text-text-muted">Notes</Text>
                    <TextInput
                        className="mt-2 min-h-24 rounded-xl border border-border-default bg-bg-input px-4 py-3 text-text-primary"
                        placeholder="Delivery notes"
                        multiline
                    />
                </View>

                <View className="mt-6">
                    <Button
                        label="Finalize Delivery"
                        intent="primary"
                        size="lg"
                        fullWidth
                        onPress={() => console.log("final submit")}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
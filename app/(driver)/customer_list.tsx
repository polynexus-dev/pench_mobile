import React, { useMemo } from "react";
import { View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useGeofenceStore } from "@store/geofenceStore";
import { Text } from "@/shared/ui/Text/Text";
import { ScrollView } from "react-native-gesture-handler";

type RouteStop = {
    id: string;
    sequence_number: number;
    order: string | null;
    customer_name: string;
    address: string;
    latitude: number;
    longitude: number;
    order_status?: "in_transit" | "delivered" | "cancelled" | "undelivered" | string;
};

type GroupedStop = {
    groupKey: string;
    address: string;
    stops: RouteStop[];
};

const getLocationKey = (lat: number, lng: number) =>
    `${lat.toFixed(5)}_${lng.toFixed(5)}`;

export default function CustomerListScreen() {
    const router = useRouter();
    const route = useGeofenceStore((s) => s.route);

    const groupedStops = useMemo(() => {
        const visibleStops = (route?.stops ?? []).filter(
            (stop) => stop.order_status === "in_transit" || stop.order_status === "delivered"
        ) as RouteStop[];

        const groups = new Map<string, GroupedStop>();

        for (const stop of visibleStops) {
            const key = getLocationKey(stop.latitude, stop.longitude);
            const existing = groups.get(key);

            if (!existing) {
                groups.set(key, {
                    groupKey: key,
                    address: stop.address,
                    stops: [stop],
                });
            } else {
                existing.stops.push(stop);
            }
        }

        return Array.from(groups.values()).sort(
            (a, b) => a.stops[0].sequence_number - b.stops[0].sequence_number
        );
    }, [route?.stops]);

    return (
        <SafeAreaView className="flex-1 bg-bg-screen">
            <ScrollView>

                <View className="flex-row items-center justify-between px-4 py-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="h-11 w-11 items-center justify-center rounded-full bg-bg-card"
                    >
                        <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
                    </TouchableOpacity>

                    <Text variant="heading" weight="bold" color="primary">
                        All Customers
                    </Text>

                    <View className="h-11 w-11" />
                </View>

                <View className="flex-1 px-4 pb-4">
                    {groupedStops.length === 0 ? (
                        <View className="rounded-3xl border border-border-default bg-bg-card p-4">
                            <Text variant="body" color="muted">
                                No customers found
                            </Text>
                        </View>
                    ) : (
                        groupedStops.map((group) => (
                            <View
                                key={group.groupKey}
                                className="mb-3 rounded-3xl border border-border-default bg-bg-card p-4"
                            >
                                <Text variant="body" weight="semibold" color="primary">
                                    {group.address}
                                </Text>

                                <Text variant="body-sm" color="muted" className="mt-1">
                                    {group.stops.length} customer{group.stops.length > 1 ? "s" : ""} at this location
                                </Text>

                                <View className="mt-3 gap-y-2">
                                    {group.stops.map((stop) => (
                                        <View
                                            key={stop.id}
                                            className="rounded-2xl bg-bg-input px-3 py-3"
                                        >
                                            <Text variant="body-sm" weight="semibold" color="primary">
                                                {stop.sequence_number}. {stop.customer_name}
                                            </Text>
                                            <Text variant="caption" color="muted" className="mt-1">
                                                {stop.order_status}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
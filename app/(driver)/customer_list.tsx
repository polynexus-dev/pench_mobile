import React, { useMemo, useState } from "react";
import { View, TouchableOpacity, TextInput, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useGeofenceStore } from "@store/geofenceStore";
import { Text } from "@/shared/ui/Text/Text";

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

const CARD_SHADOW = Platform.select({
    ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
    },
    android: {
        elevation: 2,
    },
});

export default function CustomerListScreen() {
    const router = useRouter();
    const route = useGeofenceStore((s) => s.route);
    const [searchQuery, setSearchQuery] = useState("");

    // Calculate overall route stats
    const stats = useMemo(() => {
        const stops = route?.stops ?? [];
        const total = stops.length;
        const completed = stops.filter(
            (stop) => stop.order_status === "delivered"
        ).length;
        const undelivered = stops.filter(
            (stop) => stop.order_status === "undelivered"
        ).length;
        const pending = stops.filter(
            (stop) =>
                stop.order_status === "in_transit" ||
                stop.order_status === "pending" ||
                stop.order_status === "in_progress"
        ).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, pending, undelivered, percent };
    }, [route?.stops]);

    // Group stops by coordinates and filter by search query
    const groupedStops = useMemo(() => {
        const visibleStops = (route?.stops ?? []) as RouteStop[];

        const filteredStops = visibleStops.filter(
            (stop) =>
                stop.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                stop.address.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const groups = new Map<string, GroupedStop>();

        for (const stop of filteredStops) {
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
    }, [route?.stops, searchQuery]);

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
                    {/* Stats Breakdown Row */}
                    {stats.total > 0 && (
                        <View className="mb-4 rounded-3xl border border-border-default bg-bg-card p-4">
                            <View className="flex-row justify-between border-t border-border-default pt-2.5">
                                <View className="items-center flex-1">
                                    <View className="flex-row items-center">
                                        <Ionicons name="checkmark-circle" size={14} color="#1B5E37" />
                                        <Text
                                            variant="caption"
                                            weight="semibold"
                                            color="muted"
                                            className="ml-1 text-[10px]"
                                        >
                                            Delivered
                                        </Text>
                                    </View>
                                    <Text
                                        variant="body"
                                        weight="bold"
                                        color="primary"
                                        className="mt-0.5"
                                    >
                                        {stats.completed}
                                    </Text>
                                </View>

                                <View className="h-8 w-[1px] bg-border-default align-self-center" />

                                <View className="items-center flex-1">
                                    <View className="flex-row items-center">
                                        <Ionicons name="close-circle" size={14} color="#E53935" />
                                        <Text
                                            variant="caption"
                                            weight="semibold"
                                            color="muted"
                                            className="ml-1 text-[10px]"
                                        >
                                            Undelivered
                                        </Text>
                                    </View>
                                    <Text
                                        variant="body"
                                        weight="bold"
                                        color="primary"
                                        className="mt-0.5"
                                    >
                                        {stats.undelivered}
                                    </Text>
                                </View>

                                <View className="h-8 w-[1px] bg-border-default align-self-center" />

                                <View className="items-center flex-1">
                                    <View className="flex-row items-center">
                                        <Ionicons name="time" size={14} color="#D4872A" />
                                        <Text
                                            variant="caption"
                                            weight="semibold"
                                            color="muted"
                                            className="ml-1 text-[10px]"
                                        >
                                            Pending
                                        </Text>
                                    </View>
                                    <Text
                                        variant="body"
                                        weight="bold"
                                        color="primary"
                                        className="mt-0.5"
                                    >
                                        {stats.pending}
                                    </Text>
                                </View>

                                <View className="h-8 w-[1px] bg-border-default align-self-center" />

                                <View className="items-center flex-1">
                                    <View className="flex-row items-center">
                                        <Ionicons name="map" size={14} color="#4A4A4A" />
                                        <Text
                                            variant="caption"
                                            weight="semibold"
                                            color="muted"
                                            className="ml-1 text-[10px]"
                                        >
                                            Total
                                        </Text>
                                    </View>
                                    <Text
                                        variant="body"
                                        weight="bold"
                                        color="primary"
                                        className="mt-0.5"
                                    >
                                        {stats.total}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Search Bar */}
                    {stats.total > 0 && (
                        <View className="flex-row items-center bg-white rounded-input border border-border-default px-3 h-10 mb-3">
                            <Ionicons name="search" size={18} color="#9E9E9E" />
                            <TextInput
                                placeholder="Search customer or address..."
                                placeholderTextColor="#9E9E9E"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCorrect={false}
                                className="flex-1 ml-2 text-text-primary text-[14px] font-sans py-0"
                                style={{ textAlignVertical: "center" }}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => setSearchQuery("")}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="close-circle" size={18} color="#9E9E9E" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Grouped Location Cards */}
                    {groupedStops.length === 0 ? (
                        searchQuery.length > 0 ? (
                            /* Search Empty State */
                            <View
                                style={CARD_SHADOW}
                                className="rounded-card border border-border-default bg-white p-8 items-center justify-center mt-4"
                            >
                                <View className="h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
                                    <Ionicons name="search-outline" size={26} color="#9E9E9E" />
                                </View>
                                <Text variant="body" weight="bold" color="primary" align="center">
                                    No Results Found
                                </Text>
                            </View>
                        ) : (
                            <View className="rounded-3xl border border-border-default bg-bg-card p-4">
                                <Text variant="body" color="muted">
                                    No customers found
                                </Text>
                            </View>
                        )
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

                                {/* Customer Stops */}
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
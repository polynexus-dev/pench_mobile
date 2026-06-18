import React, { useMemo, useState } from "react";
import {
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Platform,
    Linking,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useGeofenceStore } from "@store/geofenceStore";
import { Text } from "@/shared/ui/Text/Text";
import { Button } from "@/shared/ui";

type RouteStop = {
    id: string;
    sequence_number: number;
    order: string | null;
    customer_name: string;
    address: string;
    latitude: number;
    longitude: number;
    customer_phone?: string;
    order_status?:
    | "in_transit"
    | "delivered"
    | "cancelled"
    | "undelivered"
    | string;
};

type GroupedStop = {
    groupKey: string;
    address: string;
    stops: RouteStop[];
};

const getLocationKey = (lat: number | null | undefined, lng: number | null | undefined) => {
    if (lat === null || lat === undefined || isNaN(Number(lat)) ||
        lng === null || lng === undefined || isNaN(Number(lng))) {
        return "0_0";
    }
    return `${Number(lat).toFixed(5)}_${Number(lng).toFixed(5)}`;
};

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
            (stop) => stop.order_status === "delivered",
        ).length;
        const pending = stops.filter(
            (stop) => stop.order_status === "in_transit",
        ).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, pending, percent };
    }, [route?.stops]);

    // Group stops by coordinates and filter by search query
    const groupedStops = useMemo(() => {
        const visibleStops = (route?.stops ?? []).filter(
            (stop) =>
                stop.order_status === "in_transit" || stop.order_status === "delivered",
        ) as RouteStop[];

        const filteredStops = visibleStops.filter(
            (stop) =>
                stop.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                stop.address.toLowerCase().includes(searchQuery.toLowerCase()),
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
            (a, b) => a.stops[0].sequence_number - b.stops[0].sequence_number,
        );
    }, [route?.stops, searchQuery]);

    return (
        <SafeAreaView className="flex-1 bg-bg-screen" edges={["top", "bottom"]}>
            {/* Header Section */}
            <View className="flex-row items-center justify-between px-4 py-2.5 bg-bg-screen">
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                    className="h-11 w-11 items-center justify-center rounded-full bg-white border border-border-default shadow-sm"
                >
                    <Ionicons name="chevron-back" size={20} color="#1A1A1A" />
                </TouchableOpacity>

                <Text variant="title" weight="bold" color="primary">
                    All Customers
                </Text>

                <View className="h-11 w-11" />
            </View>

            <ScrollView
                className="flex-1 px-4"
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Stats Dashboard Card */}
                {stats.total > 0 && (
                    <View
                        style={CARD_SHADOW}
                        className="mb-3 rounded-card border border-border-default bg-white p-4"
                    >
                        <View className="flex-row items-center justify-between mb-2.5">
                            <View>
                                <Text
                                    variant="caption"
                                    transform="uppercase"
                                    color="muted"
                                    weight="bold"
                                >
                                    Trip Progress
                                </Text>
                                <Text
                                    variant="heading"
                                    weight="bold"
                                    color="brand"
                                    className="mt-0.5"
                                >
                                    {stats.completed} / {stats.total} Stops
                                </Text>
                            </View>
                            <View className="rounded-badge bg-brand-light px-3 py-1">
                                <Text variant="body-sm" weight="bold" color="brand">
                                    {stats.percent}% Done
                                </Text>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View className="h-2 w-full rounded-full bg-bg-input overflow-hidden mb-3">
                            <View
                                className="h-full rounded-full bg-brand-primary"
                                style={{ width: `${stats.percent}%` }}
                            />
                        </View>

                        {/* Stats Breakdown Row */}
                        <View className="flex-row justify-between border-t border-border-default pt-2.5">
                            <View className="items-center flex-1">
                                <View className="flex-row items-center">
                                    <Ionicons name="checkmark-circle" size={14} color="#1B5E37" />
                                    <Text
                                        variant="caption"
                                        weight="semibold"
                                        color="muted"
                                        className="ml-1"
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
                                    <Ionicons name="time" size={14} color="#D4872A" />
                                    <Text
                                        variant="caption"
                                        weight="semibold"
                                        color="muted"
                                        className="ml-1"
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
                                        className="ml-1"
                                    >
                                        Total Stops
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
                            <Text
                                variant="body-sm"
                                color="muted"
                                align="center"
                                className="mt-1 mb-5 px-4"
                            >
                                {`We couldn't find any customers or locations matching "${searchQuery}"`}
                            </Text>
                            <Button
                                label="Clear Search"
                                intent="secondary"
                                size="md"
                                onPress={() => setSearchQuery("")}
                            />
                        </View>
                    ) : (
                        /* Route Complete/No Customers Empty State */
                        <View
                            style={CARD_SHADOW}
                            className="rounded-card border border-border-default bg-white p-8 items-center justify-center mt-4"
                        >
                            <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-light mb-6">
                                <Ionicons name="people-outline" size={38} color="#1B5E37" />
                            </View>
                            <Text
                                variant="heading"
                                weight="bold"
                                color="primary"
                                align="center"
                            >
                                Route Complete!
                            </Text>
                            <Text
                                variant="body"
                                color="muted"
                                align="center"
                                className="mt-2 mb-6 px-4"
                            >
                                There are no pending or delivered customers on your assigned
                                route today.
                            </Text>
                            <Button
                                label="Back to Dashboard"
                                intent="primary"
                                fullWidth
                                size="lg"
                                onPress={() => router.replace("/(driver)/(tabs)/dashboard")}
                            />
                        </View>
                    )
                ) : (
                    groupedStops.map((group) => (
                        <View
                            key={group.groupKey}
                            style={CARD_SHADOW}
                            className="mb-3 rounded-card border border-border-default bg-white p-4"
                        >
                            {/* Customer Stops */}
                            <View className="gap-y-2">
                                {group.stops.map((stop) => {
                                    const isDelivered = stop.order_status === "delivered";
                                    const isPending = stop.order_status === "in_transit";

                                    return (
                                        <View
                                            key={stop.id}
                                            className="flex-row items-center justify-between rounded-xl bg-bg-input py-2 px-3"
                                        >
                                            <View className="flex-row items-center flex-1 pr-3">
                                                {/* Circular Sequence/Check Badge */}
                                                <View
                                                    className={`h-7 w-7 items-center justify-center rounded-full ${isDelivered ? "bg-success" : "bg-brand-light"
                                                        }`}
                                                    style={{ marginRight: 8 }}
                                                >
                                                    {isDelivered ? (
                                                        <Ionicons
                                                            name="checkmark"
                                                            size={13}
                                                            color="#FFFFFF"
                                                        />
                                                    ) : (
                                                        <Text variant="caption" weight="bold" color="brand">
                                                            {stop.sequence_number}
                                                        </Text>
                                                    )}
                                                </View>

                                                {/* Customer Metadata */}
                                                <View className="flex-1 flex-row items-center justify-between">
                                                    <Text
                                                        variant="body-sm"
                                                        weight="semibold"
                                                        color="primary"
                                                    >
                                                        {stop.customer_name}
                                                    </Text>
                                                    <View className="flex-row items-center gap-x-2">
                                                        {stop.customer_phone ? (
                                                            <TouchableOpacity
                                                                onPress={() => Linking.openURL(`tel:${stop.customer_phone}`)}
                                                                className="h-8 w-8 items-center justify-center rounded-full bg-[#E8F5EE]"
                                                            >
                                                                <Ionicons name="call" size={15} color="#1B5E37" />
                                                            </TouchableOpacity>
                                                        ) : null}
                                                        <TouchableOpacity
                                                            onPress={() => Alert.alert("Customer Address", stop.address || "No address added")}
                                                            className="h-8 w-8 items-center justify-center rounded-full bg-[#E8F5EE]"
                                                        >
                                                            <Ionicons name="information-circle" size={17} color="#1B5E37" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Status Badge & Chevron */}
                                            <View className="flex-row items-center">
                                                {isDelivered ? (
                                                    <View
                                                        className="rounded-badge bg-emerald-50 px-2 py-0.5"
                                                        style={{ marginRight: 6 }}
                                                    >
                                                        <Text
                                                            variant="caption-sm"
                                                            weight="semibold"
                                                            color="success"
                                                            className="text-[10px] capitalize"
                                                        >
                                                            Delivered
                                                        </Text>
                                                    </View>
                                                ) : isPending ? (
                                                    <View
                                                        className="rounded-badge bg-amber-50 px-2 py-0.5"
                                                        style={{ marginRight: 6 }}
                                                    >
                                                        <Text
                                                            variant="caption-sm"
                                                            weight="semibold"
                                                            color="warning"
                                                            className="text-[10px] capitalize"
                                                        >
                                                            Pending
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <View
                                                        className="rounded-badge bg-gray-100 px-2 py-0.5"
                                                        style={{ marginRight: 6 }}
                                                    >
                                                        <Text
                                                            variant="caption-sm"
                                                            weight="semibold"
                                                            color="muted"
                                                            className="text-[10px] capitalize"
                                                        >
                                                            {stop.order_status}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

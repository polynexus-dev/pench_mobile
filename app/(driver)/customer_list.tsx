import React, { useMemo, useState } from "react";
import {
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Platform,
    Linking,
    Alert,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useGeofenceStore } from "@store/geofenceStore";
import { Text } from "@/shared/ui/Text/Text";
import { Button } from "@/shared/ui";
import { useFetchMyRoute } from "@/features/map/hooks/useFetchMyRoute";
import { ROUTES } from "@/constants/route";

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
    const { isLoading: isRouteLoading } = useFetchMyRoute();
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
        const visibleStops = (route?.stops ?? []) as RouteStop[];

        const filteredStops = visibleStops.filter(
            (stop) =>
                stop.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                stop.address.toLowerCase().includes(searchQuery.toLowerCase()),
        );

        return [...filteredStops].sort((a, b) => a.sequence_number - b.sequence_number);
    }, [route?.stops, searchQuery]);

    if (isRouteLoading) {
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
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#1B5E37" />
                    <Text className="mt-3 text-text-secondary text-[15px] font-semibold" variant="body" weight="semibold">
                        Loading customer list...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

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
                        className="mb-4 rounded-[24px] border border-border-default bg-white p-5"
                    >
                        <View className="flex-row items-center justify-between mb-3">
                            <View>
                                <Text
                                    variant="caption"
                                    transform="uppercase"
                                    color="muted"
                                    weight="bold"
                                    className="tracking-wider"
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
                            <View className="rounded-full bg-brand-light px-3 py-1">
                                <Text variant="body-sm" weight="bold" color="brand">
                                    {stats.percent}% Done
                                </Text>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View className="h-2.5 w-full rounded-full bg-bg-input overflow-hidden mb-4">
                            <View
                                className="h-full rounded-full bg-brand-primary"
                                style={{ width: `${stats.percent}%` }}
                            />
                        </View>

                        {/* Stats Breakdown Row */}
                        <View className="flex-row justify-between border-t border-border-subtle pt-3.5">
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
                                    color="success"
                                    className="mt-0.5"
                                >
                                    {stats.completed}
                                </Text>
                            </View>

                            <View className="h-8 w-[1px] bg-border-subtle align-self-center" />

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
                                    color="warning"
                                    className="mt-0.5"
                                >
                                    {stats.pending}
                                </Text>
                            </View>

                            <View className="h-8 w-[1px] bg-border-subtle align-self-center" />

                            <View className="items-center flex-1">
                                <View className="flex-row items-center">
                                    <Ionicons name="map" size={14} color="#757575" />
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
                    <View className="flex-row items-center bg-white rounded-2xl border border-border-default px-3.5 h-11 mb-4 shadow-xs">
                        <Ionicons name="search" size={18} color="#757575" />
                        <TextInput
                            placeholder="Search customer or address..."
                            placeholderTextColor="#757575"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCorrect={false}
                            className="flex-1 ml-2 text-text-primary text-[14px] font-sans py-0 text-body"
                            style={{ textAlignVertical: "center" }}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setSearchQuery("")}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close-circle" size={18} color="#757575" />
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
                            className="rounded-[24px] border border-border-default bg-white p-8 items-center justify-center mt-4"
                        >
                            <View className="h-14 w-14 items-center justify-center rounded-full bg-neutral-100 mb-4">
                                <Ionicons name="search-outline" size={26} color="#757575" />
                            </View>
                            <Text variant="body" weight="bold" color="primary" align="center">
                                No Results Found
                            </Text>
                            <Text
                                variant="body-sm"
                                color="muted"
                                align="center"
                                className="mt-2 mb-5 px-4"
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
                            className="rounded-[24px] border border-border-default bg-white p-8 items-center justify-center mt-4"
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
                    groupedStops.map((stop) => {
                        const isDelivered = stop.order_status === "delivered";
                        const isPending = stop.order_status === "in_transit" || stop.order_status === "pending";

                        // If pending, make it yellow. If completed/other, make it green.
                        const bgClass = isPending ? "bg-[#FEFCE8]" : "bg-[#E8F5EE]";
                        const borderClass = isPending ? "border-[#FEF9C3]" : "border-[#C2E0CC]";

                        return (
                            <View
                                key={stop.id}
                                style={CARD_SHADOW}
                                className={`mb-3.5 rounded-[20px] border ${borderClass} ${bgClass} p-4 flex-row items-start gap-x-3.5`}
                            >
                                {/* Left side: Sequence/Check Badge */}
                                <View
                                    className={`h-9 w-9 items-center justify-center rounded-full shadow-xs ${
                                        isDelivered ? "bg-success" : "bg-white"
                                    }`}
                                >
                                    {isDelivered ? (
                                        <Ionicons
                                            name="checkmark"
                                            size={16}
                                            color="#FFFFFF"
                                        />
                                    ) : (
                                        <Text variant="body" weight="bold" color="brand">
                                            {stop.sequence_number}
                                        </Text>
                                    )}
                                </View>

                                {/* Details side */}
                                <View className="flex-1">
                                    {/* Top Row: Customer Name & Status Badge */}
                                    <View className="flex-row items-center justify-between mb-1.5">
                                        <Text
                                            variant="body"
                                            weight="bold"
                                            color="primary"
                                            className="flex-1 pr-2"
                                            lines={1}
                                        >
                                            {stop.customer_name}
                                        </Text>

                                        <View
                                            className={`rounded-full px-2.5 py-0.5 border ${
                                                isDelivered
                                                    ? "bg-white/95 border-success/20"
                                                    : isPending
                                                    ? "bg-white/95 border-warning/20"
                                                    : "bg-white/95 border-border-default"
                                            }`}
                                        >
                                            <Text
                                                variant="caption-sm"
                                                weight="bold"
                                                color={isDelivered ? "success" : isPending ? "warning" : "muted"}
                                                transform="capitalize"
                                                className="text-[10px]"
                                            >
                                                {isDelivered ? "Delivered" : isPending ? "Pending" : stop.order_status}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Middle Row: Address */}
                                    <View className="flex-row items-start gap-x-1.5 mb-3.5">
                                        <Ionicons name="location-outline" size={14} color="#757575" className="mt-0.5" />
                                        <Text variant="body-sm" color="secondary" className="flex-1 leading-relaxed">
                                            {stop.address || "Address not available"}
                                        </Text>
                                    </View>

                                    {/* Bottom Row: Actions */}
                                    <View className="flex-row items-center gap-x-2.5">
                                        {stop.customer_phone ? (
                                            <TouchableOpacity
                                                onPress={() => Linking.openURL(`tel:${stop.customer_phone}`)}
                                                activeOpacity={0.7}
                                                className="flex-row items-center gap-x-1.5 bg-white border border-border-default rounded-xl px-3 py-1.5 shadow-xs"
                                            >
                                                <Ionicons name="call-outline" size={14} color="#1B5E37" />
                                                <Text variant="caption-sm" weight="semibold" color="brand">
                                                    Call
                                                </Text>
                                            </TouchableOpacity>
                                        ) : null}

                                        <TouchableOpacity
                                            onPress={() => {
                                                useGeofenceStore.setState({
                                                    selectedStopId: stop.id,
                                                    navigationStopId: stop.id,
                                                });
                                                useGeofenceStore.getState().fetchNavigationPolyline();
                                                router.push({
                                                    pathname: ROUTES.DRIVER.MAP,
                                                    params: { selectStopId: stop.id }
                                                } as any);
                                            }}
                                            activeOpacity={0.7}
                                            className="flex-row items-center gap-x-1.5 bg-white border border-border-default rounded-xl px-3 py-1.5 shadow-xs"
                                        >
                                            <Ionicons name="map-outline" size={14} color="#1B5E37" />
                                            <Text variant="caption-sm" weight="semibold" color="brand">
                                                Navigate
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

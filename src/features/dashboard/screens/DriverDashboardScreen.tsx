import React, { useRef } from "react";
import {
    ScrollView,
    View,
    TouchableOpacity,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/store/authStore";
import { useTrackingStore } from "@/store/trackingStore";
import { ROUTES } from "@/constants/route";
import { Button } from "@/shared/ui/Button/Button";
import { Text } from "@/shared/ui/Text/Text";
import { useGeofenceStore } from "@/store/geofenceStore";
import OSMMap, { OSMMapHandle } from "@/features/map/components/OSMMap";

export function DriverDashboardScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);

    const mapRef = useRef<OSMMapHandle>(null);

    const isTripStarted = useTrackingStore((s) => s.isTripStarted);
    const { width } = useWindowDimensions();
    const isCompact = width < 380;
    const screenX = isCompact ? "px-screen-x" : "px-screen-x-md";

    const activeStop = useGeofenceStore((s) => s.getActiveStop());
    const canMark = useGeofenceStore((s) => s.canMarkActiveStopDelivered());
    // const setActiveStopId = useGeofenceStore((s) => s.setActiveStopId);
    const route = useGeofenceStore((s) => s.route);

    const handleTripToggle = async () => {
        const { accessToken, domain_name } = useAuthStore.getState();
        const { startTrip, stopTrip, isTripStarted } = useTrackingStore.getState();

        if (!accessToken || !domain_name) return;

        if (isTripStarted) {
            await stopTrip(accessToken);
            return;
        }
        await startTrip(accessToken);
    };

    const handleMarkDelivered = () => {
        if (!activeStop) return;

        router.push({
            pathname: ROUTES.DRIVER.FINALIZE_DELIVERY,
            params: {
                routeId: route?.id ?? "",
                stopId: activeStop.id,
                orderId: activeStop.order ?? "",
            },
        } as any);
    };

    return (
        <>
            <StatusBar style="dark" />
            <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-bg-screen">
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
                >
                    <View className={screenX}>
                        {/* Header */}
                        <View className="flex-row items-center justify-between pb-2">
                            <View className="flex-1 pr-3">
                                <Text className="text-caption text-text-muted tracking-widest uppercase">
                                    Good Morning 👋
                                </Text>
                                <Text className="text-title text-text-primary mt-1" fontWeight="bold" numberOfLines={1}>
                                    {user?.first_name ?? "Driver"}
                                </Text>
                            </View>

                            <View className="flex-row items-center gap-x-3">
                                <View
                                    className={`flex-row items-center gap-x-1.5 px-3 py-1.5 rounded-badge border ${isTripStarted
                                        ? "bg-successLight border-success/30"
                                        : "bg-bg-card border-border-default"
                                        }`}
                                >
                                    <View
                                        className={`w-2 h-2 rounded-full ${isTripStarted ? "bg-success" : "bg-text-muted"
                                            }`}
                                    />
                                    <Text
                                        className={`text-caption-sm ${isTripStarted ? "text-success" : "text-text-muted"
                                            }`}
                                        fontWeight="bold"
                                    >
                                        {isTripStarted ? "LIVE" : "OFFLINE"}
                                    </Text>
                                </View>

                                <View className="w-avatar-md h-avatar-md rounded-avatar bg-brand-light items-center justify-center border border-brand/20">
                                    <Ionicons name="person" size={20} color="#1B5E37" />
                                </View>
                            </View>
                        </View>

                        {/* Today's Route Card */}
                        <View className="mt-4 rounded-card bg-brand-primary p-card-y px-card-x shadow-md shadow-brand/40">
                            <View className="flex-row items-start justify-between gap-4">
                                <View className="flex-1">
                                    <Text className="text-caption text-brand-light tracking-widest uppercase">
                                        Today's Route
                                    </Text>
                                    <Text className="text-heading text-white mt-1" fontWeight="bold" numberOfLines={2}>
                                        Nagpur Express Delivery
                                    </Text>
                                    <Text className="text-caption text-brand-light mt-1">
                                        38 / 62 Deliveries Completed
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    onPress={handleTripToggle}
                                    // className={`w-btn-lg h-btn-lg p-2 rounded-full items-center justify-center shadow-sm ${isTripStarted ? "bg-error" : "bg-white"
                                    className={`w-16 h-16  rounded-full items-center justify-center shadow-sm ${isTripStarted ? "bg-error" : "bg-white"
                                        }`}
                                >
                                    <Ionicons
                                        name={isTripStarted ? "stop" : "play"}
                                        size={24}
                                        color={isTripStarted ? "#fff" : "#1B5E37"}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View className="mt-5 h-2.5 rounded-full bg-brand-secondary overflow-hidden">
                                <View className="h-full rounded-full bg-white" style={{ width: "61%" }} />
                            </View>

                            <View className="flex-row justify-between mt-2">
                                <Text className="text-caption text-brand-light font-medium">61% done</Text>
                                <Text className="text-caption text-brand-light font-medium">ETA 1h 24m</Text>
                            </View>
                        </View>

                        {/* Stat Cards - Changed to flex-1 sharing to avoid min-width overlapping */}
                        <View className="mt-5 flex-row justify-between gap-3">
                            <StatCard icon="water" label="Bottles" value="128" color="#1B5E37" />
                            <StatCard icon="restaurant" label="Special" value="16" color="#D4872A" />
                            <StatCard icon="return-down-back" label="Returns" value="52" color="#4A4A4A" />
                        </View>

                        {/* Next Stop Card */}
                        <View className="mt-5">
                            {activeStop ? (
                                <View className="rounded-card border border-border-default bg-bg-card p-card-y px-card-x shadow-sm">
                                    <View className="mb-3 flex-row items-center justify-between">
                                        <Text
                                            className="text-caption uppercase tracking-widest text-brand-primary"
                                            fontWeight="semibold"
                                        >
                                            Next Stop
                                        </Text>

                                        <View className="rounded-badge border border-brand/10 bg-brand-light px-2.5 py-1">
                                            <Text className="text-caption-sm text-brand-primary" fontWeight="bold">
                                                Stop #{activeStop.sequence_number}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text className="text-title text-text-primary" fontWeight="bold">
                                        {activeStop.customer_name}
                                    </Text>

                                    <Text className="mt-1 text-body text-text-secondary">
                                        {activeStop.address}
                                    </Text>

                                    <View className="mt-4 flex-row flex-wrap gap-2">
                                        {activeStop.order ? <ItemBadge label={activeStop.order} /> : null}
                                    </View>

                                    <View className="mt-5">
                                        <Button
                                            label={canMark ? "Mark Delivered" : "Move Closer to Enable"}
                                            intent="primary"
                                            size="lg"
                                            fullWidth
                                            disabled={!canMark}
                                            leftIcon={<Ionicons name="checkmark-circle-outline" size={20} color="#fff" />}
                                            onPress={handleMarkDelivered}
                                        />
                                    </View>
                                </View>
                            ) : (
                                <View className="rounded-card border border-border-default bg-bg-card p-card-y px-card-x shadow-sm">
                                    <Text className="text-title text-text-primary" fontWeight="bold">
                                        No active stop
                                    </Text>

                                    <Text className="mt-1 text-body text-text-secondary">
                                        Go to your location and start approaching the next customer to see the highlighted card.
                                    </Text>

                                    <View className="mt-5">
                                        <Button
                                            label="Go to Location"
                                            intent="primary"
                                            size="lg"
                                            fullWidth
                                            leftIcon={<Ionicons name="locate-outline" size={20} color="#fff" />}
                                            onPress={() => {
                                                mapRef.current?.centerOnUser();
                                            }}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Quick Actions - Configured to wrap exactly 3 per row gracefully */}
                        <Text className="mt-6 mb-3 text-label text-text-primary uppercase tracking-widest" fontWeight="semibold">
                            Quick Actions
                        </Text>
                        <View className="flex-row flex-wrap justify-between">
                            <QuickAction
                                icon="map"
                                label="Live Map"
                                onPress={() => router.push(ROUTES.DRIVER.MAP as any)}
                                color="#1B5E37"
                            />
                            <QuickAction
                                icon="cube-outline"
                                label="Bottles"
                                onPress={() => { }}
                                color="#1B5E37"
                            />
                            <QuickAction
                                icon="alert-circle-outline"
                                label="Report"
                                onPress={() => { }}
                                color="#D4872A"
                            />
                            <QuickAction
                                icon="cash-outline"
                                label="Cash"
                                onPress={() => { }}
                                color="#2E7D32"
                            />
                            <QuickAction
                                icon="checkmark-done-outline"
                                label="Attendance"
                                onPress={() => { }}
                                color="#1B5E37"
                            />
                            <QuickAction
                                icon="headset-outline"
                                label="Support"
                                onPress={() => { }}
                                color="#4A4A4A"
                            />
                        </View>

                        {/* Today's Summary */}
                        <View className="mt-2 rounded-card bg-bg-card p-card-y px-card-x border border-border-default shadow-sm">
                            <Text
                                className="text-caption tracking-widest text-text-muted uppercase mb-3"
                                fontWeight="semibold"
                            >
                                Today's Summary
                            </Text>
                            <View className="flex-row justify-between">
                                <SummaryItem label="Delivered" value="38" />
                                <SummaryItem label="Pending" value="24" />
                                <SummaryItem label="COD" value="₹1,240" />
                            </View>
                        </View>

                        {/* Special Instruction */}
                        <View className="mt-4 rounded-card bg-warningLight border border-warning/30 p-card-y px-card-x flex-row items-start gap-x-3">
                            <Ionicons name="warning-outline" size={24} color="#D4872A" />
                            <View className="flex-1">
                                <Text className="text-label text-warning" fontWeight="bold">
                                    Special Instruction
                                </Text>
                                <Text className="text-body-sm text-warning mt-1" style={{ opacity: 0.9 }}>
                                    Customer Amit Kumar has requested early delivery before 8 AM.
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

function StatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: any;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <View className="flex-1 bg-bg-card rounded-card p-3 border border-border-default shadow-sm items-center">
            <View className="w-8 h-8 rounded-full items-center justify-center mb-2" style={{ backgroundColor: color + "15" }}>
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <Text className="text-xl text-text-primary" fontWeight="bold" numberOfLines={1}>
                {value}
            </Text>
            <Text className="text-caption-sm text-text-muted mt-0.5" numberOfLines={1}>{label}</Text>
        </View>
    );
}

function ItemBadge({ label }: { label: string }) {
    return (
        <View className="bg-brand-light px-3 py-1.5 rounded-badge border border-brand/20">
            <Text className="text-caption text-brand-primary" fontWeight="semibold">
                {label}
            </Text>
        </View>
    );
}

function QuickAction({
    icon,
    label,
    onPress,
    color,
}: {
    icon: any;
    label: string;
    onPress: () => void;
    color: string;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="w-[31%] bg-bg-card border border-border-default rounded-card items-center justify-center p-3 mb-3 shadow-sm"
        >
            <View
                className="w-10 h-10 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: color + "15" }}
            >
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text className="text-caption-sm text-text-primary text-center" fontWeight="semibold" numberOfLines={1}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
    return (
        <View className="items-center flex-1">
            <Text className="text-xl text-text-primary" fontWeight="bold" numberOfLines={1}>
                {value}
            </Text>
            <Text className="text-caption-sm text-text-muted mt-1" numberOfLines={1}>{label}</Text>
        </View>
    );
}
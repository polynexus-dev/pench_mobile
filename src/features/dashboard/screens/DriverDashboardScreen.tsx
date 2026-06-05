import { useMemo } from "react";
import { ROUTES } from "@/constants/route";
import { OSMMapHandle } from "@/features/map/components/OSMMap";
import { Button } from "@/shared/ui/Button/Button";
import { Text } from "@/shared/ui/Text/Text";
import { useAuthStore } from "@/store/authStore";
import { useGeofenceStore } from "@/store/geofenceStore";
import { useTrackingStore } from "@/store/trackingStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    Animated,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState, useRef } from "react";
import { asyncStorage } from "@services/storage/asyncStorage";

export function DriverDashboardScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const accessToken = useAuthStore((s) => s.accessToken);
    const authRouteId = useAuthStore((s) => s.route_id);
    const insets = useSafeAreaInsets();

    const mapRef = useRef<OSMMapHandle>(null);

    const isTripStarted = useTrackingStore((s) => s.isTripStarted);
    const canStopTrip = useTrackingStore((s) => s.canStopTrip);

    const { width } = useWindowDimensions();
    const screenX = "px-4";

    const geofenceActiveStop = useGeofenceStore((s) => s.getActiveStop());
    const canMark = useGeofenceStore((s) => s.canMarkActiveStopDelivered());
    const route = useGeofenceStore((s) => s.route);

    // Fall back to first non-completed stop from route when geofence has no active stop
    const activeStop = useMemo(() => {
        if (geofenceActiveStop) return geofenceActiveStop;
        if (!route?.stops?.length) return null;
        return route.stops.find((s) => s.order_status !== "delivered" && s.order_status !== "cancelled") ?? null;
    }, [geofenceActiveStop, route?.stops]);

    // DEBUG: Remove after fix is verified
    useEffect(() => {
        console.log("[DASH-DEBUG] route:", route?.id, "stops:", route?.stops?.length);
        console.log("[DASH-DEBUG] geofenceActiveStop:", geofenceActiveStop?.id, geofenceActiveStop?.customer_name);
        console.log("[DASH-DEBUG] activeStop:", activeStop?.id, activeStop?.customer_name);
        if (route?.stops?.length) {
            const inTransit = route.stops.filter((s) => s.order_status === "in_transit");
            console.log("[DASH-DEBUG] in_transit stops:", inTransit.length, inTransit.map(s => s.id));
        }
    }, [route, geofenceActiveStop, activeStop]);

    const [persistedRouteId, setPersistedRouteId] = useState<string | null>(null);
    const routeId = persistedRouteId ?? authRouteId;

    const scrollYAnimated = useRef(new Animated.Value(0)).current;
    const [statusBarLight, setStatusBarLight] = useState(false);
    const [headerVisible, setHeaderVisible] = useState(false);

    useEffect(() => {
        let prevLight = false;
        let prevVisible = false;
        const listenerId = scrollYAnimated.addListener(({ value }) => {
            const shouldBeLight = value > 120;
            if (shouldBeLight !== prevLight) {
                prevLight = shouldBeLight;
                setStatusBarLight(shouldBeLight);
            }
            const shouldBeVisible = value > 100;
            if (shouldBeVisible !== prevVisible) {
                prevVisible = shouldBeVisible;
                setHeaderVisible(shouldBeVisible);
            }
        });
        return () => {
            scrollYAnimated.removeListener(listenerId);
        };
    }, []);

    const headerOpacity = scrollYAnimated.interpolate({
        inputRange: [100, 160],
        outputRange: [0, 1],
        extrapolate: "clamp",
    });

    const canStartTrip = !!routeId && !!accessToken;
    const isStopDisabled = isTripStarted && !canStopTrip;

    useEffect(() => {
        let mounted = true;

        const loadRouteId = async () => {
            try {
                const storedRouteId = await asyncStorage.getItem("route_id");
                if (mounted) setPersistedRouteId(storedRouteId ?? null);
            } catch {
                if (mounted) setPersistedRouteId(null);
            }
        };

        loadRouteId();

        return () => {
            mounted = false;
        };
    }, []);

    const handleTripToggle = async () => {
        const { startTrip, stopTrip, isTripStarted, canStopTrip } = useTrackingStore.getState();
        const { accessToken, route_id } = useAuthStore.getState();

        if (!accessToken || !route_id) return;

        if (isTripStarted) {
            if (!canStopTrip) return;
            await stopTrip();
            return;
        }

        await startTrip();
    };

    const handleMarkDelivered = () => {
        if (!activeStop || !route) return;
        if (!activeStop.order) return;

        router.push({
            pathname: ROUTES.DRIVER.FINALIZE_DELIVERY,
            params: {
                routeId: route.id,
                stopId: activeStop.id,
                orderId: activeStop.order,
            },
        } as any);
    };

    const totalStops = route?.stops?.length ?? 0;
    const deliveredStops =
        route?.stops?.filter((s) => s.order_status === "delivered").length ?? 0;    

    const deliveryProgress =
        totalStops > 0
            ? Math.min(100, Math.round((deliveredStops / totalStops) * 100))
            : 0;

    return (
        <>
            <StatusBar style={statusBarLight ? "light" : "dark"} backgroundColor="transparent" translucent />
            {routeId && (
                <Animated.View
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: insets.top + 96,
                        paddingTop: insets.top + 16,
                        paddingHorizontal: 16,
                        backgroundColor: "#1B5E37",
                        zIndex: 100,
                        opacity: headerOpacity,
                    }}
                    pointerEvents={headerVisible ? "auto" : "none"}
                >
                    {/* Content Row */}
                    <View className="flex-row items-center justify-between pb-3">
                        <View className="flex-1 pr-3">
                            <Text variant="caption-sm" color="inverse" weight="bold" transform="uppercase" className="opacity-90">
                                {isTripStarted ? "LIVE TRIP" : "TRIP OFFLINE"}
                            </Text>
                            <Text variant="body" weight="bold" color="inverse" lines={1} className="mt-0.5">
                                {route?.name ?? "Nagpur Express Delivery"}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={handleTripToggle}
                            disabled={isStopDisabled}
                            className={`h-9 w-9 items-center justify-center rounded-full shadow-sm ${isTripStarted ? "bg-error" : "bg-white"
                                } ${isStopDisabled ? "opacity-50" : ""}`}
                        >
                            <Ionicons
                                name={isTripStarted ? "stop" : "play"}
                                size={16}
                                color={isTripStarted ? "#fff" : "#1B5E37"}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Thicker, rounded, inset progress bar */}
                    <View style={{ height: 5, backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: 9999, overflow: "hidden" }}>
                        <View
                            style={{
                                height: "100%",
                                backgroundColor: "#fff",
                                width: `${deliveryProgress}%`,
                                borderRadius: 9999,
                            }}
                        />
                    </View>
                </Animated.View>
            )}
            <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-bg-screen">
                <StatusBar style={statusBarLight ? "dark" : "light"} />
                <Animated.ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
                    scrollEventThrottle={16}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollYAnimated } } }],
                        { useNativeDriver: true }
                    )}
                >
                    <View className={screenX}>
                        <View className="flex-row items-center justify-between pt-4 pb-5">
                            <View className="flex-1 pr-3">
                                <Text
                                    variant="caption"
                                    color="muted"
                                    weight="semibold"
                                    transform="uppercase"
                                    className="tracking-widest"
                                >
                                    Good Morning 👋
                                </Text>

                                <Text
                                    variant="heading"
                                    weight="bold"
                                    color="primary"
                                    lines={1}
                                    className="mt-0.5"
                                >
                                    {user?.first_name ?? "Driver"}
                                </Text>
                            </View>

                            <View className="flex-row items-center gap-x-3">
                                <View
                                    className={`flex-row items-center gap-x-1.5 rounded-full border px-2.5 py-1 ${isTripStarted
                                        ? "border-success/20 bg-successLight/40"
                                        : "border-border-default bg-bg-card"
                                        }`}
                                >
                                    <View
                                        className={`h-2 w-2 rounded-full ${isTripStarted ? "bg-success" : "bg-neutral-400"
                                            }`}
                                    />
                                    <Text
                                        variant="caption-sm"
                                        color={isTripStarted ? "success" : "muted"}
                                        weight="bold"
                                    >
                                        {isTripStarted ? "LIVE" : "OFFLINE"}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() => router.push(ROUTES.DRIVER.QR_SCANNER as any)}
                                    className="h-10 w-10 items-center justify-center rounded-full bg-white border border-border-default shadow-xs"
                                >
                                    <Ionicons name="qr-code-outline" size={18} color="#1B5E37" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {routeId ? (
                            <View className="mt-4 rounded-2xl bg-brand-primary p-5 shadow-sm shadow-brand/20">
                                <View className="flex-row items-start justify-between gap-4">
                                    <View className="flex-1">
                                        <Text
                                            variant="caption"
                                            color="inverse"
                                            weight="semibold"
                                            transform="uppercase"
                                            className="tracking-widest opacity-90"
                                        >
                                            Route Assigned
                                        </Text>

                                        <Text
                                            variant="subhead"
                                            weight="bold"
                                            color="inverse"
                                            lines={2}
                                            className="mt-1"
                                        >
                                            {route?.name ?? "Nagpur Express Delivery"}
                                        </Text>

                                        <Text variant="caption" color="inverse" className="mt-0.5 opacity-90">
                                            {route?.stops?.length ?? 0} Deliveries
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleTripToggle}
                                        disabled={isStopDisabled}
                                        className={`h-12 w-12 items-center justify-center rounded-full shadow-sm ${isTripStarted ? "bg-error" : "bg-white"
                                            } ${isStopDisabled ? "opacity-50" : ""}`}
                                    >
                                        <Ionicons
                                            name={isTripStarted ? "stop" : "play"}
                                            size={20}
                                            color={isTripStarted ? "#fff" : "#1B5E37"}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View className="mt-4 h-2.5 overflow-hidden rounded-full bg-brand-secondary">
                                    <View
                                        className="h-full rounded-full bg-white"
                                        style={{ width: `${deliveryProgress}%` }}
                                    />
                                </View>

                                <View className="mt-2 flex-row justify-between">
                                    <Text variant="caption" color="inverse" weight="medium" className="opacity-90">
                                        {route?.stops?.filter((s) => s.order_status === "delivered").length ?? 0} done
                                    </Text>
                                    <Text variant="caption" color="inverse" weight="medium" className="opacity-90">
                                        ETA 1h 24m
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View className="mt-4 rounded-2xl bg-brand-primary p-5 shadow-sm shadow-brand/20">
                                <Text
                                    variant="caption"
                                    color="inverse"
                                    weight="semibold"
                                    transform="uppercase"
                                    className="tracking-widest opacity-90"
                                >
                                    Route not Assigned yet
                                </Text>
                            </View>
                        )}

                        <View className="mt-4 flex-row justify-between gap-2.5">
                            <StatCard icon="water" label="Bottles" value="128" color="#1B5E37" />
                            <StatCard icon="restaurant" label="Special" value="16" color="#D4872A" />
                            <StatCard icon="return-down-back" label="Returns" value="52" color="#757575" />
                        </View>

                        <View className="mt-5">
                            {activeStop ? (
                                <View className="rounded-2xl border-l-4 border-l-brand-primary border-y border-r border-border-default bg-bg-card p-5 shadow-sm">
                                    <View className="mb-3 flex-row items-center justify-between">
                                        <Text
                                            variant="caption"
                                            color="brand"
                                            weight="bold"
                                            transform="uppercase"
                                            className="tracking-widest"
                                        >
                                            Next Stop
                                        </Text>

                                        <View className="rounded-full bg-brand-light px-2.5 py-1">
                                            <Text variant="caption-sm" color="brand" weight="bold">
                                                Stop #{activeStop.sequence_number}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text variant="subhead" weight="bold" color="primary">
                                        {activeStop.customer_name}
                                    </Text>

                                    <Text variant="body-sm" color="secondary" className="mt-1">
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
                                <View className="rounded-2xl border border-border-default bg-bg-card p-5 shadow-sm">
                                    <Text variant="subhead" weight="bold" color="primary">
                                        No active stop
                                    </Text>

                                    <Text variant="body-sm" color="secondary" className="mt-1">
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

                        <Text
                            variant="label"
                            color="primary"
                            weight="semibold"
                            transform="uppercase"
                            className="mt-6 mb-3 tracking-widest"
                        >
                            Quick Actions
                        </Text>

                        <View className="flex-row flex-wrap justify-between gap-y-3">
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
                                color="#2E7D52"
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
                                color="#757575"
                            />
                        </View>

                        <View className="mt-2 rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-sm">
                            <Text
                                variant="caption"
                                color="muted"
                                transform="uppercase"
                                weight="semibold"
                                className="mb-3 tracking-widest"
                            >
                                Today's Summary
                            </Text>

                            <View className="flex-row items-center justify-between">
                                <SummaryItem label="Delivered" value="38" />
                                <View className="w-px h-8 bg-border-subtle" />
                                <SummaryItem label="Pending" value="24" />
                                <View className="w-px h-8 bg-border-subtle" />
                                <SummaryItem label="COD" value="₹1,240" />
                            </View>
                        </View>

                        <View className="mt-5 flex-row items-start gap-x-3 rounded-xl border border-warning/20 bg-warningLight/50 p-4">
                            <Ionicons name="warning" size={20} color="#D4872A" />
                            <View className="flex-1">
                                <Text variant="label" color="warning" weight="bold">
                                    Special Instruction
                                </Text>
                                <Text
                                    variant="body-sm"
                                    color="warning"
                                    className="mt-1"
                                    style={{ opacity: 0.9 }}
                                >
                                    Customer Amit Kumar has requested early delivery before 8 AM.
                                </Text>
                            </View>
                        </View>
                    </View>
                </Animated.ScrollView>
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
        <View className="flex-1 items-center rounded-xl border border-border-subtle bg-bg-card p-3.5 shadow-xs">
            <View
                className="mb-2 h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: color + "15" }}
            >
                <Ionicons name={icon} size={16} color={color} />
            </View>
            <Text variant="subhead" weight="bold" color="primary" lines={1}>
                {value}
            </Text>
            <Text variant="caption-sm" color="muted" lines={1} className="mt-0.5">
                {label}
            </Text>
        </View>
    );
}

function ItemBadge({ label }: { label: string }) {
    return (
        <View className="rounded-full border border-brand/10 bg-brand-light px-3 py-1.5">
            <Text variant="caption" color="brand" weight="semibold">
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
            className="mb-3 w-[48.5%] flex-row items-center gap-x-3 rounded-xl border border-border-subtle bg-bg-card p-3 shadow-xs"
        >
            <View
                className="h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: color + "15" }}
            >
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <Text
                variant="body-sm"
                color="primary"
                weight="semibold"
                lines={1}
                className="flex-1"
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
    return (
        <View className="flex-1 items-center">
            <Text variant="subhead" weight="bold" color="primary" lines={1}>
                {value}
            </Text>
            <Text variant="caption-sm" color="muted" lines={1} className="mt-1">
                {label}
            </Text>
        </View>
    );
}
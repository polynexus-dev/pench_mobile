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
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState, useRef, useMemo } from "react";
import { asyncStorage } from "@services/storage/asyncStorage";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useFetchMyRoute } from "@/features/map/hooks/useFetchMyRoute";

export function DriverDashboardScreen() {
    const { isLoading: isRouteLoading } = useFetchMyRoute();
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

    const activeStop = useGeofenceStore((s) => s.getActiveStop());
    const canMark = useGeofenceStore((s) => s.canMarkActiveStopDelivered());
    const route = useGeofenceStore((s) => s.route);

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

    const allStopsCompleted = useMemo(() => {
        if (!route?.stops?.length) return false;
        return route.stops.every(
            (stop) => stop.order_status === "delivered" || stop.order_status === "undelivered"
        );
    }, [route?.stops]);

    const isStopDisabled = isTripStarted && !allStopsCompleted;

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
        const { startTrip, stopTrip, isTripStarted } = useTrackingStore.getState();
        const { accessToken, route_id } = useAuthStore.getState();

        if (!accessToken || !route_id) return;

        if (isTripStarted) {
            if (!allStopsCompleted) return;
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

    const rawRouteName = route?.name ?? "Nagpur Express Delivery";
    const nameParts = rawRouteName.split(/\s*[-|/]\s*/).map(p => p.trim()).filter(Boolean);
    const areaName = nameParts[0] || "Nagpur Express Delivery";
    const driverName = nameParts[1] || route?.driver_name || (user?.first_name ? `${user.first_name} ${user.last_name ?? ""}`.trim() : "Driver");
    const rawDate = route?.delivery_date || nameParts[2] || new Date().toISOString().split('T')[0];
    const dateMatch = rawDate.match(/\d{4}-\d{2}-\d{2}/);
    const deliveryDate = dateMatch ? dateMatch[0] : rawDate.split('#')[0].trim();

    const totalStops = route?.stops?.length ?? 0;
    const deliveredStops =
        route?.stops?.filter((s) => s.order_status === "delivered").length ?? 0;

    const deliveryProgress =
        totalStops > 0
            ? Math.min(100, Math.round((deliveredStops / totalStops) * 100))
            : 0;

    return (
        <ScreenWrapper
            title="Home"
            // showBack
            screenBgColor="#0f172a"
            disablePadding
        // showHeader={true}
        >
            {/* <StatusBar style={statusBarLight ? "light" : "dark"} backgroundColor="transparent" translucent /> */}
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
                                {areaName}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={handleTripToggle}
                            disabled={isStopDisabled}
                            className={`h-9 w-9 items-center justify-center rounded-full shadow-sm ${isTripStarted
                                    ? (allStopsCompleted ? "bg-[#E53E3E]" : "bg-[#D4872A]")
                                    : "bg-white"
                                } ${isStopDisabled ? "opacity-75" : ""}`}
                        >
                            <Ionicons
                                name={isTripStarted ? (allStopsCompleted ? "stop" : "car-outline") : "play"}
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
            <SafeAreaView edges={["bottom"]} className="flex-1 bg-bg-screen">

                <Animated.ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120, paddingTop: 0 }}
                    scrollEventThrottle={16}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollYAnimated } } }],
                        { useNativeDriver: true }
                    )}
                >
                    {/* Header Green Block */}
                    <View
                        className="bg-[#1B5E37] px-4 pb-5 rounded-b-[35px] shadow-sm"
                        style={{ paddingTop: insets.top + 16 }}
                    >
                        <View className="flex-row items-center justify-between pt-2 pb-5">
                            <View className="flex-1 pr-3">
                                <Text className="text-[14px] font-medium text-white/80">
                                    Good Morning
                                </Text>

                                <Text className="text-[24px] font-bold text-white mt-0.5" numberOfLines={1}>
                                    {user?.first_name ? `${user.first_name} ${user.last_name ?? ""}`.trim() : "Driver"}
                                </Text>
                            </View>

                            <View className="flex-row items-center gap-x-2.5">
                                <View
                                    className={`flex-row items-center gap-x-1.5 rounded-full px-3 py-1.5 ${isTripStarted
                                        ? "bg-[#E8F5EE]"
                                        : "bg-[#FDECEC]"
                                        }`}
                                >
                                    <View
                                        className={`h-2 w-2 rounded-full ${isTripStarted ? "bg-success" : "bg-[#E53E3E]"}`}
                                    />
                                    <Text
                                        className={`text-[12px] font-bold ${isTripStarted ? "text-[#1B5E37]" : "text-[#E53E3E]"}`}
                                    >
                                        {isTripStarted ? "LIVE" : "Offline"}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() => router.push(ROUTES.DRIVER.QR_SCANNER as any)}
                                    className="h-9 w-9 items-center justify-center rounded-full bg-white shadow-xs"
                                >
                                    <Text className="text-[13px] font-bold text-[#1B5E37]">
                                        QR
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Route Card */}
                        {isRouteLoading ? (
                            <View className="mt-2 rounded-[24px] bg-[#D1E0D6] p-6 shadow-xs items-center justify-center min-h-[160px]">
                                <ActivityIndicator size="small" color="#1B5E37" />
                                <Text className="mt-3 text-[#1B5E37] text-[14px] font-semibold">
                                    Loading route details...
                                </Text>
                            </View>
                        ) : routeId ? (
                            <View className="mt-2 rounded-[24px] bg-[#D1E0D6] p-5 shadow-xs">
                                <View className="flex-row items-start justify-between gap-4">
                                    <View className="flex-1">
                                        <Text
                                            className="text-[22px] font-bold text-[#1A1A1A]"
                                            numberOfLines={1}
                                        >
                                            {areaName}
                                        </Text>

                                        <Text
                                            className="text-[16px] font-medium text-[#2C2C2C] mt-1"
                                            numberOfLines={1}
                                        >
                                            {driverName}
                                        </Text>

                                        <Text
                                            className="text-[14px] text-[#4A4A4A] mt-1.5 font-semibold"
                                        >
                                            {deliveryDate}
                                        </Text>
                                    </View>

                                    <View className="justify-center pt-1">
                                        <TouchableOpacity
                                            onPress={handleTripToggle}
                                            disabled={isStopDisabled}
                                            className={`px-4 py-2.5 rounded-xl shadow-sm ${isTripStarted
                                                    ? (allStopsCompleted ? "bg-[#E53E3E]" : "bg-[#D4872A]")
                                                    : "bg-[#1B5E37]"
                                                } ${isStopDisabled ? "opacity-75" : ""}`}
                                        >
                                            <Text className="text-white font-semibold text-[15px]">
                                                {isTripStarted ? (allStopsCompleted ? "Stop Trip" : "In Transit") : "Start Trip"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#1B5E37]">
                                    <View
                                        className="h-full rounded-full bg-[#F4FAF7]"
                                        style={{ width: `${deliveryProgress}%` }}
                                    />
                                </View>

                                <View className="mt-2.5 flex-row justify-between items-center">
                                    <Text className="text-sm font-semibold text-[#1A1A1A]">
                                        {deliveredStops}/{totalStops} Deliveries
                                    </Text>
                                    {isTripStarted && (
                                        <Text className="text-sm font-medium text-[#4A4A4A]">
                                            ETA 1h 24m
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ) : (
                            <View className="mt-2 rounded-[24px] bg-[#A2C5AC] p-5 shadow-xs">
                                <Text
                                    className="text-xs font-bold uppercase tracking-widest text-[#2C2C2C]"
                                >
                                    Route not Assigned yet
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Rest of the content */}
                    <View className={screenX}>

                        <View className="mt-5 flex-row justify-between gap-3">
                            <StatCard icon="water" label="Bottles" value="128" color="#1B5E37" />
                            <StatCard icon="restaurant" label="Special" value="16" color="#D4872A" />
                            <StatCard icon="return-down-back" label="Returns" value="52" color="#757575" />
                        </View>

                        <View className="mt-5">
                            {activeStop ? (
                                <View className="rounded-[24px] border border-border-default bg-bg-card p-5 shadow-md relative overflow-hidden">
                                    {/* Active left indicator bar */}
                                    <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-primary" />
                                    
                                    <View className="mb-4 flex-row items-center justify-between pl-1">
                                        <View className="flex-row items-center gap-x-2">
                                            <View className="h-2 w-2 rounded-full bg-brand-primary" />
                                            <Text
                                                variant="caption"
                                                color="brand"
                                                weight="bold"
                                                transform="uppercase"
                                                className="tracking-widest"
                                            >
                                                Next Stop
                                            </Text>
                                        </View>

                                        <View className="rounded-full bg-brand-light px-3 py-1">
                                            <Text variant="caption-sm" color="brand" weight="bold">
                                                Stop #{activeStop.sequence_number}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="pl-1">
                                        <Text variant="subhead" weight="bold" color="primary">
                                            {activeStop.customer_name}
                                        </Text>

                                        <View className="mt-2.5 flex-row items-start gap-x-2">
                                            <Ionicons name="location-outline" size={16} color="#757575" className="mt-0.5" />
                                            <Text variant="body-sm" color="secondary" className="flex-1 leading-relaxed">
                                                {activeStop.address ? activeStop.address : "Address not available yet"}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="mt-5 pl-1">
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
                                <View className="rounded-[24px] border border-border-default bg-bg-card p-6 shadow-sm items-center">
                                    <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-4">
                                        <Ionicons name="location-outline" size={24} color="#757575" />
                                    </View>
                                    <Text variant="subhead" weight="bold" color="primary" align="center">
                                        No Active Stop
                                    </Text>

                                    <Text variant="body-sm" color="secondary" align="center" className="mt-2 mb-5 leading-relaxed">
                                        Go to your location and start approaching the next customer to see the highlighted card.
                                    </Text>

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
                            )}
                        </View>

                        {routeId && (
                            <Button
                                label="Show all Customers"
                                intent="secondary"
                                size="lg"
                                fullWidth
                                className="mt-4 bg-[#D1E0D6] active:bg-[#B8CFC0] border border-[#1B5E37]/15"
                                leftIcon={<Ionicons name="people-outline" size={20} color="#1B5E37" />}
                                onPress={() => router.push(ROUTES.DRIVER.ALL_CUSTOMERS as any)}
                            />
                        )}

                        <Text
                            variant="label"
                            color="primary"
                            weight="semibold"
                            transform="uppercase"
                            className="mt-6 mb-3.5 tracking-widest"
                        >
                            Quick Actions
                        </Text>

                        <View className="flex-row flex-wrap justify-between gap-y-3.5">
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

                        <View className="mt-4 rounded-[24px] bg-bg-card p-5 shadow-sm">
                            <View className="mb-4 flex-row items-center gap-x-2">
                                <Ionicons name="stats-chart-outline" size={16} color="#1B5E37" />
                                <Text
                                    variant="caption"
                                    color="muted"
                                    transform="uppercase"
                                    weight="semibold"
                                    className="tracking-wider"
                                >
                                    Today's Summary
                                </Text>
                            </View>

                            <View className="flex-row items-center justify-between">
                                <SummaryItem label="Delivered" value="38" color="#1B5E37" />
                                <View className="w-px h-8 bg-border-subtle" />
                                <SummaryItem label="Pending" value="24" color="#D4872A" />
                                <View className="w-px h-8 bg-border-subtle" />
                                <SummaryItem label="COD" value="₹1,240" color="#2E7D52" />
                            </View>
                        </View>

                        <View className="mt-5 flex-row items-start gap-x-3.5 rounded-[20px] border border-warning/20 bg-[#FDF3E7] p-4">
                            <View className="h-8 w-8 items-center justify-center rounded-full bg-[#D4872A]/10">
                                <Ionicons name="alert-circle" size={18} color="#D4872A" />
                            </View>
                            <View className="flex-1">
                                <Text variant="label" color="warning" weight="bold">
                                    Special Instruction
                                </Text>
                                <Text
                                    variant="body-sm"
                                    color="secondary"
                                    className="mt-1 leading-relaxed"
                                >
                                    Customer Amit Kumar has requested early delivery before 8 AM.
                                </Text>
                            </View>
                        </View>
                    </View>
                </Animated.ScrollView>
            </SafeAreaView>
         </ScreenWrapper>
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
         <View className="flex-1 rounded-[20px] bg-bg-card p-4 shadow-sm relative overflow-hidden">
             {/* Soft background shape */}
             <View 
                 className="absolute -right-3 -top-3 w-12 h-12 rounded-full opacity-[0.04]" 
                 style={{ backgroundColor: color }} 
             />
             
             <View
                 className="mb-3.5 h-9 w-9 items-center justify-center rounded-xl"
                 style={{ backgroundColor: color + "12" }}
             >
                 <Ionicons name={icon} size={18} color={color} />
             </View>
             
             <Text variant="heading" weight="bold" color="primary" lines={1}>
                 {value}
             </Text>
             
             <Text variant="caption-sm" color="muted" weight="semibold" lines={1} className="mt-1">
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
             activeOpacity={0.7}
             className="w-[30.5%] items-center justify-center rounded-[20px] bg-bg-card p-3.5 shadow-sm border border-border-subtle/50"
         >
             <View
                 className="mb-2.5 h-11 w-11 items-center justify-center rounded-full"
                 style={{ backgroundColor: color + "10" }}
             >
                 <Ionicons name={icon} size={22} color={color} />
             </View>
             <Text
                 variant="caption"
                 color="primary"
                 weight="bold"
                 align="center"
                 lines={1}
             >
                 {label}
             </Text>
         </TouchableOpacity>
     );
 }

 function SummaryItem({
     label,
     value,
     color,
 }: {
     label: string;
     value: string;
     color?: string;
 }) {
     return (
         <View className="flex-1 items-center">
             <Text
                 variant="subhead"
                 weight="bold"
                 lines={1}
                 style={color ? { color } : undefined}
             >
                 {value}
             </Text>
             <Text variant="caption-sm" color="muted" lines={1} className="mt-1 uppercase tracking-wider">
                 {label}
             </Text>
         </View>
     );
 }

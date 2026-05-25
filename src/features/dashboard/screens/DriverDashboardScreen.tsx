// import { ROUTES } from "@/constants/route";
// import { OSMMapHandle } from "@/features/map/components/OSMMap";
// import { Button } from "@/shared/ui/Button/Button";
// import { Text } from "@/shared/ui/Text/Text";
// import { useAuthStore } from "@/store/authStore";
// import { useGeofenceStore } from "@/store/geofenceStore";
// import { useTrackingStore } from "@/store/trackingStore";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { StatusBar } from "expo-status-bar";
// import React, { useEffect, useRef, useState } from "react";
// import {
//     ScrollView,
//     TouchableOpacity,
//     useWindowDimensions,
//     View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// // import { useToast } from "@/hooks/useToast";

// export function DriverDashboardScreen() {
//     const router = useRouter();
//     const user = useAuthStore((s) => s.user);

//     const mapRef = useRef<OSMMapHandle>(null);

//     const isTripStarted = useTrackingStore((s) => s.isTripStarted);
//     const { width } = useWindowDimensions();
//     const isCompact = width < 380;
//     const screenX = isCompact ? "px-screen-x" : "px-screen-x-md";

//     const activeStop = useGeofenceStore((s) => s.getActiveStop());
//     const canMark = useGeofenceStore((s) => s.canMarkActiveStopDelivered());
//     const route = useGeofenceStore((s) => s.route);

//     const handleTripToggle = async () => {
//         const { accessToken } = useAuthStore.getState();
//         const { startTrip, stopTrip, isTripStarted } = useTrackingStore.getState();
//         if (__DEV__) console.log("trip toggle hit");

//         if (!accessToken) return;

//         if (isTripStarted) {
//             await stopTrip();
//             return;
//         }

//         await startTrip();
//     };

//     const handleMarkDelivered = () => {
//         if (!activeStop || !route) return;
//         if (!activeStop.order) return;

//         router.push({
//             pathname: ROUTES.DRIVER.FINALIZE_DELIVERY,
//             params: {
//                 routeId: route.id,
//                 stopId: activeStop.id,
//                 orderId: activeStop.order,
//             },
//         } as any);
//     };

//     return (
//         <>
//             <StatusBar style="dark" />
//             <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-bg-screen">
//                 <ScrollView
//                     showsVerticalScrollIndicator={false}
//                     contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
//                 >
//                     <View className={screenX}>
//                         <View className="flex-row items-center justify-between pb-2">
//                             <View className="flex-1 pr-3">
//                                 <Text
//                                     variant="caption"
//                                     color="muted"
//                                     transform="uppercase"
//                                     className="tracking-widest"
//                                 >
//                                     Good Morning 👋
//                                 </Text>

//                                 <Text
//                                     variant="title"
//                                     weight="bold"
//                                     color="primary"
//                                     lines={1}
//                                     className="mt-1"
//                                 >
//                                     {user?.first_name ?? "Driver"}
//                                 </Text>
//                             </View>

//                             <View className="flex-row items-center gap-x-3">
//                                 <View
//                                     className={`flex-row items-center gap-x-1.5 rounded-badge border px-3 py-1.5 ${isTripStarted
//                                         ? "border-success/30 bg-successLight"
//                                         : "border-border-default bg-bg-card"
//                                         }`}
//                                 >
//                                     <View
//                                         className={`h-2 w-2 rounded-full ${isTripStarted ? "bg-success" : "bg-text-muted"
//                                             }`}
//                                     />
//                                     <Text
//                                         variant="caption-sm"
//                                         color={isTripStarted ? "success" : "muted"}
//                                         weight="bold"
//                                     >
//                                         {isTripStarted ? "LIVE" : "OFFLINE"}
//                                     </Text>
//                                 </View>

//                                 <View className="h-avatar-md w-avatar-md items-center justify-center rounded-avatar border border-brand/20 bg-brand-light">
//                                     <Ionicons name="person" size={20} color="#1B5E37" />
//                                 </View>
//                             </View>
//                         </View>

//                         {route?.id ? (
//                             <View className="mt-4 rounded-card bg-brand-primary p-card-y px-card-x shadow-md shadow-brand/40">
//                                 <View className="flex-row items-start justify-between gap-4">
//                                     <View className="flex-1">
//                                         <Text
//                                             variant="caption"
//                                             color="inverse"
//                                             transform="uppercase"
//                                             className="tracking-widest opacity-90"
//                                         >
//                                             Route Assigned
//                                         </Text>

//                                         <Text
//                                             variant="heading"
//                                             weight="bold"
//                                             color="inverse"
//                                             lines={2}
//                                             className="mt-1"
//                                         >
//                                             {route?.name ?? "Nagpur Express Delivery"}
//                                         </Text>

//                                         <Text variant="caption" color="inverse" className="mt-1 opacity-90">
//                                             {route?.stops?.length ?? 0} Deliveries
//                                         </Text>
//                                     </View>

//                                     <TouchableOpacity
//                                         onPress={handleTripToggle}
//                                         className={`h-16 w-16 items-center justify-center rounded-full shadow-sm ${isTripStarted ? "bg-error" : "bg-white"
//                                             }`}
//                                     >
//                                         <Ionicons
//                                             name={isTripStarted ? "stop" : "play"}
//                                             size={24}
//                                             color={isTripStarted ? "#fff" : "#1B5E37"}
//                                         />
//                                     </TouchableOpacity>
//                                 </View>

//                                 <View className="mt-5 h-2.5 overflow-hidden rounded-full bg-brand-secondary">
//                                     <View className="h-full rounded-full bg-white" style={{ width: "61%" }} />
//                                 </View>

//                                 <View className="mt-2 flex-row justify-between">
//                                     <Text variant="caption" color="inverse" weight="medium">
//                                         {route?.stops?.filter((s) => s.order_status === "delivered").length ?? 0} done
//                                     </Text>
//                                     <Text variant="caption" color="inverse" weight="medium">
//                                         ETA 1h 24m
//                                     </Text>
//                                 </View>
//                             </View>
//                         ) : (
//                             <View className="mt-4 rounded-card bg-brand-primary p-card-y px-card-x shadow-md shadow-brand/40">
//                                 <Text
//                                     variant="caption"
//                                     color="inverse"
//                                     transform="uppercase"
//                                     className="tracking-widest opacity-90"
//                                 >
//                                     Route not Assigned yet
//                                 </Text>
//                             </View>
//                         )}

//                         <View className="mt-5 flex-row justify-between gap-3">
//                             <StatCard icon="water" label="Bottles" value="128" color="#1B5E37" />
//                             <StatCard icon="restaurant" label="Special" value="16" color="#D4872A" />
//                             <StatCard icon="return-down-back" label="Returns" value="52" color="#4A4A4A" />
//                         </View>

//                         <View className="mt-5">
//                             {activeStop ? (
//                                 <View className="rounded-card border border-border-default bg-bg-card p-card-y px-card-x shadow-sm">
//                                     <View className="mb-3 flex-row items-center justify-between">
//                                         <Text
//                                             variant="label"
//                                             color="brand"
//                                             weight="semibold"
//                                             transform="uppercase"
//                                             className="tracking-widest"
//                                         >
//                                             Next Stop
//                                         </Text>

//                                         <View className="rounded-badge border border-brand/10 bg-brand-light px-2.5 py-1">
//                                             <Text variant="caption-sm" color="brand" weight="bold">
//                                                 Stop #{activeStop.sequence_number}
//                                             </Text>
//                                         </View>
//                                     </View>

//                                     <Text variant="title" weight="bold" color="primary">
//                                         {activeStop.customer_name}
//                                     </Text>

//                                     <Text variant="body" color="secondary" className="mt-1">
//                                         {activeStop.address}
//                                     </Text>

//                                     <View className="mt-4 flex-row flex-wrap gap-2">
//                                         {activeStop.order ? <ItemBadge label={activeStop.order} /> : null}
//                                     </View>

//                                     <View className="mt-5">
//                                         <Button
//                                             label={canMark ? "Mark Delivered" : "Move Closer to Enable"}
//                                             intent="primary"
//                                             size="lg"
//                                             fullWidth
//                                             disabled={!canMark}
//                                             leftIcon={<Ionicons name="checkmark-circle-outline" size={20} color="#fff" />}
//                                             onPress={handleMarkDelivered}
//                                         />
//                                     </View>
//                                 </View>
//                             ) : (
//                                 <View className="rounded-card border border-border-default bg-bg-card p-card-y px-card-x shadow-sm">
//                                     <Text variant="title" weight="bold" color="primary">
//                                         No active stop
//                                     </Text>

//                                     <Text variant="body" color="secondary" className="mt-1">
//                                         Go to your location and start approaching the next customer to see the highlighted card.
//                                     </Text>

//                                     <View className="mt-5">
//                                         <Button
//                                             label="Go to Location"
//                                             intent="primary"
//                                             size="lg"
//                                             fullWidth
//                                             leftIcon={<Ionicons name="locate-outline" size={20} color="#fff" />}
//                                             onPress={() => {
//                                                 mapRef.current?.centerOnUser();
//                                             }}
//                                         />
//                                     </View>
//                                 </View>
//                             )}
//                         </View>

//                         <Text
//                             variant="label"
//                             color="primary"
//                             weight="semibold"
//                             transform="uppercase"
//                             className="mt-6 mb-3 tracking-widest"
//                         >
//                             Quick Actions
//                         </Text>

//                         <View className="flex-row flex-wrap justify-between">
//                             <QuickAction
//                                 icon="map"
//                                 label="Live Map"
//                                 onPress={() => router.push(ROUTES.DRIVER.MAP as any)}
//                                 color="#1B5E37"
//                             />
//                             <QuickAction
//                                 icon="cube-outline"
//                                 label="Bottles"
//                                 onPress={() => { }}
//                                 color="#1B5E37"
//                             />
//                             <QuickAction
//                                 icon="alert-circle-outline"
//                                 label="Report"
//                                 onPress={() => { }}
//                                 color="#D4872A"
//                             />
//                             <QuickAction
//                                 icon="cash-outline"
//                                 label="Cash"
//                                 onPress={() => { }}
//                                 color="#2E7D32"
//                             />
//                             <QuickAction
//                                 icon="checkmark-done-outline"
//                                 label="Attendance"
//                                 onPress={() => { }}
//                                 color="#1B5E37"
//                             />
//                             <QuickAction
//                                 icon="headset-outline"
//                                 label="Support"
//                                 onPress={() => { }}
//                                 color="#4A4A4A"
//                             />
//                         </View>

//                         <View className="mt-2 rounded-card border border-border-default bg-bg-card p-card-y px-card-x shadow-sm">
//                             <Text
//                                 variant="caption"
//                                 color="muted"
//                                 transform="uppercase"
//                                 weight="semibold"
//                                 className="mb-3 tracking-widest"
//                             >
//                                 Today's Summary
//                             </Text>

//                             <View className="flex-row justify-between">
//                                 <SummaryItem label="Delivered" value="38" />
//                                 <SummaryItem label="Pending" value="24" />
//                                 <SummaryItem label="COD" value="₹1,240" />
//                             </View>
//                         </View>

//                         <View className="mt-4 flex-row items-start gap-x-3 rounded-card border border-warning/30 bg-warningLight p-card-y px-card-x">
//                             <Ionicons name="warning-outline" size={24} color="#D4872A" />
//                             <View className="flex-1">
//                                 <Text variant="label" color="warning" weight="bold">
//                                     Special Instruction
//                                 </Text>
//                                 <Text
//                                     variant="body-sm"
//                                     color="warning"
//                                     className="mt-1"
//                                     style={{ opacity: 0.9 }}
//                                 >
//                                     Customer Amit Kumar has requested early delivery before 8 AM.
//                                 </Text>
//                             </View>
//                         </View>
//                     </View>
//                 </ScrollView>
//             </SafeAreaView>
//         </>
//     );
// }

// function StatCard({
//     icon,
//     label,
//     value,
//     color,
// }: {
//     icon: any;
//     label: string;
//     value: string;
//     color: string;
// }) {
//     return (
//         <View className="flex-1 items-center rounded-card border border-border-default bg-bg-card p-3 shadow-sm">
//             <View
//                 className="mb-2 h-8 w-8 items-center justify-center rounded-full"
//                 style={{ backgroundColor: color + "15" }}
//             >
//                 <Ionicons name={icon} size={18} color={color} />
//             </View>
//             <Text variant="title" weight="bold" color="primary" lines={1}>
//                 {value}
//             </Text>
//             <Text variant="caption-sm" color="muted" lines={1} className="mt-0.5">
//                 {label}
//             </Text>
//         </View>
//     );
// }

// function ItemBadge({ label }: { label: string }) {
//     return (
//         <View className="rounded-badge border border-brand/20 bg-brand-light px-3 py-1.5">
//             <Text variant="caption" color="brand" weight="semibold">
//                 {label}
//             </Text>
//         </View>
//     );
// }

// function QuickAction({
//     icon,
//     label,
//     onPress,
//     color,
// }: {
//     icon: any;
//     label: string;
//     onPress: () => void;
//     color: string;
// }) {
//     return (
//         <TouchableOpacity
//             onPress={onPress}
//             className="mb-3 w-[31%] items-center justify-center rounded-card border border-border-default bg-bg-card p-3 shadow-sm"
//         >
//             <View
//                 className="mb-2 h-10 w-10 items-center justify-center rounded-full"
//                 style={{ backgroundColor: color + "15" }}
//             >
//                 <Ionicons name={icon} size={20} color={color} />
//             </View>
//             <Text
//                 variant="caption-sm"
//                 color="primary"
//                 weight="semibold"
//                 lines={1}
//                 className="text-center"
//             >
//                 {label}
//             </Text>
//         </TouchableOpacity>
//     );
// }

// function SummaryItem({ label, value }: { label: string; value: string }) {
//     return (
//         <View className="flex-1 items-center">
//             <Text variant="title" weight="bold" color="primary" lines={1}>
//                 {value}
//             </Text>
//             <Text variant="caption-sm" color="muted" lines={1} className="mt-1">
//                 {label}
//             </Text>
//         </View>
//     );
// }

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
import React, { useRef } from "react";
import {
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function DriverDashboardScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const routeId = useAuthStore((s) => s.route_id);

    const mapRef = useRef<OSMMapHandle>(null);

    const isTripStarted = useTrackingStore((s) => s.isTripStarted);
    const { width } = useWindowDimensions();
    const isCompact = width < 380;
    const screenX = isCompact ? "px-screen-x" : "px-screen-x-md";

    const activeStop = useGeofenceStore((s) => s.getActiveStop());
    const canMark = useGeofenceStore((s) => s.canMarkActiveStopDelivered());
    const route = useGeofenceStore((s) => s.route);

    const handleTripToggle = async () => {
        const { accessToken, route_id } = useAuthStore.getState();
        const { startTrip, stopTrip, isTripStarted } = useTrackingStore.getState();

        if (__DEV__) console.log("trip toggle hit");

        if (!accessToken || !route_id) return;

        if (isTripStarted) {
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

    return (
        <>
            <StatusBar style="dark" />
            <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-bg-screen">
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
                >
                    <View className={screenX}>
                        <View className="flex-row items-center justify-between pb-2">
                            <View className="flex-1 pr-3">
                                <Text
                                    variant="caption"
                                    color="muted"
                                    transform="uppercase"
                                    className="tracking-widest"
                                >
                                    Good Morning 👋
                                </Text>

                                <Text
                                    variant="title"
                                    weight="bold"
                                    color="primary"
                                    lines={1}
                                    className="mt-1"
                                >
                                    {user?.first_name ?? "Driver"}
                                </Text>
                            </View>

                            <View className="flex-row items-center gap-x-3">
                                <View
                                    className={`flex-row items-center gap-x-1.5 rounded-badge border px-3 py-1.5 ${isTripStarted
                                        ? "border-success/30 bg-successLight"
                                        : "border-border-default bg-bg-card"
                                        }`}
                                >
                                    <View
                                        className={`h-2 w-2 rounded-full ${isTripStarted ? "bg-success" : "bg-text-muted"
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

                                <View className="h-avatar-md w-avatar-md items-center justify-center rounded-avatar border border-brand/20 bg-brand-light">
                                    <Ionicons name="person" size={20} color="#1B5E37" />
                                </View>
                            </View>
                        </View>

                        {routeId ? (
                            <View className="mt-4 rounded-card bg-brand-primary p-card-y px-card-x shadow-md shadow-brand/40">
                                <View className="flex-row items-start justify-between gap-4">
                                    <View className="flex-1">
                                        <Text
                                            variant="caption"
                                            color="inverse"
                                            transform="uppercase"
                                            className="tracking-widest opacity-90"
                                        >
                                            Route Assigned
                                        </Text>

                                        <Text
                                            variant="heading"
                                            weight="bold"
                                            color="inverse"
                                            lines={2}
                                            className="mt-1"
                                        >
                                            {route?.name ?? "Nagpur Express Delivery"}
                                        </Text>

                                        <Text variant="caption" color="inverse" className="mt-1 opacity-90">
                                            {route?.stops?.length ?? 0} Deliveries
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleTripToggle}
                                        className={`h-16 w-16 items-center justify-center rounded-full shadow-sm ${isTripStarted ? "bg-error" : "bg-white"
                                            }`}
                                    >
                                        <Ionicons
                                            name={isTripStarted ? "stop" : "play"}
                                            size={24}
                                            color={isTripStarted ? "#fff" : "#1B5E37"}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View className="mt-5 h-2.5 overflow-hidden rounded-full bg-brand-secondary">
                                    <View className="h-full rounded-full bg-white" style={{ width: "61%" }} />
                                </View>

                                <View className="mt-2 flex-row justify-between">
                                    <Text variant="caption" color="inverse" weight="medium">
                                        {route?.stops?.filter((s) => s.order_status === "delivered").length ?? 0} done
                                    </Text>
                                    <Text variant="caption" color="inverse" weight="medium">
                                        ETA 1h 24m
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View className="mt-4 rounded-card bg-brand-primary p-card-y px-card-x shadow-md shadow-brand/40">
                                <Text
                                    variant="caption"
                                    color="inverse"
                                    transform="uppercase"
                                    className="tracking-widest opacity-90"
                                >
                                    Route not Assigned yet
                                </Text>
                            </View>
                        )}

                        <View className="mt-5 flex-row justify-between gap-3">
                            <StatCard icon="water" label="Bottles" value="128" color="#1B5E37" />
                            <StatCard icon="restaurant" label="Special" value="16" color="#D4872A" />
                            <StatCard icon="return-down-back" label="Returns" value="52" color="#4A4A4A" />
                        </View>

                        <View className="mt-5">
                            {activeStop ? (
                                <View className="rounded-card border border-border-default bg-bg-card p-card-y px-card-x shadow-sm">
                                    <View className="mb-3 flex-row items-center justify-between">
                                        <Text
                                            variant="label"
                                            color="brand"
                                            weight="semibold"
                                            transform="uppercase"
                                            className="tracking-widest"
                                        >
                                            Next Stop
                                        </Text>

                                        <View className="rounded-badge border border-brand/10 bg-brand-light px-2.5 py-1">
                                            <Text variant="caption-sm" color="brand" weight="bold">
                                                Stop #{activeStop.sequence_number}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text variant="title" weight="bold" color="primary">
                                        {activeStop.customer_name}
                                    </Text>

                                    <Text variant="body" color="secondary" className="mt-1">
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
                                    <Text variant="title" weight="bold" color="primary">
                                        No active stop
                                    </Text>

                                    <Text variant="body" color="secondary" className="mt-1">
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

                        <View className="mt-2 rounded-card border border-border-default bg-bg-card p-card-y px-card-x shadow-sm">
                            <Text
                                variant="caption"
                                color="muted"
                                transform="uppercase"
                                weight="semibold"
                                className="mb-3 tracking-widest"
                            >
                                Today's Summary
                            </Text>

                            <View className="flex-row justify-between">
                                <SummaryItem label="Delivered" value="38" />
                                <SummaryItem label="Pending" value="24" />
                                <SummaryItem label="COD" value="₹1,240" />
                            </View>
                        </View>

                        <View className="mt-4 flex-row items-start gap-x-3 rounded-card border border-warning/30 bg-warningLight p-card-y px-card-x">
                            <Ionicons name="warning-outline" size={24} color="#D4872A" />
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
        <View className="flex-1 items-center rounded-card border border-border-default bg-bg-card p-3 shadow-sm">
            <View
                className="mb-2 h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: color + "15" }}
            >
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <Text variant="title" weight="bold" color="primary" lines={1}>
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
        <View className="rounded-badge border border-brand/20 bg-brand-light px-3 py-1.5">
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
            className="mb-3 w-[31%] items-center justify-center rounded-card border border-border-default bg-bg-card p-3 shadow-sm"
        >
            <View
                className="mb-2 h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: color + "15" }}
            >
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text
                variant="caption-sm"
                color="primary"
                weight="semibold"
                lines={1}
                className="text-center"
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
    return (
        <View className="flex-1 items-center">
            <Text variant="title" weight="bold" color="primary" lines={1}>
                {value}
            </Text>
            <Text variant="caption-sm" color="muted" lines={1} className="mt-1">
                {label}
            </Text>
        </View>
    );
}
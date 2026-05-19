import React from "react";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    Pressable,
    Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useTrackingStore } from "@/store/trackingStore";
import { ROUTES } from "@/constants/route";
import { StatusBar } from "expo-status-bar";

export function DriverDashboardScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const isTripStarted = useTrackingStore((s) => s.isTripStarted);

    const handleTripToggle = async () => {
        const { accessToken, domain_name } = useAuthStore.getState();
        const { startTrip, stopTrip, connectSocket, startTracking, isTripStarted } =
            useTrackingStore.getState();

        if (!accessToken || !domain_name) return;

        if (isTripStarted) {
            stopTrip(accessToken);
            return;
        }

        const ok = await startTrip(accessToken);
        if (ok) {
            connectSocket(domain_name, accessToken);
            await startTracking();
        }
    };

    return (
        <>
            <StatusBar style="dark" />
            <SafeAreaView edges={["top"]} className="flex-1 bg-bg-screen">
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 10 }}
                >

                    {/* ── Header ─────────────────────────────────────── */}
                    <View className="flex-row items-center justify-between pt-4 pb-2">
                        <View>
                            <Text className="text-caption text-text-muted tracking-widest uppercase">
                                Good Morning 👋
                            </Text>
                            <Text className="text-title font-bold text-text-primary mt-0.5">
                                {user?.first_name ?? "Driver"}
                            </Text>
                        </View>

                        <View className="flex-row items-center gap-x-3">
                            {/* Live / Offline Badge */}
                            <View
                                className={`flex-row items-center gap-x-1.5 px-3 py-1.5 rounded-badge ${isTripStarted ? "bg-success" : "bg-border-disable"
                                    }`}
                            >
                                <View
                                    className={`w-2 h-2 rounded-full ${isTripStarted ? "bg-white" : "bg-text-muted"
                                        }`}
                                />
                                <Text
                                    className={`text-caption font-semibold ${isTripStarted ? "text-text-white" : "text-text-muted"
                                        }`}
                                >
                                    {isTripStarted ? "LIVE" : "OFFLINE"}
                                </Text>
                            </View>

                            {/* Avatar */}
                            <View className="w-10 h-10 rounded-full bg-brand-light items-center justify-center">
                                <Ionicons name="person" size={20} color="#1B5E37" />
                            </View>
                        </View>
                    </View>

                    {/* ── Trip Control Card ───────────────────────────── */}
                    <View className="mt-4 rounded-card bg-brand-primary p-5">
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-caption text-brand-light tracking-widest uppercase">
                                    Today's Route
                                </Text>
                                <Text className="text-body-lg font-bold text-white mt-1">
                                    Nagpur Express Delivery
                                </Text>
                                <Text className="text-caption text-brand-light mt-0.5">
                                    38 / 62 Deliveries Completed
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={handleTripToggle}
                                className={`w-14 h-14 rounded-full items-center justify-center ${isTripStarted ? "bg-error" : "bg-white"
                                    }`}
                            >
                                <Ionicons
                                    name={isTripStarted ? "stop" : "play"}
                                    size={24}
                                    color={isTripStarted ? "#fff" : "#1B5E37"}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Progress Bar */}
                        <View className="mt-4 h-2 rounded-full bg-brand-secondary">
                            <View
                                className="h-2 rounded-full bg-white"
                                style={{ width: "61%" }}
                            />
                        </View>
                        <View className="flex-row justify-between mt-1">
                            <Text className="text-caption text-brand-light">61% done</Text>
                            <Text className="text-caption text-brand-light">ETA 1h 24m</Text>
                        </View>
                    </View>

                    {/* ── Delivery Stats Row ──────────────────────────── */}
                    <View className="mt-4 flex-row gap-x-3">
                        <StatCard icon="water" label="Bottles" value="128" color="#1B5E37" />
                        <StatCard icon="restaurant" label="Special" value="16" color="#D4872A" />
                        <StatCard icon="return-down-back" label="Returns" value="52" color="#4A4A4A" />
                    </View>

                    {/* ── Next Stop Card ──────────────────────────────── */}
                    <View className="mt-4 rounded-card bg-bg-card p-5 border border-border-disable">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-caption tracking-widest text-brand-primary uppercase font-semibold">
                                Next Stop
                            </Text>
                            <View className="bg-brand-light px-2 py-0.5 rounded-badge">
                                <Text className="text-caption text-brand-primary font-semibold">
                                    Stop #4
                                </Text>
                            </View>
                        </View>

                        <Text className="text-body-lg font-bold text-text-primary">
                            Mrs. Deshmukh
                        </Text>
                        <Text className="text-body text-text-secondary mt-0.5">
                            Row House 9, Ramdaspeth, Nagpur
                        </Text>

                        <View className="flex-row gap-x-2 mt-3">
                            <ItemBadge label="2 Milk" />
                            <ItemBadge label="1 Paneer" />
                        </View>

                        <TouchableOpacity className="mt-4 bg-brand-primary rounded-btn py-3.5 items-center">
                            <Text className="text-white font-semibold text-body-lg">
                                Mark Delivered ✓
                            </Text>
                        </TouchableOpacity>
                        <Pressable
                            onPress={() => console.log("Helllooo")}
                            android_ripple={{
                                color: "rgba(255, 11, 11, 0.25)",
                            }}
                            className="mt-4 overflow-hidden rounded-btn"
                            style={({ pressed }) => ({
                                opacity:
                                    Platform.OS === "ios"
                                        ? pressed
                                            ? 0.8
                                            : 1
                                        : 1,
                            })}
                        >
                            <View className="items-center rounded-btn bg-brand-primary py-3.5">
                                <Text className="text-body-lg font-semibold text-white">
                                    Mark Delivered ✓
                                </Text>
                            </View>
                        </Pressable>
                    </View>

                    {/* ── Quick Actions ───────────────────────────────── */}
                    <Text className="mt-6 mb-3 text-label font-semibold text-text-primary">
                        Quick Actions
                    </Text>

                    <View className="flex-row flex-wrap gap-3">
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
                            color="#1B5E37"
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

                    {/* ── Today's Earnings ────────────────────────────── */}
                    <View className="mt-6 rounded-card bg-bg-card p-5 border border-border-disable">
                        <Text className="text-caption tracking-widest text-text-muted uppercase font-semibold mb-3">
                            Today's Summary
                        </Text>
                        <View className="flex-row justify-between">
                            <SummaryItem label="Delivered" value="38" />
                            <SummaryItem label="Pending" value="24" />
                            <SummaryItem label="COD" value="₹1,240" />
                        </View>
                    </View>

                    {/* ── Alerts ──────────────────────────────────────── */}
                    <View className="mt-4 rounded-card bg-warning/10 border border-warning/30 p-4 flex-row items-start gap-x-3">
                        <Ionicons name="warning-outline" size={20} color="#D4872A" />
                        <View className="flex-1">
                            <Text className="text-label font-semibold text-warning">
                                Special Instruction
                            </Text>
                            <Text className="text-body text-text-secondary mt-0.5">
                                Customer Amit Kumar has requested early delivery before 8 AM.
                            </Text>
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView >
        </>
    );
}

// ── Sub Components ───────────────────────────────────────────

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
        <View className="flex-1 bg-bg-card rounded-card p-4 border border-border-disable">
            <Ionicons name={icon} size={20} color={color} />
            <Text className="text-2xl font-bold text-text-primary mt-2">{value}</Text>
            <Text className="text-caption text-text-muted mt-0.5">{label}</Text>
        </View>
    );
}

function ItemBadge({ label }: { label: string }) {
    return (
        <View className="bg-brand-light px-3 py-1.5 rounded-badge">
            <Text className="text-caption font-semibold text-brand-primary">
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
            className="bg-bg-card border border-border-disable rounded-card items-center justify-center py-4"
            style={{ width: "30.5%" }}
        >
            <View
                className="w-10 h-10 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: color + "18" }}
            >
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text className="text-caption font-semibold text-text-primary">
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
    return (
        <View className="items-center">
            <Text className="text-xl font-bold text-text-primary">{value}</Text>
            <Text className="text-caption text-text-muted mt-0.5">{label}</Text>
        </View>
    );
}
import React from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Text } from "@/shared/ui/Text/Text";
import { useGeofenceStore } from "@/store/geofenceStore";
import { useFetchMyRoute } from "@/features/map/hooks/useFetchMyRoute";
import { asyncStorage } from "@/services/storage/asyncStorage";

export function BottlesDetailScreen() {
    const { isLoading: isRouteLoading } = useFetchMyRoute();
    const route = useGeofenceStore((s) => s.route);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const dispatch1L = route?.dispatch_bottles_1L ?? 0;
    const dispatch500ml = route?.dispatch_bottles_500ml ?? 0;
    const totalBottles = dispatch1L + dispatch500ml;

    const [returnedCount, setReturnedCount] = React.useState(0);

    React.useEffect(() => {
        const loadReturnedBottles = async () => {
            try {
                const todayStr = new Date().toISOString().split("T")[0];
                const storedStr = await asyncStorage.getItem("returned_bottles_data");
                if (storedStr) {
                    const parsed = JSON.parse(storedStr);
                    if (parsed) {
                        if (parsed.date === todayStr) {
                            setReturnedCount(parsed.count || 0);
                            return;
                        } else {
                            // Date is different, reset to 0
                            await asyncStorage.setItem(
                                "returned_bottles_data",
                                JSON.stringify({ count: 0, date: todayStr })
                            );
                        }
                    }
                }
                setReturnedCount(0);
            } catch (err) {
                console.warn("Error loading returned bottles count:", err);
            }
        };

        loadReturnedBottles();

        // Check date mismatch every 30 seconds to handle active screen crossing 12 AM midnight
        const timer = setInterval(() => {
            loadReturnedBottles();
        }, 30000);

        return () => clearInterval(timer);
    }, []);

    // Parse route details
    const rawRouteName = route?.name ?? "No Assigned Route";
    const nameParts = rawRouteName.split(/\s*[-|/]\s*/).map(p => p.trim()).filter(Boolean);
    const areaName = nameParts[0] || "No Assigned Route";
    const deliveryDate = route?.delivery_date || nameParts[2] || new Date().toISOString().split("T")[0];

    if (isRouteLoading) {
        return (
            <ScreenWrapper title="Bottle Details" screenBgColor="#0f172a" disablePadding>
                <View className="flex-1 items-center justify-center bg-bg-screen">
                    <ActivityIndicator size="large" color="#1B5E37" />
                    <Text className="mt-4 text-[#1B5E37] text-[16px] font-semibold">
                        Loading dispatch details...
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper
            title="Bottle Details"
            screenBgColor="#0f172a"
            disablePadding
        >
            <View className="flex-1 bg-bg-screen">
                {/* Custom Header matching DriverDashboardScreen */}
                <View
                    className="bg-[#1B5E37] px-4 pb-6 rounded-b-[35px] shadow-sm"
                    style={{ paddingTop: insets.top + 16 }}
                >
                    <View className="flex-row items-center gap-x-3 pt-2">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
                        >
                            <Ionicons name="arrow-back" size={22} color="white" />
                        </TouchableOpacity>
                        <View className="flex-1">
                            <Text className="text-[20px] font-bold text-white">
                                Bottle Dispatch
                            </Text>
                            <Text className="text-[13px] font-medium text-white/70 mt-0.5">
                                Morning stock verification
                            </Text>
                        </View>
                    </View>

                    {route ? (
                        <View className="mt-5 rounded-[20px] bg-[#D1E0D6] p-4 shadow-xs">
                            <Text className="text-[16px] font-bold text-[#1A1A1A]">
                                {areaName}
                            </Text>
                            <View className="flex-row justify-between items-center mt-2">
                                <Text className="text-xs font-semibold text-[#4A4A4A]">
                                    Date: {deliveryDate}
                                </Text>
                                <View className="rounded-full bg-[#1B5E37]/10 px-2.5 py-1">
                                    <Text className="text-xs font-bold text-[#1B5E37]">
                                        Assigned
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View className="mt-5 rounded-[20px] bg-[#FDECEC] p-4 shadow-xs">
                            <Text className="text-[15px] font-bold text-[#E53E3E]">
                                No Route Assigned Yet
                            </Text>
                            <Text className="text-xs font-medium text-[#E53E3E]/80 mt-1">
                                Bottle dispatch quantities will appear here once a route is assigned.
                            </Text>
                        </View>
                    )}
                </View>

                {route ? (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}
                    >
                        {/* Summary Description Card */}
                        <View className="rounded-[24px] border border-border-default bg-bg-card p-5 shadow-sm mb-5">
                            <View className="flex-row items-start gap-x-3">
                                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#1B5E37]/10">
                                    <Ionicons name="cube-outline" size={20} color="#1B5E37" />
                                </View>
                                <View className="flex-1">
                                    <Text variant="subhead" weight="bold" color="primary">
                                        Morning Loadout
                                    </Text>
                                    <Text variant="body-sm" color="secondary" className="mt-1 leading-relaxed">
                                        These are the exact number of water bottles you should carry with you in the delivery vehicle this morning. Verify physical counts match before leaving.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Dispatch Cards */}
                        <View className="flex-row justify-between gap-x-3 mb-5">
                            {/* 1L Card */}
                            <View className="flex-1 rounded-[24px] bg-bg-card border border-border-default p-5 shadow-sm items-center relative overflow-hidden">
                                <View className="absolute -right-4 -top-4 w-12 h-12 rounded-full bg-[#1B5E37]/5" />
                                <View className="mb-4 h-12 w-12 items-center justify-center rounded-full bg-[#1B5E37]/10">
                                    <Ionicons name="water" size={24} color="#1B5E37" />
                                </View>
                                <Text className="text-[32px] font-extrabold text-[#1B5E37]">
                                    {dispatch1L}
                                </Text>
                                <Text variant="subhead" weight="bold" color="primary" className="mt-1">
                                    1L Bottles
                                </Text>
                                <Text variant="caption-sm" color="muted" className="mt-0.5 font-semibold">
                                    Morning stock
                                </Text>
                            </View>

                            {/* 500ml Card */}
                            <View className="flex-1 rounded-[24px] bg-bg-card border border-border-default p-5 shadow-sm items-center relative overflow-hidden">
                                <View className="absolute -right-4 -top-4 w-12 h-12 rounded-full bg-[#2E7D52]/5" />
                                <View className="mb-4 h-12 w-12 items-center justify-center rounded-full bg-[#2E7D52]/10">
                                    <Ionicons name="water-outline" size={24} color="#2E7D52" />
                                </View>
                                <Text className="text-[32px] font-extrabold text-[#2E7D52]">
                                    {dispatch500ml}
                                </Text>
                                <Text variant="subhead" weight="bold" color="primary" className="mt-1">
                                    500ml Bottles
                                </Text>
                                <Text variant="caption-sm" color="muted" className="mt-0.5 font-semibold">
                                    Morning stock
                                </Text>
                            </View>
                        </View>

                        {/* Total Card */}
                        <View className="rounded-[24px] border border-border-default bg-[#F4FAF7] p-5 shadow-sm mb-5 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-x-3.5">
                                <View className="h-11 w-11 items-center justify-center rounded-full bg-[#1B5E37]">
                                    <Ionicons name="checkmark-done" size={22} color="white" />
                                </View>
                                <View>
                                    <Text variant="body" weight="bold" color="primary">
                                        Total Bottles to Carry
                                    </Text>
                                    <Text variant="caption-sm" color="muted" className="mt-0.5 font-semibold">
                                        Sum of 1L and 500ml crates
                                    </Text>
                                </View>
                            </View>
                            <Text className="text-[28px] font-extrabold text-[#1B5E37]">
                                {totalBottles}
                            </Text>
                        </View>

                        {/* Returned Bottles Card */}
                        <View className="rounded-[24px] border border-border-default bg-[#F0F4F8] p-5 shadow-sm mb-6 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-x-3.5">
                                <View className="h-11 w-11 items-center justify-center rounded-full bg-[#2B6CB0]">
                                    <Ionicons name="return-down-back" size={22} color="white" />
                                </View>
                                <View>
                                    <Text variant="body" weight="bold" color="primary">
                                        Returned Bottles (Today)
                                    </Text>
                                    <Text variant="caption-sm" color="muted" className="mt-0.5 font-semibold">
                                        Total empty bottles collected today
                                    </Text>
                                </View>
                            </View>
                            <Text className="text-[28px] font-extrabold text-[#2B6CB0]">
                                {returnedCount}
                            </Text>
                        </View>

                        {/* Checklist/Confirmation Section */}
                        <Text
                            variant="label"
                            color="primary"
                            weight="bold"
                            transform="uppercase"
                            className="mb-3.5 tracking-widest"
                        >
                            Loading Instructions
                        </Text>

                        <View className="rounded-[24px] border border-border-default bg-bg-card p-4 shadow-sm gap-y-4">
                            <InstructionItem
                                icon="shield-checkmark-outline"
                                text="Verify water seals are unbroken on all bottles."
                            />
                            <View className="h-px bg-border-subtle" />
                            <InstructionItem
                                icon="car-outline"
                                text="Secure loading crates in vehicle to avoid damage."
                            />
                            <View className="h-px bg-border-subtle" />
                            <InstructionItem
                                icon="warning-outline"
                                text="Report any count mismatch to the dispatcher immediately."
                            />
                        </View>
                    </ScrollView>
                ) : (
                    <View className="flex-1 items-center justify-center px-6">
                        <Ionicons name="alert-circle-outline" size={48} color="#757575" />
                        <Text variant="subhead" weight="bold" color="primary" className="mt-3">
                            No Active Route
                        </Text>
                        <Text variant="body-sm" color="secondary" align="center" className="mt-2">
                            Please contact your supervisor if you have not been assigned an active delivery route for today.
                        </Text>
                    </View>
                )}
            </View>
        </ScreenWrapper>
    );
}

function InstructionItem({ icon, text }: { icon: any; text: string }) {
    return (
        <View className="flex-row items-start gap-x-3.5">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-[#1B5E37]/10 mt-0.5">
                <Ionicons name={icon} size={15} color="#1B5E37" />
            </View>
            <Text variant="body-sm" color="secondary" className="flex-1 leading-relaxed">
                {text}
            </Text>
        </View>
    );
}

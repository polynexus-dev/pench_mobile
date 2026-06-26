import { subscriptionApi, SubscriptionSummary, DailySummary } from "@/features/dashboard/api/subscriptionApi";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View, Modal, Animated, Easing } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Calendar, DateData } from "react-native-calendars";
import { StatusBar } from "expo-status-bar";
import { useIsFocused } from "@react-navigation/native";

function SubscriptionDetailsCard({
    sub,
}: {
    sub: SubscriptionSummary;
}) {
    const isPaused = sub.is_paused;
    const items = sub.items || [];
    const productName = items[0]?.product_name || "Milk Delivery Plan";
    const quantity = items[0]?.quantity || 1;

    return (
        <View
            className="mb-4 overflow-hidden rounded-2xl bg-white p-4 border border-neutral-100 shadow-sm"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
            }}
        >
            {/* Top row with Title & Badge */}
            <View className="mb-4 flex-row items-start justify-between">
                <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-[#E8F5EE]">
                        <Ionicons name="water" size={18} color="#1B5E37" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-[15px] font-bold text-gray-900 leading-tight">
                            {productName}
                        </Text>
                        <Text className="text-[11px] text-gray-500 font-semibold mt-0.5">
                            {sub.frequency_display} Delivery
                        </Text>
                    </View>
                </View>
                <View className={`rounded-full px-2.5 py-1 ${isPaused ? "bg-amber-100" : "bg-green-100"}`}>
                    <Text className={`text-[10px] font-bold ${isPaused ? "text-amber-700" : "text-green-700"}`}>
                        {isPaused ? "PAUSED" : "ACTIVE"}
                    </Text>
                </View>
            </View>

            {/* Details Section */}
            <View className="border-t border-gray-50 pt-3 flex-row flex-wrap justify-between gap-y-3">
                <View className="w-[48%]">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Start Date</Text>
                    <Text className="text-xs font-semibold text-gray-800 mt-0.5">
                        {sub.subscription_start || "—"}
                    </Text>
                </View>
                <View className="w-[48%] items-end">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">End Date</Text>
                    <Text className="text-xs font-semibold text-gray-800 mt-0.5">
                        {sub.subscription_end || "Continuous"}
                    </Text>
                </View>
                <View className="w-[48%]">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quantity</Text>
                    <Text className="text-xs font-semibold text-gray-800 mt-0.5">
                        {quantity} {sub.items?.[0]?.product_id ? "Litre(s)" : ""}
                    </Text>
                </View>
                <View className="w-[48%] items-end">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</Text>
                    <Text className="text-xs font-semibold text-gray-800 mt-0.5 capitalize">
                        {sub.status}
                    </Text>
                </View>
            </View>

            {/* Items List (if more than 1 item) */}
            {items.length > 1 && (
                <View className="mt-3 border-t border-gray-50 pt-3">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        All Items in Plan
                    </Text>
                    {items.map((item, idx) => (
                        <View key={idx} className="flex-row justify-between items-center py-1.5 border-b border-neutral-50 last:border-b-0">
                            <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                                <Ionicons name="cube-outline" size={14} color="#6B7280" />
                                <Text className="text-xs font-semibold text-gray-700 leading-tight" numberOfLines={1}>
                                    {item.product_name}
                                </Text>
                            </View>
                            <Text className="text-xs font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                Qty: {item.quantity}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Delivery Details: Address & Special Instructions (if exist on summary object) */}
            {((sub as any).delivery_address || (sub as any).special_instructions) && (
                <View className="mt-3 border-t border-gray-50 pt-3">
                    {(sub as any).delivery_address && (
                        <View className="mb-2">
                            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivery Address</Text>
                            <Text className="text-xs text-gray-600 mt-0.5 leading-normal">
                                {(sub as any).delivery_address}
                            </Text>
                        </View>
                    )}
                    {(sub as any).special_instructions && (
                        <View>
                            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Special Instructions</Text>
                            <Text className="text-xs text-amber-700 font-medium mt-0.5 leading-normal">
                                {(sub as any).special_instructions}
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

function SubscriptionModelCard({
    model,
    onSubscribe,
}: {
    model: any;
    onSubscribe: (model: any) => void;
}) {
    return (
        <View 
            className="mb-4 overflow-hidden rounded-2xl bg-white p-4 border border-neutral-100 shadow-sm"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
            }}
        >
            <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-[#E8F5EE]">
                    <Ionicons name="water" size={18} color="#1B5E37" />
                </View>
                <View className="flex-1">
                    <Text className="text-[14px] font-bold text-gray-900 leading-tight">
                        {model.product_name}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                        <View className="bg-gray-100 rounded px-1.5 py-0.5">
                            <Text className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">
                                {model.frequency_display}
                            </Text>
                        </View>
                        <Text className="text-xs text-gray-500 font-semibold">
                            Qty: {model.quantity} ({model.unit})
                        </Text>
                    </View>
                </View>
            </View>

            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <Text className="text-[11px] text-gray-400 font-semibold">
                    🔥 {model.count} customers subscribed
                </Text>
                <TouchableOpacity
                    onPress={() => onSubscribe(model)}
                    activeOpacity={0.8}
                    className="bg-[#1B5E37] px-3.5 py-1.5 rounded-xl shadow-xs"
                >
                    <Text className="text-white text-[11px] font-bold">
                        Subscribe
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function CalendarSkeleton() {
    const pulseAnim = React.useRef(new Animated.Value(0.3)).current;

    React.useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.7,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    const daysOfWeek = Array.from({ length: 7 });
    const gridRows = Array.from({ length: 5 });

    return (
        <View
            className="mb-4 rounded-2xl bg-white p-4 border border-gray-100"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
            }}
        >
            {/* Header placeholder */}
            <View className="flex-row justify-between items-center mb-6">
                <Animated.View style={{ opacity: pulseAnim }} className="h-6 w-6 rounded bg-gray-200" />
                <Animated.View style={{ opacity: pulseAnim }} className="h-6 w-32 rounded bg-gray-200" />
                <Animated.View style={{ opacity: pulseAnim }} className="h-6 w-6 rounded bg-gray-200" />
            </View>

            {/* Days of the week row */}
            <View className="flex-row justify-between mb-4">
                {daysOfWeek.map((_, idx) => (
                    <Animated.View
                        key={idx}
                        style={{ opacity: pulseAnim }}
                        className="h-3 w-8 rounded bg-gray-200"
                    />
                ))}
            </View>

            {/* Calendar grid rows */}
            <View className="gap-y-4">
                {gridRows.map((_, rowIdx) => (
                    <View key={rowIdx} className="flex-row justify-between">
                        {daysOfWeek.map((_, colIdx) => (
                            <Animated.View
                                key={colIdx}
                                style={{ opacity: pulseAnim }}
                                className="h-8 w-8 rounded-full bg-gray-200"
                            />
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
}

function getStatusDetails(status: string) {
    switch (status) {
        case "delivered":
            return {
                title: "Delivered",
                icon: "checkmark-circle" as const,
                bgClass: "bg-green-50 border-green-100",
                iconColor: "#22C55E",
                textColor: "text-green-800",
                description: "Your delivery was completed successfully.",
                sheetBg: "#E8F5EE",
            };
        case "scheduled":
            return {
                title: "Scheduled",
                icon: "calendar" as const,
                bgClass: "bg-blue-50 border-blue-100",
                iconColor: "#3B82F6",
                textColor: "text-blue-800",
                description: "This delivery is scheduled and will arrive on time.",
                sheetBg: "#EFF6FF",
            };
        case "vacation":
            return {
                title: "Vacation Pause",
                icon: "pause-circle" as const,
                bgClass: "bg-amber-50 border-amber-100",
                iconColor: "#F59E0B",
                textColor: "text-amber-800",
                description: "Delivery is temporarily paused for your vacation gap.",
                sheetBg: "#FFFBEB",
            };
        case "skipped":
        case "undelivered":
            return {
                title: "Skipped / Undelivered",
                icon: "close-circle" as const,
                bgClass: "bg-red-50 border-red-100",
                iconColor: "#EF4444",
                textColor: "text-red-800",
                description: "Delivery was skipped or could not be completed on this day.",
                sheetBg: "#FEF2F2",
            };
        case "in_transit":
            return {
                title: "In Transit",
                icon: "bicycle" as const,
                bgClass: "bg-purple-50 border-purple-100",
                iconColor: "#A855F7",
                textColor: "text-purple-800",
                description: "Your order is in transit and on the way to you.",
                sheetBg: "#FAF5FF",
            };
        case "pending":
            return {
                title: "Pending",
                icon: "hourglass-outline" as const,
                bgClass: "bg-neutral-50 border-neutral-200",
                iconColor: "#737373",
                textColor: "text-neutral-700",
                description: "The delivery status is currently pending update.",
                sheetBg: "#FAFAFA",
            };
        case "off_day":
        case "not_active":
        default:
            return {
                title: "No Delivery",
                icon: "remove-circle-outline" as const,
                bgClass: "bg-gray-50 border-gray-100",
                iconColor: "#9CA3AF",
                textColor: "text-gray-600",
                description: "No delivery is scheduled for this day.",
                sheetBg: "#F5F8F6",
            };
    }
}

function formatDateString(dateStr: string): string {
    if (!dateStr) return "";
    try {
        const parts = dateStr.split("-");
        if (parts.length !== 3) return dateStr;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return dateStr;
    }
}

export default function SubscriptionsScreen() {
    const { user } = useAuthStore();
    const isFocused = useIsFocused();
    const domainName = useAuthStore((s) => s.domain_name) || "";
    const [subs, setSubs] = useState<SubscriptionSummary[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Bottom Sheet Refs & Snap Points
    const addPlanSheetRef = useRef<BottomSheetModal>(null);
    const statusSheetRef = useRef<BottomSheetModal>(null);
    const addPlanSnapPoints = useMemo(() => ["80%"], []);
    const statusSnapPoints = useMemo(() => ["75%"], []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                opacity={0.5}
            />
        ),
        []
    );

    // Calendar states
    const [isSelectingVacation, setIsSelectingVacation] = useState(false);
    const [vacationStart, setVacationStart] = useState<string | null>(null);
    const [vacationEnd, setVacationEnd] = useState<string | null>(null);
    const [selectedDayInfo, setSelectedDayInfo] = useState<DailySummary | null>(null);

    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);


    const fetchSubs = async () => {
        if (!domainName || !user?.id) return;
        if (!refreshing) {
            setLoading(true);
        }
        try {
            const targetId = user.customer_uuid || user.id.toString();
            
            let summaryData: any = { subscriptions: [] };
            let modelsData: any[] = [];
            
            try {
                summaryData = await subscriptionApi.getCustomerMonthlySummary(domainName, targetId, currentYear, currentMonth);
            } catch (err) {
                console.warn("Failed to fetch monthly summary:", err);
            }
            
            try {
                modelsData = await subscriptionApi.getGroupedSummary(domainName);
            } catch (err) {
                console.warn("Failed to fetch subscription models:", err);
            }
            
            const subList: SubscriptionSummary[] = summaryData.subscriptions || [];
            setSubs(subList);
            setModels(modelsData || []);

            // Auto-select
            if (subList.length > 0) {
                if (!selectedSubId || !subList.some((s: SubscriptionSummary) => s.subscription_id === selectedSubId)) {
                    setSelectedSubId(subList[0].subscription_id);
                }
            } else {
                setSelectedSubId(null);
            }
        } catch (e) {
            console.warn("Failed to fetch subscriptions:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (domainName) {
            fetchSubs();
        }
    }, [domainName, currentYear, currentMonth]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSubs();
    };

    const handleSubscribe = (model: any) => {
        Alert.alert(
            "Subscribe to Plan",
            `Would you like to subscribe to:\n${model.label}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Subscribe",
                    onPress: () => {
                        Alert.alert("Success", "Your subscription request has been submitted successfully! Our team will contact you shortly to activate it.");
                        addPlanSheetRef.current?.dismiss();
                    }
                }
            ]
        );
    };

    const selectedSub = subs.find((s) => s.subscription_id === selectedSubId);

    const handleDayPress = (day: DateData) => {
        if (!isSelectingVacation) {
            const dayInfo = selectedSub?.daily?.find((d) => d.date === day.dateString);
            if (dayInfo) {
                setSelectedDayInfo(dayInfo);
            } else {
                setSelectedDayInfo({
                    date: day.dateString,
                    status: "not_active",
                });
            }
            statusSheetRef.current?.present();
            return;
        }

        const todayStr = new Date().toISOString().split("T")[0];
        if (day.dateString < todayStr) {
            Alert.alert("Invalid Date", "You cannot select a past date for a vacation gap.");
            return;
        }

        if (!vacationStart || (vacationStart && vacationEnd)) {
            setVacationStart(day.dateString);
            setVacationEnd(null);
        } else {
            const d1 = new Date(vacationStart);
            const d2 = new Date(day.dateString);
            if (d2 < d1) {
                setVacationStart(day.dateString);
                setVacationEnd(vacationStart);
            } else {
                setVacationEnd(day.dateString);
            }
        }
    };

    const submitVacation = async () => {
        if (!selectedSubId || !vacationStart) {
            Alert.alert("Incomplete", "Please select at least a start date.");
            return;
        }
        const end = vacationEnd || vacationStart;
        try {
            await subscriptionApi.addVacationGap(
                domainName,
                selectedSubId,
                vacationStart,
                end
            );
            Alert.alert("Success", "Vacation gap scheduled!");
            setIsSelectingVacation(false);
            setVacationStart(null);
            setVacationEnd(null);
            fetchSubs();
        } catch {
            Alert.alert("Error", "Could not set vacation gap.");
        }
    };

    const buildMarkedDates = () => {
        const marked: any = {};

        if (selectedSub?.daily) {
            selectedSub.daily.forEach((dayInfo: any) => {
                let color = "";
                let textColor = "#1A1A1A";
                if (dayInfo.status === "delivered") {
                    color = "rgba(34, 197, 94, 0.15)";
                    textColor = "#15803D";
                } else if (dayInfo.status === "scheduled") {
                    color = "rgba(59, 130, 246, 0.15)";
                    textColor = "#1D4ED8";
                } else if (dayInfo.status === "vacation") {
                    color = "rgba(245, 158, 11, 0.15)";
                    textColor = "#C2410C";
                } else if (dayInfo.status === "skipped" || dayInfo.status === "undelivered") {
                    color = "rgba(239, 68, 68, 0.15)";
                    textColor = "#B91C1C";
                }

                if (color) {
                    marked[dayInfo.date] = { 
                        selected: true, 
                        selectedColor: color,
                        selectedTextColor: textColor,
                        color: color,
                        textColor: textColor
                    };
                }
            });
        }

        if (isSelectingVacation && vacationStart) {
            let startStr = vacationStart;
            let endStr = vacationEnd || vacationStart;

            if (new Date(startStr) > new Date(endStr)) {
                startStr = vacationEnd!;
                endStr = vacationStart;
            }

            if (startStr === endStr) {
                marked[startStr] = {
                    selected: true,
                    startingDay: true,
                    endingDay: true,
                    color: "#6366F1",
                    textColor: "white",
                    selectedColor: "#6366F1",
                    selectedTextColor: "white",
                };
            } else {
                marked[startStr] = {
                    selected: true,
                    startingDay: true,
                    color: "#6366F1",
                    textColor: "white",
                    selectedColor: "#6366F1",
                    selectedTextColor: "white",
                };
                let current = new Date(startStr);
                const end = new Date(endStr);
                current.setDate(current.getDate() + 1);
                while (current < end) {
                    const dateStr = current.toISOString().split("T")[0];
                    marked[dateStr] = { 
                        selected: true,
                        color: "#A5B4FC", 
                        textColor: "white",
                        selectedColor: "#A5B4FC",
                        selectedTextColor: "white",
                    };
                    current.setDate(current.getDate() + 1);
                }
                marked[endStr] = {
                    selected: true,
                    endingDay: true,
                    color: "#6366F1",
                    textColor: "white",
                    selectedColor: "#6366F1",
                    selectedTextColor: "white",
                };
            }
        }

        return marked;
    };

    return (
        <ScreenWrapper 
            showHeader={true}
            title="Subscriptions"
            headerBgColor="#1B5E37"
            screenBgColor="#F5F8F6"
        >
            {isFocused && <StatusBar style="light" translucent backgroundColor="transparent" />}

            {loading && subs.length === 0 && models.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#1B5E37" />
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {subs.length === 0 ? (
                        <View className="mt-4">
                            <Text className="mb-3 text-[14px] font-bold text-gray-500 uppercase tracking-wider">
                                Recommended Plans
                            </Text>
                            {models.map((model, idx) => (
                                <SubscriptionModelCard
                                    key={idx}
                                    model={model}
                                    onSubscribe={handleSubscribe}
                                />
                            ))}
                            {models.length === 0 && (
                                <View className="mt-12 items-center justify-center px-4">
                                    <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                                    <Text className="mt-4 text-center text-[16px] font-bold text-gray-900">
                                        No active subscriptions
                                    </Text>
                                    <Text className="mt-2 text-center text-[14px] text-gray-500">
                                        You don't have any active subscriptions yet.
                                    </Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <>
                            {/* Selector for multiple plans (only if more than 1 plan exists) */}
                            {subs.length > 1 && (
                                <View className="mb-3">
                                    <Text className="mb-2 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                                        Select Plan
                                    </Text>
                                    <ScrollView 
                                        horizontal 
                                        showsHorizontalScrollIndicator={false} 
                                        contentContainerStyle={{ paddingRight: 16 }}
                                        className="flex-row mb-2"
                                    >
                                        {subs.map((item, index) => {
                                            const isSelected = item.subscription_id === selectedSubId;
                                            const title = item.items?.[0]?.product_name || `Plan ${index + 1}`;
                                            return (
                                                <TouchableOpacity
                                                    key={item.subscription_id}
                                                    onPress={() => {
                                                        setSelectedSubId(item.subscription_id);
                                                        setIsSelectingVacation(false);
                                                        setVacationStart(null);
                                                        setVacationEnd(null);
                                                    }}
                                                    activeOpacity={0.8}
                                                    className={`px-4 py-2 rounded-full mr-2 border ${
                                                        isSelected 
                                                            ? "bg-[#1B5E37] border-[#1B5E37]" 
                                                            : "bg-white border-neutral-200"
                                                    }`}
                                                >
                                                    <Text className={`text-[12px] font-bold ${isSelected ? "text-white" : "text-gray-600"}`}>
                                                        {title} ({item.frequency_display})
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Single Unified Details Component */}
                            {selectedSub && (
                                <View className="mt-2">
                                    <Text className="mb-2 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                                        Plan Details
                                    </Text>
                                    <SubscriptionDetailsCard sub={selectedSub} />
                                </View>
                            )}

                            {/* Add Subscription Button */}
                            <TouchableOpacity
                                onPress={() => addPlanSheetRef.current?.present()}
                                activeOpacity={0.8}
                                className="mb-6 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-[#1B5E37] py-3.5 bg-[#E8F5EE]/40"
                            >
                                <Ionicons name="add" size={18} color="#1B5E37" />
                                <Text className="text-[14px] font-bold text-[#1B5E37]">
                                    Add New Subscription
                                </Text>
                            </TouchableOpacity>
                            

                            {/* Delivery Calendar for selected subscription */}
                            {selectedSub && (
                                <View className="mt-4">
                                    <Text className="mb-3 text-[14px] font-bold text-gray-500 uppercase tracking-wider">
                                        Delivery Calendar
                                    </Text>

                                    {/* Calendar Card */}
                                    {loading ? (
                                        <CalendarSkeleton />
                                    ) : (
                                        <View
                                            className="mb-4 rounded-2xl bg-white p-4 border border-gray-100"
                                            style={{
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.05,
                                                shadowRadius: 2,
                                                elevation: 2,
                                            }}
                                        >
                                            <Calendar
                                                current={`${currentYear}-${currentMonth.toString().padStart(2, "0")}-01`}
                                                key={`${currentYear}-${currentMonth}`}
                                                onMonthChange={(date) => {
                                                    setLoading(true);
                                                    setCurrentYear(date.year);
                                                    setCurrentMonth(date.month);
                                                }}
                                                minDate={isSelectingVacation ? new Date().toISOString().split("T")[0] : undefined}
                                                markingType={isSelectingVacation ? "period" : "dot"}
                                                markedDates={buildMarkedDates()}
                                                onDayPress={handleDayPress}
                                                theme={{
                                                    todayTextColor: "#1B5E37",
                                                    arrowColor: "#1B5E37",
                                                    textDayFontWeight: "500",
                                                    textMonthFontWeight: "bold",
                                                }}
                                            />
                                        </View>
                                    )}

                                    {isSelectingVacation && (
                                        <View className="mb-4 px-1">
                                            <Text className="text-[12px] text-gray-900 font-bold leading-normal">
                                                Instructions: Tap a start date and then an end date to pause your delivery. Tap the same day twice for a 1-day pause.
                                            </Text>
                                        </View>
                                    )}

                                    {/* Action Pause / Schedule Button */}
                                    {!isSelectingVacation ? (
                                        <TouchableOpacity
                                            onPress={() => setIsSelectingVacation(true)}
                                            className="rounded-xl bg-[#1B5E37] py-3.5 items-center"
                                            style={{
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.05,
                                                shadowRadius: 1,
                                                elevation: 1,
                                            }}
                                        >
                                            <Text className="text-[15px] font-bold text-white">
                                                Pause Delivery (Vacation Gap)
                                            </Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View className="rounded-xl bg-gray-100 p-4 border border-gray-200">
                                            <View className="flex-row gap-3">
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setIsSelectingVacation(false);
                                                        setVacationStart(null);
                                                        setVacationEnd(null);
                                                    }}
                                                    className="flex-1 rounded-lg bg-white py-2.5 items-center border border-gray-300"
                                                >
                                                    <Text className="text-[14px] font-bold text-gray-700">Cancel</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={submitVacation}
                                                    disabled={!vacationStart}
                                                    className={`flex-1 rounded-lg py-2.5 items-center ${vacationStart ? "bg-[#1B5E37]" : "bg-gray-400"
                                                        }`}
                                                >
                                                    <Text className="text-[14px] font-bold text-white">Confirm</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            )}

            {/* Modal for Adding New Subscription */}
            <BottomSheetModal
                ref={addPlanSheetRef}
                index={0}
                snapPoints={addPlanSnapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: "#F5F8F6" }}
                handleIndicatorStyle={{ backgroundColor: "#D1D5DB" }}
            >
                <BottomSheetView style={{ flex: 1 }}>
                    <View className="flex-1 p-6">
                        {/* Modal Header */}
                        <View className="flex-row justify-between items-center mb-5">
                            <Text className="text-[18px] font-bold text-gray-900">
                                Add New Plan
                            </Text>
                            <TouchableOpacity
                                onPress={() => addPlanSheetRef.current?.dismiss()}
                                className="h-8 w-8 rounded-full bg-gray-200/60 items-center justify-center"
                            >
                                <Ionicons name="close" size={18} color="#4A4A4A" />
                            </TouchableOpacity>
                        </View>

                        {/* List of Models */}
                        <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            {models.map((model, idx) => (
                                <SubscriptionModelCard
                                    key={idx}
                                    model={model}
                                    onSubscribe={handleSubscribe}
                                />
                            ))}
                            {models.length === 0 && (
                                <Text className="text-center text-gray-500 italic mt-6">
                                    No subscription plans available at this time.
                                </Text>
                            )}
                        </BottomSheetScrollView>
                    </View>
                </BottomSheetView>
            </BottomSheetModal>

            {/* Modal for Delivery Status Details */}
            <BottomSheetModal
                ref={statusSheetRef}
                index={0}
                snapPoints={statusSnapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: selectedDayInfo ? getStatusDetails(selectedDayInfo.status).sheetBg : "#F5F8F6" }}
                handleIndicatorStyle={{ backgroundColor: "#D1D5DB" }}
            >
                <BottomSheetView style={{ flex: 1 }}>
                    <View className="flex-1 p-6">
                        {selectedDayInfo && (() => {
                            const details = getStatusDetails(selectedDayInfo.status);
                            const items = selectedSub?.items || [];
                            return (
                                <>
                                    {/* Modal Header */}
                                    <View className="flex-row justify-between items-center mb-5 pb-3 border-b border-neutral-100">
                                        <View>
                                            <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                                Delivery Details
                                            </Text>
                                            <Text className="text-[16px] font-bold text-gray-900 mt-0.5">
                                                {formatDateString(selectedDayInfo.date)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => statusSheetRef.current?.dismiss()}
                                            className="h-8 w-8 rounded-full bg-gray-200/60 items-center justify-center"
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="close" size={18} color="#4A4A4A" />
                                        </TouchableOpacity>
                                    </View>

                                    <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                                        {/* Status Card */}
                                        <View className={`rounded-2xl p-4 border flex-row items-center gap-4 mb-5 ${details.bgClass}`}>
                                            <View className="h-12 w-12 rounded-full bg-white/80 items-center justify-center shadow-xs">
                                                <Ionicons name={details.icon} size={26} color={details.iconColor} />
                                            </View>
                                            <View className="flex-1">
                                                <Text className={`text-[15px] font-extrabold ${details.textColor}`}>
                                                    {details.title}
                                                </Text>
                                                <Text className="text-xs text-gray-600 font-medium mt-1 leading-normal">
                                                    {details.description}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Order / Status details */}
                                        {(selectedDayInfo.order_id || selectedDayInfo.order_status) && (
                                            <View className="bg-white rounded-2xl p-4 border border-neutral-100 gap-y-3 mb-5">
                                                {selectedDayInfo.order_id && (
                                                    <View className="flex-row justify-between items-center">
                                                        <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                            Order Reference
                                                        </Text>
                                                        <Text className="text-xs font-bold text-gray-800">
                                                            #{selectedDayInfo.order_id}
                                                        </Text>
                                                    </View>
                                                )}
                                                {selectedDayInfo.order_status && (
                                                    <View className="flex-row justify-between items-center">
                                                        <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                            Order Status
                                                        </Text>
                                                        <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                                                            <Text className="text-[10px] font-bold text-blue-700 uppercase">
                                                                {selectedDayInfo.order_status}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        {/* Subscription Items */}
                                        <View className="mb-6">
                                            <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                                                Items in Delivery
                                            </Text>
                                            {items.length > 0 ? (
                                                <View className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                                                    {items.map((item: any, idx: number) => (
                                                        <View 
                                                            key={idx} 
                                                            className={`flex-row justify-between items-center px-4 py-3.5 ${
                                                                idx > 0 ? "border-t border-neutral-50" : ""
                                                            }`}
                                                        >
                                                            <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                                                                <View className="h-7 w-7 rounded-full bg-[#E8F5EE] items-center justify-center">
                                                                    <Ionicons name="cube-outline" size={14} color="#1B5E37" />
                                                                </View>
                                                                <Text className="text-xs font-bold text-gray-800 leading-tight" numberOfLines={1}>
                                                                    {item.product_name}
                                                                </Text>
                                                            </View>
                                                            <Text className="text-xs font-extrabold text-gray-700 bg-neutral-100 px-2.5 py-1 rounded-lg">
                                                                Qty: {item.quantity}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            ) : (
                                                <Text className="text-xs text-gray-500 italic">No items listed in subscription</Text>
                                            )}
                                        </View>

                                        {/* Close Button */}
                                        <TouchableOpacity
                                            onPress={() => statusSheetRef.current?.dismiss()}
                                            activeOpacity={0.85}
                                            className="bg-[#1B5E37] py-3.5 rounded-2xl items-center justify-center shadow-md mb-2"
                                            style={{
                                                shadowColor: "#1B5E37",
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.15,
                                                shadowRadius: 6,
                                                elevation: 3,
                                            }}
                                        >
                                            <Text className="text-white text-sm font-bold">
                                                Got It
                                            </Text>
                                        </TouchableOpacity>
                                    </BottomSheetScrollView>
                                </>
                            );
                        })()}
                    </View>
                </BottomSheetView>
            </BottomSheetModal>
        </ScreenWrapper>
    );
}

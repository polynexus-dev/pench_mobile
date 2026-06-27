import { subscriptionApi } from "@/features/ecommerce/api/subscriptionApi";
import { DailySummary, SubscriptionSummary } from "@/features/ecommerce/types/ecommerce.types";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/useCartStore";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Easing, FlatList, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { useBottomTabPadding } from "@/hooks/useBottomTabPadding";
import { SubscriptionDetailsCard } from "@/features/ecommerce/components/SubscriptionDetailsCard";
import { SubscriptionModelCard } from "@/features/ecommerce/components/SubscriptionModelCard";
import { CalendarSkeleton } from "@/features/ecommerce/components/CalendarSkeleton";

import { getStatusDetails } from "@/features/ecommerce/data/statusData";

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

const getProductThumbnail = (name: string) => {
  const text = name.toLowerCase();
  if (text.includes("milk")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-21.png";
  if (text.includes("paneer")) return "https://penchfoods.com/wp-content/uploads/2020/11/Paneer.png";
  if (text.includes("ghee")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-22.png";
  return "https://images.unsplash.com/photo-1628105652613-2d5fc2f3a6cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80";
};

export default function SubscriptionsScreen() {
    const { user } = useAuthStore();
    const isFocused = useIsFocused();
    const domainName = useAuthStore((s) => s.domain_name) || "";
    const [subs, setSubs] = useState<SubscriptionSummary[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const router = useRouter();
    const cartItems = useCartStore((s) => s.items);
    const addToCart = useCartStore((s) => s.addToCart);
    const bottomTabPadding = useBottomTabPadding(26);

    // States for custom subscription configuration
    const [subscribingModel, setSubscribingModel] = useState<any>(null);
    const [selectedFrequency, setSelectedFrequency] = useState<string>("daily");
    const [selectedQty, setSelectedQty] = useState<number>(0.5);
    const [activeTab, setActiveTab] = useState<"predefined" | "custom">("predefined");

    // Bottom Sheet Refs & Snap Points
    const statusSheetRef = useRef<BottomSheetModal>(null);
    const configureSubSheetRef = useRef<BottomSheetModal>(null);
    const statusSnapPoints = useMemo(() => ["75%"], []);
    const configureSubSnapPoints = useMemo(() => ["90%"], []);

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
        setSubscribingModel(model);
        setSelectedFrequency(model.frequency || "daily");
        setSelectedQty(model.quantity || 0.5);
        setActiveTab("custom");
        configureSubSheetRef.current?.present();
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
                                                    className={`px-4 py-2 rounded-full mr-2 border ${isSelected
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
                                onPress={() => {
                                    if (models && models.length > 0) {
                                        setSubscribingModel(models[0]);
                                        setSelectedFrequency(models[0].frequency || "daily");
                                        setSelectedQty(models[0].quantity || 0.5);
                                        setActiveTab("predefined");
                                        configureSubSheetRef.current?.present();
                                    } else {
                                        Alert.alert("No Plans Available", "No subscription plans are available at this time.");
                                    }
                                }}
                                activeOpacity={0.8}
                                style={{ backgroundColor: "rgba(232, 245, 238, 0.4)" }}
                                className="mb-6 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-[#1B5E37] py-3.5"
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
                                            activeOpacity={0.7}
                                            style={{ backgroundColor: "rgba(229, 229, 229, 0.6)", height: 32, width: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Ionicons name="close" size={18} color="#4A4A4A" />
                                        </TouchableOpacity>
                                    </View>

                                    <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                                        {/* Status Card */}
                                        <View className={`rounded-2xl p-4 border flex-row items-center gap-4 mb-5 ${details.bgClass}`}>
                                            <View
                                                style={{
                                                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                                                    shadowColor: "#000",
                                                    shadowOffset: { width: 0, height: 1 },
                                                    shadowOpacity: 0.05,
                                                    shadowRadius: 1,
                                                    elevation: 1,
                                                }}
                                                className="h-12 w-12 rounded-full items-center justify-center"
                                            >
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
                                                            className={`flex-row justify-between items-center px-4 py-3.5 ${idx > 0 ? "border-t border-neutral-50" : ""
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

            {/* Modal for Configuring Subscription */}
            <BottomSheetModal
                ref={configureSubSheetRef}
                index={0}
                snapPoints={configureSubSnapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: "#F5F8F6" }}
                handleIndicatorStyle={{ backgroundColor: "#D1D5DB" }}
            >
                <BottomSheetScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 24, paddingBottom: 50 }}
                >
                    {subscribingModel && (
                        <>
                            {/* Modal Header */}
                            <View className="flex-row justify-between items-center mb-5">
                                <View>
                                    <Text className="text-[18px] font-bold text-gray-900">
                                        Configure Subscription
                                    </Text>
                                    <Text className="text-xs text-gray-500 font-semibold mt-0.5">
                                        {subscribingModel.product_name}
                                    </Text>
                                </View>
                                 <TouchableOpacity
                                     onPress={() => configureSubSheetRef.current?.dismiss()}
                                     style={{ backgroundColor: "rgba(229, 229, 229, 0.6)", height: 32, width: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                                 >
                                    <Ionicons name="close" size={18} color="#4A4A4A" />
                                </TouchableOpacity>
                            </View>

                            {/* Tabs Switcher */}
                            <View className="flex-row rounded-2xl p-1.5 mb-6 border border-neutral-200 bg-neutral-150 bg-neutral-100">
                                <TouchableOpacity
                                    onPress={() => setActiveTab("predefined")}
                                    style={activeTab === "predefined" ? {
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.05,
                                        shadowRadius: 1,
                                        elevation: 1,
                                    } : undefined}
                                    className={`flex-1 py-3 rounded-xl items-center justify-center border ${
                                        activeTab === "predefined" ? "bg-white border-neutral-200" : "bg-transparent border-transparent"
                                    }`}
                                >
                                    <Text className={`text-[13px] font-bold ${activeTab === "predefined" ? "text-gray-900" : "text-gray-500"}`}>
                                        Predefined Plans
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setActiveTab("custom")}
                                    style={activeTab === "custom" ? {
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.05,
                                        shadowRadius: 1,
                                        elevation: 1,
                                    } : undefined}
                                    className={`flex-1 py-3 rounded-xl items-center justify-center border ${
                                        activeTab === "custom" ? "bg-white border-neutral-200" : "bg-transparent border-transparent"
                                    }`}
                                >
                                    <Text className={`text-[13px] font-bold ${activeTab === "custom" ? "text-gray-900" : "text-gray-500"}`}>
                                        Custom Subscription
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* PREDEFINED PLANS TAB */}
                            {activeTab === "predefined" && (
                                <View className="gap-y-4">
                                    <Text className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        Select a Predefined Plan
                                    </Text>
                                    <FlatList
                                        data={models}
                                        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                                        scrollEnabled={false}
                                        renderItem={({ item }) => (
                                            <SubscriptionModelCard
                                                model={item}
                                                onSubscribe={(selectedModel) => {
                                                    const frequencyLabels: { [key: string]: string } = {
                                                        daily: "Daily",
                                                        alternate: "Alternate Days",
                                                        mon_wed_fri: "Mon, Wed, Fri",
                                                        tue_thu_sat: "Tue, Thu, Sat",
                                                        weekends: "Weekends Only"
                                                    };
                                                    const freqLabel = frequencyLabels[selectedModel.frequency] || selectedModel.frequency_display || selectedModel.frequency || "Daily";
                                                    const unitPrice = Number(selectedModel.unit_price || selectedModel.price || 45);
                                                    const costPerDelivery = unitPrice * (selectedModel.quantity || 1);

                                                    addToCart({
                                                        id: `sub_${selectedModel.product_id || selectedModel.id || 'milk'}_predefined_${selectedModel.frequency || 'daily'}`,
                                                        name: `${selectedModel.product_name} (${freqLabel} Plan - ${selectedModel.quantity || 1}${selectedModel.unit || 'L'})`,
                                                        price: costPerDelivery,
                                                        quantity: 1
                                                    });

                                                    configureSubSheetRef.current?.dismiss();

                                                    Alert.alert(
                                                        "Added to Cart",
                                                        `Predefined subscription plan added to your cart successfully!`,
                                                        [
                                                            { text: "Continue", style: "cancel" },
                                                            {
                                                                text: "View Cart",
                                                                onPress: () => {
                                                                    router.push("/(customer)/cart");
                                                                }
                                                            }
                                                        ]
                                                    );
                                                }}
                                            />
                                        )}
                                        ListEmptyComponent={
                                            <Text className="text-center text-gray-500 italic py-6">
                                                No subscription plans available at this time.
                                            </Text>
                                        }
                                    />
                                </View>
                            )}

                            {/* CUSTOM PLANS TAB */}
                            {activeTab === "custom" && (
                                <>


                                    {/* Frequency Option Selection */}
                                    <Text className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                                        Select Delivery Frequency
                                    </Text>
                                    <View className="flex-row flex-wrap gap-2 mb-6">
                                        {[
                                            { id: "daily", label: "Daily" },
                                            { id: "alternate", label: "Alternate Days" },
                                            { id: "mon_wed_fri", label: "Mon, Wed, Fri" },
                                            { id: "tue_thu_sat", label: "Tue, Thu, Sat" },
                                            { id: "weekends", label: "Weekends Only" }
                                        ].map((freq) => {
                                            const isSelected = selectedFrequency === freq.id;
                                            return (
                                                <TouchableOpacity
                                                    key={freq.id}
                                                    onPress={() => setSelectedFrequency(freq.id)}
                                                    activeOpacity={0.8}
                                                    className={`px-4 py-2.5 rounded-xl border ${isSelected
                                                            ? "bg-[#1B5E37] border-[#1B5E37]"
                                                            : "bg-white border-neutral-200"
                                                        }`}
                                                >
                                                    <Text className={`text-[12px] font-bold ${isSelected ? "text-white" : "text-gray-600"}`}>
                                                        {freq.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    {/* Quantity Stepper */}
                                    <Text className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                                        Daily Quantity (Litre)
                                    </Text>
                                    
                                    {/* Preset Buttons for Quick Select */}
                                    <View className="flex-row gap-2 mb-3">
                                        {[0.5, 1.0, 1.5, 2.0].map((val) => {
                                            const isSelected = selectedQty === val;
                                            return (
                                                <TouchableOpacity
                                                    key={val}
                                                    onPress={() => setSelectedQty(val)}
                                                    activeOpacity={0.8}
                                                    style={isSelected ? { backgroundColor: "rgba(27, 94, 55, 0.1)" } : undefined}
                                                    className={`flex-1 py-2 rounded-lg border items-center ${isSelected
                                                            ? "border-[#1B5E37]"
                                                            : "bg-white border-neutral-200"
                                                        }`}
                                                >
                                                    <Text className={`text-[12px] font-bold ${isSelected ? "text-[#1B5E37]" : "text-gray-600"}`}>
                                                        {val} L
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    {/* Numeric Stepper Controller */}
                                    <View className="flex-row items-center justify-between bg-white border border-neutral-200 rounded-2xl p-4 mb-6">
                                        <Text className="text-[14px] font-bold text-gray-800">
                                            Adjust Quantity
                                        </Text>
                                        <View className="flex-row items-center gap-4 bg-gray-50 border border-gray-100 rounded-full p-1.5">
                                            <TouchableOpacity
                                                onPress={() => setSelectedQty(prev => prev > 0.5 ? parseFloat((prev - 0.5).toFixed(1)) : 0.5)}
                                                style={{
                                                    shadowColor: "#000",
                                                    shadowOffset: { width: 0, height: 1 },
                                                    shadowOpacity: 0.05,
                                                    shadowRadius: 1,
                                                    elevation: 1,
                                                }}
                                                className="h-9 w-9 items-center justify-center rounded-full bg-white"
                                                disabled={selectedQty <= 0.5}
                                            >
                                                <Ionicons name="remove" size={16} color={selectedQty <= 0.5 ? "#D1D5DB" : "#1B5E37"} />
                                            </TouchableOpacity>
                                            <Text className="w-12 text-center text-[15px] font-black text-gray-800">
                                                {selectedQty} L
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => setSelectedQty(prev => parseFloat((prev + 0.5).toFixed(1)))}
                                                style={{
                                                    shadowColor: "#000",
                                                    shadowOffset: { width: 0, height: 1 },
                                                    shadowOpacity: 0.05,
                                                    shadowRadius: 1,
                                                    elevation: 1,
                                                }}
                                                className="h-9 w-9 items-center justify-center rounded-full bg-white"
                                            >
                                                <Ionicons name="add" size={16} color="#1B5E37" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Pricing & Cost Details */}
                                    <View
                                        style={{ borderColor: "rgba(229, 229, 229, 0.5)" }}
                                        className="bg-[#FAF9F6] border rounded-2xl p-4 mb-6"
                                    >
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-[12px] font-semibold text-gray-500">Rate</Text>
                                            <Text className="text-[12px] font-bold text-gray-800">
                                                ₹{subscribingModel.unit_price || subscribingModel.price || 45}/Litre
                                            </Text>
                                        </View>
                                        <View
                                            style={{ borderTopColor: "rgba(229, 229, 229, 0.4)" }}
                                            className="flex-row justify-between border-t pt-2 items-center"
                                        >
                                            <Text className="text-[13px] font-bold text-gray-800">Per-Delivery Cost</Text>
                                            <Text className="text-[16px] font-black text-[#1B5E37]">
                                                ₹{((subscribingModel.unit_price || subscribingModel.price || 45) * selectedQty).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Add to Cart Button */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            const frequencyLabels: { [key: string]: string } = {
                                                daily: "Daily",
                                                alternate: "Alternate Days",
                                                mon_wed_fri: "Mon, Wed, Fri",
                                                tue_thu_sat: "Tue, Thu, Sat",
                                                weekends: "Weekends Only"
                                            };
                                            const freqLabel = frequencyLabels[selectedFrequency] || selectedFrequency;
                                            const unitPrice = Number(subscribingModel.unit_price || subscribingModel.price || 45);
                                            const costPerDelivery = unitPrice * selectedQty;

                                            addToCart({
                                                id: `sub_${subscribingModel.product_id || subscribingModel.id || 'milk'}_${selectedFrequency}`,
                                                name: `${subscribingModel.product_name} (Sub: ${freqLabel} - ${selectedQty}L)`,
                                                price: costPerDelivery,
                                                quantity: 1
                                            });

                                            configureSubSheetRef.current?.dismiss();

                                            Alert.alert(
                                                "Added to Cart",
                                                `Subscription added to your cart successfully!`,
                                                [
                                                    { text: "Continue", style: "cancel" },
                                                    {
                                                        text: "View Cart",
                                                        onPress: () => {
                                                            router.push("/(customer)/cart");
                                                        }
                                                    }
                                                ]
                                            );
                                        }}
                                        activeOpacity={0.85}
                                        className="bg-[#1B5E37] py-4 rounded-2xl items-center justify-center shadow-md"
                                        style={{
                                            shadowColor: "#1B5E37",
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.15,
                                            shadowRadius: 6,
                                            elevation: 3,
                                        }}
                                    >
                                        <Text className="text-white text-sm font-bold uppercase tracking-wider">
                                            Add Subscription to Cart
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </>
                    )}
                </BottomSheetScrollView>
            </BottomSheetModal>

            {cartItems.length > 0 && (
                <View 
                    pointerEvents="box-none"
                    className="absolute left-0 right-0 items-center z-50"
                    style={{ bottom: bottomTabPadding }}
                >
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                            router.push("/(customer)/cart");
                        }}
                        className="flex-row items-center rounded-full px-2 py-2 shadow-lg gap-1"
                        style={{
                            backgroundColor: "#178d2bff",
                        }}
                    >
                        {/* Left: Product Image Thumbnail */}
                        <View className="h-10 w-10 rounded-full bg-white items-center justify-center overflow-hidden p-1">
                            <Image
                                source={{ uri: getProductThumbnail(cartItems[0]?.name || "") }}
                                className="h-8 w-8"
                                resizeMode="cover"
                            />
                        </View>

                        {/* Middle: Details */}
                        <View className="mx-3.5 pr-2 items-start justify-center">
                            <Text className="text-[13px] font-black text-white leading-none">View cart</Text>
                            <Text className="text-[10px] font-bold text-white/80 mt-1 leading-none">
                                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} {cartItems.reduce((acc, i) => acc + i.quantity, 0) === 1 ? "item" : "items"}
                            </Text>
                        </View>

                        {/* Right: Chevron Circle */}
                        <View className="h-10 w-10 rounded-full bg-white/20 items-center justify-center">
                            <Ionicons name="chevron-forward" size={20} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </ScreenWrapper>
    );
}

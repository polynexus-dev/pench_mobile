import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";
import { subscriptionApi, SubscriptionSummary } from "@/features/dashboard/api/subscriptionApi";
import { Ionicons } from "@expo/vector-icons";
import { Calendar, DateData } from "react-native-calendars";
import { StatusBar } from "expo-status-bar";

function SubscriptionCard({
  sub,
  isSelected,
  onSelect,
}: {
  sub: SubscriptionSummary;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isPaused = sub.is_paused;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onSelect}
      className={`mb-4 overflow-hidden rounded-2xl bg-white p-4 border ${
        isSelected ? "border-[#1B5E37] border-2" : "border-gray-100"
      }`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-50">
            <Ionicons name="water-outline" size={16} color="#3B82F6" />
          </View>
          <Text className="text-[16px] font-bold text-gray-900">Milk Delivery Plan</Text>
        </View>
        <View
          className={`rounded-full px-2.5 py-1 ${
            isPaused ? "bg-amber-100" : "bg-green-100"
          }`}
        >
          <Text
            className={`text-[10px] font-bold ${
              isPaused ? "text-amber-700" : "text-green-700"
            }`}
          >
            {isPaused ? "PAUSED" : "ACTIVE"}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="sync-outline" size={14} color="#6B7280" />
          <Text className="text-[13px] text-gray-600">
            {sub.frequency_display}
          </Text>
        </View>

        {isSelected && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="checkmark-circle" size={16} color="#1B5E37" />
            <Text className="text-[12px] font-bold text-[#1B5E37]">Selected</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SubscriptionsScreen() {
  const { user } = useAuthStore();
  const domainName = useAuthStore((s) => s.domain_name) || "";
  const [subs, setSubs] = useState<SubscriptionSummary[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Calendar states
  const [isSelectingVacation, setIsSelectingVacation] = useState(false);
  const [vacationStart, setVacationStart] = useState<string | null>(null);
  const [vacationEnd, setVacationEnd] = useState<string | null>(null);

  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const fetchSubs = async () => {
    if (!domainName || !user?.id) return;
    try {
      const targetId = user.customer_uuid || user.id.toString();
      const data = await subscriptionApi.getCustomerMonthlySummary(domainName, targetId, year, month);
      const subList = data.subscriptions || [];
      setSubs(subList);
      
      // Auto-select the first subscription if none is selected
      if (subList.length > 0 && !selectedSubId) {
        setSelectedSubId(subList[0].subscription_id);
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
  }, [domainName]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubs();
  };

  const selectedSub = subs.find((s) => s.subscription_id === selectedSubId);

  const handleDayPress = (day: DateData) => {
    if (!isSelectingVacation) return;

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
        if (dayInfo.status === "delivered")
          color = "#22C55E";
        else if (dayInfo.status === "scheduled")
          color = "#3B82F6";
        else if (dayInfo.status === "vacation")
          color = "#F59E0B";
        else if (dayInfo.status === "skipped")
          color = "#EF4444";
        else if (dayInfo.status === "undelivered") 
          color = "#EF4444";

        if (color) {
          marked[dayInfo.date] = { selected: true, selectedColor: color };
        }
      });
    }

    if (isSelectingVacation && vacationStart) {
      if (vacationEnd && vacationStart === vacationEnd) {
        marked[vacationStart] = {
          startingDay: true,
          endingDay: true,
          color: "#6366F1",
          textColor: "white",
        };
      } else {
        marked[vacationStart] = {
          startingDay: true,
          color: "#6366F1",
          textColor: "white",
        };
        if (vacationEnd) {
          let current = new Date(vacationStart);
          const end = new Date(vacationEnd);
          current.setDate(current.getDate() + 1);
          while (current < end) {
            const dateStr = current.toISOString().split("T")[0];
            marked[dateStr] = { color: "#A5B4FC", textColor: "white" };
            current.setDate(current.getDate() + 1);
          }
          marked[vacationEnd] = {
            endingDay: true,
            color: "#6366F1",
            textColor: "white",
          };
        }
      }
    }

    return marked;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8F6]">
      <StatusBar style="dark" />
      <View className="px-4 py-4 border-b border-gray-100 bg-white">
        <Text className="mb-1 text-2xl font-black text-gray-900">Subscriptions</Text>
        <Text className="text-[14px] text-gray-500">Manage your daily deliveries and vacation pauses</Text>
      </View>

      {loading ? (
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
            <View className="mt-12 items-center justify-center px-4">
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text className="mt-4 text-center text-[16px] font-bold text-gray-900">
                No active subscriptions
              </Text>
              <Text className="mt-2 text-center text-[14px] text-gray-500">
                You don't have any active subscriptions yet.
              </Text>
            </View>
          ) : (
            <>
              {/* Subscription Cards Stack */}
              <Text className="mb-3 text-[14px] font-bold text-gray-500 uppercase tracking-wider">
                My Plans
              </Text>
              {subs.map((item) => (
                <SubscriptionCard
                  key={item.subscription_id}
                  sub={item}
                  isSelected={item.subscription_id === selectedSubId}
                  onSelect={() => {
                    setSelectedSubId(item.subscription_id);
                    setIsSelectingVacation(false);
                    setVacationStart(null);
                    setVacationEnd(null);
                  }}
                />
              ))}

              {/* Delivery Calendar for selected subscription */}
              {selectedSub && (
                <View className="mt-4">
                  <Text className="mb-3 text-[14px] font-bold text-gray-500 uppercase tracking-wider">
                    Delivery Calendar
                  </Text>

                  {/* Calendar Card */}
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
                      current={`${year}-${month.toString().padStart(2, "0")}-01`}
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

                  {/* Legend Card */}
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
                    <Text className="mb-3 text-[14px] font-bold text-gray-900">Legend</Text>
                    <View className="flex-row flex-wrap gap-y-3">
                      <View className="w-1/2 flex-row items-center gap-2">
                        <View className="h-3 w-3 rounded-full bg-[#22C55E]" />
                        <Text className="text-[12px] text-gray-700">Delivered</Text>
                      </View>
                      <View className="w-1/2 flex-row items-center gap-2">
                        <View className="h-3 w-3 rounded-full bg-[#3B82F6]" />
                        <Text className="text-[12px] text-gray-700">Scheduled</Text>
                      </View>
                      <View className="w-1/2 flex-row items-center gap-2">
                        <View className="h-3 w-3 rounded-full bg-[#EF4444]" />
                        <Text className="text-[12px] text-gray-700">Skipped/Missed</Text>
                      </View>
                      <View className="w-1/2 flex-row items-center gap-2">
                        <View className="h-3 w-3 rounded-full bg-[#F59E0B]" />
                        <Text className="text-[12px] text-gray-700">Vacation</Text>
                      </View>
                    </View>
                  </View>

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
                      <Text className="mb-3 text-center text-[13px] font-medium text-gray-700">
                        Select a start and end date (tap a single day for a 1-day pause).
                      </Text>
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
                          className={`flex-1 rounded-lg py-2.5 items-center ${
                            vacationStart ? "bg-[#1B5E37]" : "bg-gray-400"
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
    </SafeAreaView>
  );
}

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { useAuthStore } from "@/store/authStore";
import { subscriptionApi } from "@/features/dashboard/api/subscriptionApi";
import { Ionicons } from "@expo/vector-icons";

export default function SubscriptionDetailsScreen() {
  const { id, year, month } = useLocalSearchParams();
  const { user } = useAuthStore();
  const domainName = useAuthStore((s) => s.domain_name) || "";

  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState<any>(null);

  // Vacation Selection State
  const [isSelectingVacation, setIsSelectingVacation] = useState(false);
  const [vacationStart, setVacationStart] = useState<string | null>(null);
  const [vacationEnd, setVacationEnd] = useState<string | null>(null);

  const fetchCalendar = async () => {
    if (!domainName || !user?.id || !id) return;
    try {
      setLoading(true);
      const targetId = user.customer_uuid || user.id.toString();
      const data = await subscriptionApi.getCustomerMonthlySummary(
        domainName,
        targetId,
        Number(year),
        Number(month),
      );
      const targetSub = data.subscriptions.find(
        (s: any) => s.subscription_id === id,
      );
      setSubData(targetSub || null);
    } catch (e) {
      console.warn("Failed to fetch calendar", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (domainName) fetchCalendar();
  }, [domainName, id, year, month]);

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
    if (!vacationStart) {
      Alert.alert("Incomplete", "Please select at least a start date.");
      return;
    }
    const end = vacationEnd || vacationStart;
    try {
      await subscriptionApi.addVacationGap(
        domainName,
        id as string,
        vacationStart,
        end,
      );
      Alert.alert("Success", "Vacation gap scheduled!");
      setIsSelectingVacation(false);
      setVacationStart(null);
      setVacationEnd(null);
      fetchCalendar();
    } catch {
      Alert.alert("Error", "Could not set vacation gap.");
    }
  };

  const buildMarkedDates = () => {
    const marked: any = {};

    // Base colors for existing backend data
    if (subData?.daily) {
      subData.daily.forEach((dayInfo: any) => {
        let color = "";
        if (dayInfo.status === "delivered")
          color = "#22C55E"; // Green
        else if (dayInfo.status === "scheduled")
          color = "#3B82F6"; // Blue
        else if (dayInfo.status === "vacation")
          color = "#F59E0B"; // Orange
        else if (dayInfo.status === "skipped")
          color = "#EF4444"; // Red
        else if (dayInfo.status === "undelivered") color = "#EF4444"; // Red

        if (color) {
          marked[dayInfo.date] = { selected: true, selectedColor: color };
        }
      });
    }

    // Override with vacation selection if active
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
      <View className="flex-row items-center border-b border-gray-200 bg-white px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-[18px] font-bold text-gray-900">
          Subscription Calendar
        </Text>
      </View>

      <ScrollView className="flex-1">
        {loading ? (
          <View className="mt-12 items-center">
            <ActivityIndicator size="large" color="#1B5E37" />
          </View>
        ) : (
          <View className="p-4">
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
                current={`${year}-${month?.toString().padStart(2, "0")}-01`}
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

            <View
              className="mb-6 rounded-2xl bg-white p-4 border border-gray-100"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Text className="mb-3 text-[14px] font-bold text-gray-900">
                Legend
              </Text>
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
                  <Text className="text-[12px] text-gray-700">
                    Skipped/Missed
                  </Text>
                </View>
                <View className="w-1/2 flex-row items-center gap-2">
                  <View className="h-3 w-3 rounded-full bg-[#F59E0B]" />
                  <Text className="text-[12px] text-gray-700">Vacation</Text>
                </View>
              </View>
            </View>

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
                  Select a start and end date (tap a single day for a 1-day
                  pause).
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
                    <Text className="text-[14px] font-bold text-gray-700">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={submitVacation}
                    disabled={!vacationStart}
                    className={`flex-1 rounded-lg py-2.5 items-center ${
                      vacationStart ? "bg-[#1B5E37]" : "bg-gray-400"
                    }`}
                  >
                    <Text className="text-[14px] font-bold text-white">
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

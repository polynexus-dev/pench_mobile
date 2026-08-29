import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";

export function DeliveryDatePicker({
    orderDate,
    setOrderDate,
    showCalendar,
    setShowCalendar,
    getLocalDateString,
}: {
    orderDate: string;
    setOrderDate: (value: string) => void;
    showCalendar: boolean;
    setShowCalendar: (value: boolean) => void;
    getLocalDateString: (date: Date) => string;
}) {
    const today = getLocalDateString(new Date());

    return (
        <View className="mb-4">
            <Text className="mb-2 text-[13px] font-bold text-gray-700">Delivery Date</Text>

            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowCalendar(!showCalendar)}
                className="mb-3 flex-row items-center justify-between rounded-xl bg-gray-50 px-3.5 py-3 border border-gray-200"
            >
                <View className="flex-row items-center gap-2">
                    <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                    <Text className="text-[15px] font-semibold text-gray-900">
                        {orderDate ? new Date(orderDate).toDateString() : "Select Date"}
                    </Text>
                </View>
                <Ionicons name={showCalendar ? "chevron-up" : "chevron-down"} size={16} color="#6B7280" />
            </TouchableOpacity>

            {showCalendar && (
                <View className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <Calendar
                        current={orderDate || today}
                        minDate={today}
                        onDayPress={(day) => {
                            setOrderDate(day.dateString);
                            setShowCalendar(false);
                        }}
                        markedDates={
                            orderDate
                                ? {
                                    [orderDate]: { selected: true, selectedColor: "#1B5E37" },
                                }
                                : {}
                        }
                        theme={{
                            selectedDayBackgroundColor: "#1B5E37",
                            selectedDayTextColor: "white",
                            todayTextColor: "#1B5E37",
                            arrowColor: "#1B5E37",
                            dotColor: "#1B5E37",
                        }}
                    />
                </View>
            )}
        </View>
    );
}
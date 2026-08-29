import React from "react";
import { View, TouchableOpacity, Text } from "react-native";

export function QuickDateChips({
    orderDate,
    setOrderDate,
    getLocalDateString,
}: {
    orderDate: string;
    setOrderDate: (value: string) => void;
    getLocalDateString: (date: Date) => string;
}) {
    const today = getLocalDateString(new Date());

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getLocalDateString(tomorrow);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = getLocalDateString(dayAfter);

    const chipClass = (selected: boolean) =>
        `flex-1 rounded-lg py-2 border items-center ${selected ? "bg-[#1B5E37]/10 border-[#1B5E37]" : "bg-gray-50 border-gray-200"}`;

    const textClass = (selected: boolean) => `text-[12px] font-bold ${selected ? "text-[#1B5E37]" : "text-gray-700"}`;

    return (
        <View className="mb-6 flex-row gap-2">
            <TouchableOpacity onPress={() => setOrderDate(today)} className={chipClass(orderDate === today)}>
                <Text className={textClass(orderDate === today)}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setOrderDate(tomorrowStr)} className={chipClass(orderDate === tomorrowStr)}>
                <Text className={textClass(orderDate === tomorrowStr)}>Tomorrow</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setOrderDate(dayAfterStr)} className={chipClass(orderDate === dayAfterStr)}>
                <Text className={textClass(orderDate === dayAfterStr)}>Day After</Text>
            </TouchableOpacity>
        </View>
    );
}
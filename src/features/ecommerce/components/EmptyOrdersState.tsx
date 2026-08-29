import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function EmptyOrdersState({ tab }: { tab: "history" | "upcoming" }) {
    return (
        <View className="mt-16 items-center justify-center px-4">
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text className="mt-4 text-center text-[16px] font-bold text-gray-900">No {tab} orders found</Text>
            <Text className="mt-2 text-center text-[14px] text-gray-500">
                Place a special order or start a subscription to see deliveries here.
            </Text>
        </View>
    );
}
import React from "react";
import { View, TouchableOpacity, Text } from "react-native";

export function OrdersTabs({
    tab,
    onChange,
}: {
    tab: "history" | "upcoming";
    onChange: (tab: "history" | "upcoming") => void;
}) {
    const activeStyle = {
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    };

    return (
        <View className="flex-row rounded-xl bg-gray-200/80 p-1">
            <TouchableOpacity
                className="flex-1 items-center justify-center rounded-lg py-2"
                style={tab === "upcoming" ? activeStyle : { backgroundColor: "transparent" }}
                onPress={() => onChange("upcoming")}
            >
                <Text className={`text-[13px] font-bold ${tab === "upcoming" ? "text-gray-900" : "text-gray-500"}`}>
                    Upcoming
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="flex-1 items-center justify-center rounded-lg py-2"
                style={tab === "history" ? activeStyle : { backgroundColor: "transparent" }}
                onPress={() => onChange("history")}
            >
                <Text className={`text-[13px] font-bold ${tab === "history" ? "text-gray-900" : "text-gray-500"}`}>
                    History
                </Text>
            </TouchableOpacity>
        </View>
    );
}
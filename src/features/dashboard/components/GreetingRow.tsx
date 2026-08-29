import React from "react";
import { View, Text } from "react-native";
import { formatDateTime } from "@/utils/dateFormatter";

interface GreetingRowProps {
    name: string;
    date?: Date;
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
}

function formatDateParts(date: Date): { display: string; day: string } {
    const [display] = formatDateTime(date.toISOString()).split(",");
    const day = date.toLocaleDateString("en-US", { weekday: "short" });
    return { display: display.trim(), day };
}

export function GreetingRow({ name, date = new Date() }: GreetingRowProps) {
    const greeting = getGreeting();
    const { display, day } = formatDateParts(date);

    return (
        <View className="flex-row items-center justify-between bg-green-100 p-2 rounded-md">
            <View>
                <Text className="text-base text-text-secondary">{greeting},</Text>
                <Text className="text-2xl font-bold text-text-primary">{name}</Text>
            </View>

            <View className="items-end">
                <Text className="text-sm text-text-secondary">{display}</Text>
                <Text className="text-xs text-text-muted">{day}</Text>
            </View>
        </View>
    );
}
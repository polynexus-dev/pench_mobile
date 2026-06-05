import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StatItem {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    color: string;
}

interface Props {
    stats: StatItem[];
}

export default function RouteStatRow({ stats }: Props) {
    return (
        <View className="flex-row justify-between gap-x-3 mb-5">
            {stats.map((s) => (
                <View
                    key={s.label}
                    className="flex-1 rounded-card bg-bg-screen p-3 items-center"
                >
                    <View
                        className="w-9 h-9 rounded-full items-center justify-center mb-1.5"
                        style={{ backgroundColor: s.color + "18" }}
                    >
                        <Ionicons name={s.icon} size={18} color={s.color} />
                    </View>
                    <Text className="text-body-lg font-bold text-text-primary">{s.value}</Text>
                    <Text className="text-caption text-text-muted mt-0.5">{s.label}</Text>
                </View>
            ))}
        </View>
    );
}
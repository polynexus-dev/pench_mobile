import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/shared/ui/Text/Text";

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
                    className="flex-1 rounded-[20px] bg-white p-3.5 items-center shadow-xs border border-border-subtle/50"
                >
                    <View
                        className="w-10 h-10 rounded-xl items-center justify-center mb-2"
                        style={{ backgroundColor: s.color + "12" }}
                    >
                        <Ionicons name={s.icon} size={18} color={s.color} />
                    </View>
                    <Text variant="body" weight="bold" color="primary">{s.value}</Text>
                    <Text variant="caption-sm" color="muted" weight="semibold" className="mt-0.5" lines={1}>{s.label}</Text>
                </View>
            ))}
        </View>
    );
}
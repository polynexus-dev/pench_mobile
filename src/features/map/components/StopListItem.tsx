import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type StopStatus = "completed" | "current" | "pending";

interface Props {
    sequenceNumber: number;
    customerName: string;
    address: string;
    items: string[];
    status: StopStatus;
    onPress: () => void;
}

const statusConfig: Record<StopStatus, { bg: string; icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
    completed: { bg: "bg-success", icon: "checkmark", color: "white", label: "Done" },
    current: { bg: "bg-warning", icon: "navigate", color: "white", label: "Active" },
    pending: { bg: "bg-border-disable", icon: "ellipse-outline", color: "#9E9E9E", label: "Pending" },
};

export function StopListItem({
    sequenceNumber,
    customerName,
    address,
    items,
    status,
    onPress,
}: Props) {
    const cfg = statusConfig[status];

    return (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-start gap-x-3 mb-4 bg-white rounded-card p-4 border border-border-disable"
        >
            {/* Sequence badge */}
            <View className={`w-9 h-9 rounded-full items-center justify-center mt-0.5 ${cfg.bg}`}>
                <Ionicons name={cfg.icon} size={16} color={cfg.color} />
            </View>

            <View className="flex-1">
                <View className="flex-row items-center justify-between">
                    <Text className="text-label font-bold text-text-primary">{customerName}</Text>
                    <View className={`px-2 py-0.5 rounded-badge ${status === "completed" ? "bg-success/10" : status === "current" ? "bg-warning/10" : "bg-border-disable"}`}>
                        <Text className={`text-caption font-semibold ${status === "completed" ? "text-success" : status === "current" ? "text-warning" : "text-text-muted"}`}>
                            #{sequenceNumber}
                        </Text>
                    </View>
                </View>

                <Text className="text-caption text-text-secondary mt-0.5" numberOfLines={1}>{address}</Text>

                <View className="flex-row flex-wrap gap-1.5 mt-2">
                    {items.map((item, i) => (
                        <View key={i} className="bg-bg-screen rounded-badge px-2 py-0.5">
                            <Text className="text-caption text-text-secondary">{item}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </TouchableOpacity>
    );
}
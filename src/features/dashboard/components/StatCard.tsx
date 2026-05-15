import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors  } from "@shared/theme";

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    count: number;
    subLabel: string;
    ctaLabel: string;
    hasAlert?: boolean;
    onPress?: () => void;
}

export function StatCard({
    icon,
    label,
    count,
    subLabel,
    ctaLabel,
    hasAlert = false,
    onPress,
}: StatCardProps) {
    return (
        <View className="flex-1 bg-bg-card rounded-2xl p-4 border border-border">
            {/* Icon + Alert Dot */}
            <View className="relative self-start mb-2">
                {icon}
                {hasAlert && (
                    <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-error border-2 border-bg-card" />
                )}
            </View>

            {/* Label */}
            <Text className="text-sm text-text-secondary font-normal mb-1">
                {label}
            </Text>

            {/* Count */}
            <Text className="text-4xl font-bold text-text-primary leading-none mb-1">
                {count}
            </Text>

            {/* Sub-label */}
            <Text className="text-xs text-text-muted mb-3">{subLabel}</Text>

            {/* CTA Button */}
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                className="flex-row items-center justify-between bg-warning rounded-xl px-3 py-2"
            >
                <Text className="text-sm font-semibold text-white">{ctaLabel}</Text>
                <View className="w-6 h-6 bg-white/20 rounded-lg items-center justify-center">
                    <Ionicons name="arrow-forward" size={14} color={Colors.text.white} />
                </View>
            </TouchableOpacity>
        </View>
    );
}
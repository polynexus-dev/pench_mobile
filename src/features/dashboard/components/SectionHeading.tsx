import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface SectionHeadingProps {
    title: string;
    actionLabel?: string;
    onActionPress?: () => void;
}

export function SectionHeading({
    title,
    actionLabel,
    onActionPress,
}: SectionHeadingProps) {
    return (
        <View className="flex-row items-center justify-between px-4 mb-3">
            <Text className="text-base font-semibold text-text-primary">{title}</Text>
            {actionLabel && (
                <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
                    <Text className="text-sm font-medium text-text-link">{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
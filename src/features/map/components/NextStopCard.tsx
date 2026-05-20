import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/shared/ui/Text/Text";
import { Button } from "@/shared/ui/Button/Button";

type Props = {
    stopNumber: number;
    customerName: string;
    address: string;
    items: string[];
    orderId: string;
    onMarkDelivered: () => void;
    disabled?: boolean;
};

export function NextStopCard({
    stopNumber,
    customerName,
    address,
    items,
    orderId,
    onMarkDelivered,
    disabled = false,
}: Props) {
    return (
        <View className="rounded-card border border-border-default bg-bg-card p-4 mb-4">
            <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                    <Text className="text-label text-text-muted">Next Stop</Text>
                    <Text className="text-body-lg text-text-primary"
                    // fontWeight="bold"
                    >
                        {stopNumber}. {customerName}
                    </Text>
                    <Text className="mt-1 text-body-sm text-text-muted">{address}</Text>
                </View>

                <View className={`rounded-full px-3 py-2 ${disabled ? "bg-warningLight" : "bg-success"}`}>
                    <Text
                        className={disabled ? "text-warning" : "text-text-inverse"}
                    // fontWeight="semibold"
                    >
                        {disabled ? "Move Closer" : "Ready"}
                    </Text>
                </View>
            </View>

            <View className="mt-4 flex-row flex-wrap gap-2">
                {items.map((item) => (
                    <View key={item} className="rounded-full bg-bg-input px-3 py-2">
                        <Text className="text-caption text-text-secondary">{item}</Text>
                    </View>
                ))}
            </View>

            <View className="mt-4 flex-row items-center justify-between">
                <Text className="text-caption text-text-muted">Order ID: {orderId}</Text>
            </View>

            <View className="mt-4">
                <Button
                    label={disabled ? "Move Closer to Enable" : "Mark Delivered"}
                    intent="primary"
                    size="lg"
                    fullWidth
                    disabled={disabled}
                    onPress={onMarkDelivered}
                />
            </View>
        </View>
    );
}
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
    routeName: string;
    completed: number;
    total: number;
    eta: string;
    isTripStarted: boolean;
    loading: boolean;
    onToggle: () => void;
    disabled?: boolean;
}

export default function TripStatusBanner({
    routeName,
    completed,
    total,
    eta,
    isTripStarted,
    loading,
    onToggle,
    disabled = false,
}: Props) {
    const progress = total > 0 ? (completed / total) * 100 : 0;
    const isDisabled = loading || disabled;

    return (
        <View className="absolute left-4 right-4 top-12 z-20 rounded-card bg-bg-card p-4 shadow-xl">
            <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                    <Text className="text-caption tracking-widest text-text-muted uppercase">
                        Active Route
                    </Text>
                    <Text
                        className="mt-0.5 text-body-lg font-bold text-text-primary"
                        numberOfLines={1}
                    >
                        {routeName}
                    </Text>
                    <Text className="mt-0.5 text-caption text-text-secondary">
                        {completed} / {total} Deliveries · ETA {eta}
                    </Text>

                    <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-disable">
                        <View
                            className="h-1.5 rounded-full bg-brand-primary"
                            style={{ width: `${progress}%` }}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={isDisabled ? undefined : onToggle}
                    disabled={isDisabled}
                    activeOpacity={0.85}
                    className={`w-12 h-12 rounded-full items-center justify-center shadow-md ${isDisabled
                            ? "bg-gray-400 opacity-50"
                            : isTripStarted
                                ? "bg-error"
                                : "bg-brand-primary"
                        }`}
                >
                    <Ionicons
                        name={isDisabled ? "remove-circle-outline" : loading ? "hourglass-outline" : isTripStarted ? "stop" : "play"}
                        size={20}
                        color="white"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    View,
    TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/shared/ui/Text/Text";

type Props = {
    sequenceNumber: number;
    customerName: string;
    address: string;
    items: string[];
    status: "completed" | "current" | "pending";
    isNear?: boolean;
    isActive?: boolean;
    onPress: () => void;
};

export function StopListItem({
    sequenceNumber,
    customerName,
    address,
    items,
    status,
    isNear = false,
    isActive = false,
    onPress,
}: Props) {
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let anim: Animated.CompositeAnimation | null = null;

        if (isNear) {
            anim = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulse, {
                        toValue: 1.02,
                        duration: 700,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulse, {
                        toValue: 1,
                        duration: 700,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            anim.start();
        } else {
            pulse.setValue(1);
        }

        return () => {
            anim?.stop();
        };
    }, [isNear, pulse]);

    const isCompleted = status === "completed";

    return (
        <Animated.View
            style={{ transform: [{ scale: isNear ? pulse : 1 }] }}
            className={`mb-3 rounded-3xl border p-4 shadow-sm ${isNear
                    ? "border-success bg-successLight"
                    : isActive
                        ? "border-brand-primary bg-brand-light"
                        : isCompleted
                            ? "border-border-default bg-bg-card opacity-70"
                            : "border-border-default bg-bg-card"
                }`}
        >
            <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
                <View className="flex-row items-start justify-between">
                    <View className="flex-row flex-1 items-center gap-x-3 pr-2">
                        <View
                            className={`h-10 w-10 items-center justify-center rounded-full ${isNear
                                    ? "bg-success"
                                    : isCompleted
                                        ? "bg-border-default"
                                        : "bg-brand-primary"
                                }`}
                        >
                            {isCompleted ? (
                                <Ionicons name="checkmark" size={16} color="#fff" />
                            ) : (
                                <Text className="text-caption text-text-inverse" fontWeight="bold">
                                    {sequenceNumber}
                                </Text>
                            )}
                        </View>

                        <View className="flex-1">
                            <Text
                                className="text-body text-text-primary"
                                fontWeight="semibold"
                                numberOfLines={1}
                            >
                                {customerName}
                            </Text>
                            <Text className="mt-0.5 text-body-sm text-text-muted" numberOfLines={1}>
                                {address}
                            </Text>

                            {items?.length > 0 && (
                                <View className="mt-2 flex-row flex-wrap gap-1">
                                    {items.map((item) => (
                                        <View key={item} className="rounded-full bg-bg-input px-2 py-1">
                                            <Text className="text-caption text-text-secondary">{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {isNear && (
                        <View className="rounded-full bg-success px-3 py-1">
                            <Text className="text-caption text-text-inverse" fontWeight="semibold">
                                Nearby
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}
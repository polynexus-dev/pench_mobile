import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface Props {
    stopNumber: number;
    customerName: string;
    address: string;
    items: string[];
    orderId: string;
    onMarkDelivered: () => void;
}

export function NextStopCard({
    stopNumber,
    customerName,
    address,
    items,
    orderId,
    onMarkDelivered,
}: Props) {
    const router = useRouter();

    return (
        <View className="mb-5 rounded-card border border-border-disable bg-white overflow-hidden">
            {/* Green header strip */}
            <View className="bg-brand-primary px-4 py-2.5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-2">
                    <View className="bg-white/20 rounded-badge px-2 py-0.5">
                        <Text className="text-caption font-bold text-white">#{stopNumber}</Text>
                    </View>
                    <Text className="text-caption font-semibold text-brand-light uppercase tracking-widest">
                        Next Stop
                    </Text>
                </View>
                <Ionicons name="navigate" size={16} color="white" />
            </View>

            <View className="p-4">
                <Text className="text-body-lg font-bold text-text-primary">{customerName}</Text>
                <View className="flex-row items-start gap-x-1.5 mt-1">
                    <Ionicons name="location-outline" size={14} color="#9E9E9E" style={{ marginTop: 2 }} />
                    <Text className="text-caption text-text-secondary flex-1">{address}</Text>
                </View>

                {/* Item badges */}
                <View className="flex-row flex-wrap gap-2 mt-3">
                    {items.map((item, i) => (
                        <View key={i} className="bg-brand-light rounded-badge px-3 py-1">
                            <Text className="text-caption font-semibold text-brand-primary">{item}</Text>
                        </View>
                    ))}
                </View>

                {/* Action buttons */}
                <View className="flex-row gap-x-3 mt-4">
                    <TouchableOpacity
                        onPress={() =>
                            router.push({
                                pathname: "/(driver)/qr-scan",
                                params: { orderId },
                            } as any)
                        }
                        className="flex-1 flex-row items-center justify-center gap-x-2 border border-brand-primary rounded-btn py-3"
                    >
                        <Ionicons name="qr-code-outline" size={18} color="#1B5E37" />
                        <Text className="text-label font-semibold text-brand-primary">Scan QR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onMarkDelivered}
                        className="flex-1 bg-brand-primary rounded-btn py-3 items-center justify-center"
                    >
                        <Text className="text-label font-semibold text-white">Mark Delivered ✓</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
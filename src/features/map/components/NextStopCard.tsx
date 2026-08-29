import React from "react";
import { View, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/shared/ui/Text/Text";
import { Button } from "@/shared/ui/Button/Button";

type Props = {
    stopNumber: number;
    customerName: string;
    address: string;
    items: string[];
    orderId: string;
    disabled?: boolean;
    customerPhone?: string;
    onMarkDelivered: () => void;
    onMarkUndelivered?: () => void;
};

export default function NextStopCard({
    stopNumber,
    customerName,
    address,
    items = [],
    onMarkDelivered,
    disabled = false,
    onMarkUndelivered,
    customerPhone,
}: Props) {
    return (
        <View className="rounded-[24px] border border-border-default bg-bg-card p-5 mb-4 shadow-sm relative overflow-hidden">
            {/* Active left indicator bar if enabled */}
            {!disabled && <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-primary" />}
            
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 pr-3 pl-1">
                    <View className="flex-row items-center gap-x-1.5 mb-1">
                        <Ionicons name="car-outline" size={14} color="#757575" />
                        <Text variant="caption" color="muted" weight="bold" transform="uppercase" className="tracking-wider">
                            Active Nav Stop
                        </Text>
                    </View>
                    <Text variant="subhead" weight="bold" color="primary">
                        {stopNumber}. {customerName}
                    </Text>
                    <Text variant="body-sm" color="secondary" className="mt-2 leading-relaxed">
                        {address}
                    </Text>
                </View>

                <View className={`rounded-full px-3 py-1 shadow-xs border ${
                    disabled 
                        ? "bg-warningLight/50 border-warning/15" 
                        : "bg-successLight border-success/15"
                }`}>
                    <Text
                        variant="caption-sm"
                        weight="bold"
                        color={disabled ? "warning" : "success"}
                        transform="uppercase"
                        className="text-[10px]"
                    >
                        {disabled ? "Move Closer" : "Ready"}
                    </Text>
                </View>
            </View>

            {items.length > 0 && (
                <View className="mt-4 pl-1 flex-row flex-wrap gap-2">
                    {items.map((item) => (
                        <View key={item} className="rounded-full bg-bg-input px-3 py-1 border border-border-subtle">
                            <Text variant="caption-sm" color="secondary" weight="semibold">{item}</Text>
                        </View>
                    ))}
                </View>
            )}

            <View className="mt-5 pl-1 gap-3">
                <Button
                    label={disabled ? "Move Closer to Enable" : "Mark Delivered"}
                    intent="primary"
                    size="lg"
                    fullWidth
                    disabled={disabled}
                    leftIcon={<Ionicons name="checkmark-circle-outline" size={20} color={disabled ? "#BDBDBD" : "#fff"} />}
                    onPress={onMarkDelivered}
                />
                
                <View className="flex-row gap-x-2.5">
                    {customerPhone && (
                        <TouchableOpacity
                            onPress={() => Linking.openURL(`tel:${customerPhone}`)}
                            activeOpacity={0.7}
                            className="flex-1 flex-row items-center justify-center gap-x-1.5 bg-brand-light border border-brand-primary/10 rounded-btn min-h-[52px]"
                        >
                            <Ionicons name="call-outline" size={18} color="#1B5E37" />
                            <Text variant="body-sm" weight="semibold" color="brand">
                                Call Customer
                            </Text>
                        </TouchableOpacity>
                    )}
                    
                    <View className={customerPhone ? "flex-1" : "w-full"}>
                        <Button
                            label="Not at Home"
                            intent="outline"
                            size="lg"
                            fullWidth
                            disabled={disabled}
                            leftIcon={<Ionicons name="close-circle-outline" size={20} color={disabled ? "#BDBDBD" : "#1B5E37"} />}
                            onPress={onMarkUndelivered}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
}
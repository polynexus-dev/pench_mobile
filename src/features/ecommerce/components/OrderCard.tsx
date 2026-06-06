import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Order } from "@/features/dashboard/api/orderApi";

export function OrderCard({
    order,
    onCancel,
}: {
    order: Order;
    onCancel: (isSpecial: boolean) => void;
}) {
    const isCancelable = (order.status === "pending" || order.status === "confirmed") && !!order.is_special;

    const handleCancelPress = () => {
        Alert.alert("Cancel Order", "Are you sure you want to cancel this delivery order?", [
            { text: "No", style: "cancel" },
            {
                text: "Yes, Cancel",
                style: "destructive",
                onPress: () => onCancel(order.is_special ?? false),
            },
        ]);
    };

    return (
        <View
            className="mb-4 overflow-hidden rounded-2xl bg-white p-4 border border-gray-100"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
            }}
        >
            <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                    <Text className="text-[12px] font-extrabold text-gray-400">
                        ORDER #{order.id.slice(0, 8).toUpperCase()}
                    </Text>
                    {order.status === "pending" && (
                        <View
                            className={`rounded px-1.5 py-0.5 border ${order.is_special ? "bg-sky-50 border-sky-100" : "bg-green-50 border-green-100"
                                }`}
                        >
                            <Text className={`text-[10px] font-bold ${order.is_special ? "text-sky-700" : "text-green-700"}`}>
                                {order.is_special ? "Special Order" : "Subscription"}
                            </Text>
                        </View>
                    )}
                </View>

                <View
                    className={`rounded-full px-2.5 py-1 ${isCancelable ? "bg-amber-100" : order.status === "delivered" ? "bg-green-100" : "bg-gray-100"
                        }`}
                >
                    <Text
                        className={`text-[10px] font-bold ${isCancelable ? "text-amber-700" : order.status === "delivered" ? "text-green-700" : "text-gray-700"
                            }`}
                    >
                        {order.status_display}
                    </Text>
                </View>
            </View>

            {order.items.map((item, idx) => (
                <View key={item.id || idx} className="mb-2 flex-row justify-between">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-[14px] font-medium text-gray-800">{item.quantity}x</Text>
                        <Text className="text-[14px] text-gray-700">{item.product_name}</Text>
                    </View>
                    <Text className="text-[14px] font-medium text-gray-800">₹{item.line_total}</Text>
                </View>
            ))}

            <View className="mt-3 border-t border-gray-100 pt-3 flex-row justify-between items-center">
                <View className="flex-row items-center gap-1.5">
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text className="text-[12px] text-gray-500">{new Date(order.scheduled_delivery_date).toDateString()}</Text>
                </View>

                <View className="flex-row items-center gap-3">
                    {isCancelable && (
                        <TouchableOpacity
                            onPress={handleCancelPress}
                            className="rounded-lg bg-red-50 border border-red-100 px-3 py-1.5"
                        >
                            <Text className="text-[12px] font-bold text-red-600">Cancel</Text>
                        </TouchableOpacity>
                    )}
                    <Text className="text-[15px] font-black text-[#1B5E37]">₹{order.total}</Text>
                </View>
            </View>
        </View>
    );
}
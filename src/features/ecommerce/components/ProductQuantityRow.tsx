import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "@/features/dashboard/api/productApi";

export function ProductQuantityRow({
    product,
    quantity,
    onMinus,
    onPlus,
}: {
    product: Product;
    quantity: number;
    onMinus: () => void;
    onPlus: () => void;
}) {
    return (
        <View className="mb-4 flex-row items-center justify-between rounded-2xl bg-gray-50 p-4 border border-gray-100">
            <View className="flex-1 pr-3">
                <Text className="text-[15px] font-bold text-gray-900">{product.name}</Text>
                <Text className="mt-0.5 text-[12px] text-gray-500">
                    {product.description || `${product.unit || "unit"}`}
                </Text>
                <Text className="mt-1 text-[14px] font-black text-[#1B5E37]">₹{product.unit_price}</Text>
            </View>

            <View className="flex-row items-center rounded-xl bg-white border border-gray-200 p-1">
                <TouchableOpacity onPress={onMinus} className="h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
                    <Ionicons name="remove" size={16} color="#4B5563" />
                </TouchableOpacity>

                <Text className="w-10 text-center text-[15px] font-bold text-gray-900">{quantity}</Text>

                <TouchableOpacity onPress={onPlus} className="h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
                    <Ionicons name="add" size={16} color="#4B5563" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
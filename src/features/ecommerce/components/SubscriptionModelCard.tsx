import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SubscriptionModelCardProps {
  model: any;
  onSubscribe: (model: any) => void;
}

export function SubscriptionModelCard({ model, onSubscribe }: SubscriptionModelCardProps) {
  return (
    <View
      className="mb-4 overflow-hidden rounded-2xl bg-white p-4 border border-neutral-100 shadow-sm"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-[#E8F5EE]">
          <Ionicons name="water" size={18} color="#1B5E37" />
        </View>
        <View className="flex-1">
          <Text className="text-[14px] font-bold text-gray-900 leading-tight">
            {model.product_name}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <View className="bg-gray-100 rounded px-1.5 py-0.5">
              <Text className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">
                {model.frequency_display}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 font-semibold">
              Qty: {model.quantity} ({model.unit})
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <Text className="text-[11px] text-gray-400 font-semibold">
          🔥 {model.count} customers subscribed
        </Text>
        <TouchableOpacity
          onPress={() => onSubscribe(model)}
          activeOpacity={0.8}
          className="bg-[#1B5E37] px-3.5 py-1.5 rounded-xl shadow-xs"
        >
          <Text className="text-white text-[11px] font-bold">
            Subscribe
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

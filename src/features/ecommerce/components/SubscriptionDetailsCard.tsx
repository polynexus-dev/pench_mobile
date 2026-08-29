import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SubscriptionSummary } from "@/features/ecommerce/types/ecommerce.types";

interface SubscriptionDetailsCardProps {
  sub: SubscriptionSummary;
}

export function SubscriptionDetailsCard({ sub }: SubscriptionDetailsCardProps) {
  const isPaused = sub.is_paused;
  const items = sub.items || [];
  const productName = items[0]?.product_name || "Milk Delivery Plan";
  const quantity = items[0]?.quantity || 1;

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
      {/* Top row with Title & Badge */}
      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-[#E8F5EE]">
            <Ionicons name="water" size={18} color="#1B5E37" />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-gray-900 leading-tight">
              {productName}
            </Text>
            <Text className="text-[11px] text-gray-500 font-semibold mt-0.5">
              {sub.frequency_display} Delivery
            </Text>
          </View>
        </View>
        <View className={`rounded-full px-2.5 py-1 ${isPaused ? "bg-amber-100" : "bg-green-100"}`}>
          <Text className={`text-[10px] font-bold ${isPaused ? "text-amber-700" : "text-green-700"}`}>
            {isPaused ? "PAUSED" : "ACTIVE"}
          </Text>
        </View>
      </View>

      {/* Details Section */}
      <View className="border-t border-gray-50 pt-3 flex-row flex-wrap justify-between gap-y-3">
        <View className="w-[48%]">
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Start Date</Text>
          <Text className="text-xs font-semibold text-gray-800 mt-0.5">
            {sub.subscription_start || "—"}
          </Text>
        </View>
        <View className="w-[48%] items-end">
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">End Date</Text>
          <Text className="text-xs font-semibold text-gray-800 mt-0.5">
            {sub.subscription_end || "Continuous"}
          </Text>
        </View>
        <View className="w-[48%]">
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quantity</Text>
          <Text className="text-xs font-semibold text-gray-800 mt-0.5">
            {quantity} {sub.items?.[0]?.product_id ? "Litre(s)" : ""}
          </Text>
        </View>
        <View className="w-[48%] items-end">
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</Text>
          <Text className="text-xs font-semibold text-gray-800 mt-0.5 capitalize">
            {sub.status}
          </Text>
        </View>
      </View>

      {/* Items List (if more than 1 item) */}
      {items.length > 1 && (
        <View className="mt-3 border-t border-gray-50 pt-3">
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            All Items in Plan
          </Text>
          {items.map((item, idx) => (
            <View key={idx} className="flex-row justify-between items-center py-1.5 border-b border-neutral-50 last:border-b-0">
              <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                <Ionicons name="cube-outline" size={14} color="#6B7280" />
                <Text className="text-xs font-semibold text-gray-700 leading-tight" numberOfLines={1}>
                  {item.product_name}
                </Text>
              </View>
              <Text className="text-xs font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                Qty: {item.quantity}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Delivery Details: Address & Special Instructions (if exist on summary object) */}
      {((sub as any).delivery_address || (sub as any).special_instructions) && (
        <View className="mt-3 border-t border-gray-50 pt-3">
          {(sub as any).delivery_address && (
            <View className="mb-2">
              <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivery Address</Text>
              <Text className="text-xs text-gray-600 mt-0.5 leading-normal">
                {(sub as any).delivery_address}
              </Text>
            </View>
          )}
          {(sub as any).special_instructions && (
            <View>
              <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Special Instructions</Text>
              <Text className="text-xs text-amber-700 font-medium mt-0.5 leading-normal">
                {(sub as any).special_instructions}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

import React from "react";
import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SubscriptionModelCardProps {
  model: any;
  onSubscribe: (model: any) => void;
  isSelected?: boolean;
}

const getProductThumbnail = (name: string) => {
  const text = name.toLowerCase();
  if (text.includes("milk")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-21.png";
  if (text.includes("paneer")) return "https://penchfoods.com/wp-content/uploads/2020/11/Paneer.png";
  if (text.includes("ghee")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-22.png";
  return "https://images.unsplash.com/photo-1628105652613-2d5fc2f3a6cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80";
};

export function SubscriptionModelCard({ model, isSelected }: SubscriptionModelCardProps) {
  const imageUrl = getProductThumbnail(model.product_name || "");

  return (
    <View
      className="p-3 rounded-2xl flex-row items-center justify-between mb-1"
      style={{
        backgroundColor: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
        ...(isSelected ? {
          shadowColor: "#1B5E37",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        } : {})
      }}
    >
      <View className="flex-row items-center gap-3 flex-1 pr-2">
        {/* Product image thumbnail */}
        <View className="h-10 w-10 rounded-xl bg-neutral-100 items-center justify-center overflow-hidden">
          <Image
            source={{ uri: imageUrl }}
            className="h-8 w-8"
            resizeMode="contain"
          />
        </View>

        <View className="flex-1">
          <Text className="text-[13px] font-black text-gray-900 leading-tight">
            {model.product_name}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-[10px] font-bold text-[#1B5E37] bg-[#E8F5EE] px-1.5 py-0.5 rounded">
              {model.frequency_display}
            </Text>
            <Text className="text-[10px] font-semibold text-gray-400">
              Qty: {model.quantity} {model.unit}
            </Text>
          </View>
          <Text className="text-[11px] font-black text-gray-800 mt-1">
            ₹{Number(model.unit_price || model.price || 45) * (model.quantity || 1)} / day
          </Text>
        </View>
      </View>

      {/* Right side check / selection visual */}
      <View className="flex-row items-center gap-3">
        {model.count > 0 && (
          <View className="bg-gray-100 px-2 py-0.5 rounded-full flex-row items-center gap-0.5">
            <Ionicons name="flame" size={10} color="#F97316" />
            <Text className="text-[9px] font-bold text-gray-500">{model.count}</Text>
          </View>
        )}
        <View className={`h-5 w-5 rounded-full border items-center justify-center ${
          isSelected ? "border-[#1B5E37] bg-[#1B5E37]" : "border-gray-300"
        }`}>
          {isSelected && <Ionicons name="checkmark" size={12} color="white" />}
        </View>
      </View>
    </View>
  );
}

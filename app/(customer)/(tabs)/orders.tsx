import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";
import { orderApi, Order } from "@/features/dashboard/api/orderApi";
import { Ionicons } from "@expo/vector-icons";

function OrderCard({ order }: { order: Order }) {
  const isPending = order.status === "pending" || order.status === "confirmed";
  
  return (
    <View className="mb-4 overflow-hidden rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[12px] font-extrabold text-gray-400">ORDER #{order.id.slice(0, 8).toUpperCase()}</Text>
        <View
          className={`rounded-full px-2.5 py-1 ${
            isPending
              ? "bg-amber-100"
              : order.status === "delivered"
              ? "bg-green-100"
              : "bg-gray-100"
          }`}
        >
          <Text
            className={`text-[10px] font-bold ${
              isPending
                ? "text-amber-700"
                : order.status === "delivered"
                ? "text-green-700"
                : "text-gray-700"
            }`}
          >
            {order.status_display}
          </Text>
        </View>
      </View>

      {order.items.map((item, idx) => (
        <View key={item.id || idx} className="mb-2 flex-row justify-between">
          <View className="flex-row items-center gap-2">
            <Text className="text-[14px] font-medium text-gray-800">
              {item.quantity}x
            </Text>
            <Text className="text-[14px] text-gray-700">{item.product_name}</Text>
          </View>
          <Text className="text-[14px] font-medium text-gray-800">
            ₹{item.total_price}
          </Text>
        </View>
      ))}

      <View className="mt-3 border-t border-gray-100 pt-3 flex-row justify-between items-center">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text className="text-[12px] text-gray-500">
            {new Date(order.scheduled_delivery_date).toDateString()}
          </Text>
        </View>
        <Text className="text-[15px] font-black text-[#1B5E37]">
          ₹{order.total_amount}
        </Text>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const { user } = useAuthStore();
  const domainName = useAuthStore((s) => s.domain_name) || "";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"history" | "upcoming">("upcoming");

  const fetchOrders = async () => {
    try {
      const data = await orderApi.getOrders(domainName, user?.id);
      setOrders(data);
    } catch (e) {
      console.warn("Failed to fetch orders:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (domainName) {
      fetchOrders();
    }
  }, [domainName]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders = orders.filter((o) => {
    const isPending = o.status === "pending" || o.status === "confirmed" || o.status === "dispatched" || o.status === "in_transit";
    return tab === "upcoming" ? isPending : !isPending;
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8F6]">
      <View className="px-4 py-4">
        <Text className="mb-4 text-2xl font-black text-gray-900">Your Orders</Text>
        <View className="flex-row rounded-xl bg-gray-200 p-1">
          <TouchableOpacity
            className={`flex-1 items-center justify-center rounded-lg py-2 ${
              tab === "upcoming" ? "bg-white shadow-sm" : ""
            }`}
            onPress={() => setTab("upcoming")}
          >
            <Text
              className={`text-[13px] font-bold ${
                tab === "upcoming" ? "text-gray-900" : "text-gray-500"
              }`}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center justify-center rounded-lg py-2 ${
              tab === "history" ? "bg-white shadow-sm" : ""
            }`}
            onPress={() => setTab("history")}
          >
            <Text
              className={`text-[13px] font-bold ${
                tab === "history" ? "text-gray-900" : "text-gray-500"
              }`}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1B5E37" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => <OrderCard order={item} />}
          ListEmptyComponent={
            <View className="mt-12 items-center justify-center">
              <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
              <Text className="mt-4 text-center text-gray-500">
                No {tab} orders found.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

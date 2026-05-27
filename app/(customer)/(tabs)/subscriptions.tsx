import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";
import { subscriptionApi, SubscriptionSummary } from "@/features/dashboard/api/subscriptionApi";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

function SubscriptionCard({ sub, year, month }: { sub: SubscriptionSummary; year: number; month: number }) {
  const isPaused = sub.is_paused;
  
  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => router.push({
        pathname: "/(customer)/subscription/[id]",
        params: { id: sub.subscription_id, year, month }
      })}
      className="mb-4 overflow-hidden rounded-2xl bg-white p-4 shadow-sm border border-gray-100"
    >
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-50">
            <Ionicons name="water-outline" size={16} color="#3B82F6" />
          </View>
          <Text className="text-[16px] font-bold text-gray-900">Milk Delivery</Text>
        </View>
        <View
          className={`rounded-full px-2.5 py-1 ${
            isPaused ? "bg-amber-100" : "bg-green-100"
          }`}
        >
          <Text
            className={`text-[10px] font-bold ${
              isPaused ? "text-amber-700" : "text-green-700"
            }`}
          >
            {isPaused ? "PAUSED" : "ACTIVE"}
          </Text>
        </View>
      </View>

      <View className="mb-4 flex-row items-center gap-2">
        <Ionicons name="sync-outline" size={14} color="#6B7280" />
        <Text className="text-[13px] text-gray-600">
          {sub.frequency_display}
        </Text>
      </View>

      <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
        <Text className="text-[13px] font-medium text-gray-500">View Delivery Calendar</Text>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

export default function SubscriptionsScreen() {
  const { user } = useAuthStore();
  const domainName = useAuthStore((s) => s.domain_name) || "";
  const [subs, setSubs] = useState<SubscriptionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const fetchSubs = async () => {
    if (!domainName || !user?.id) return;
    try {
      const targetId = user.customer_uuid || user.id.toString();
      const data = await subscriptionApi.getCustomerMonthlySummary(domainName, targetId, year, month);
      setSubs(data.subscriptions || []);
    } catch (e) {
      console.warn("Failed to fetch subscriptions:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (domainName) {
      fetchSubs();
    }
  }, [domainName]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubs();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8F6]">
      <View className="px-4 py-4">
        <Text className="mb-1 text-2xl font-black text-gray-900">Subscriptions</Text>
        <Text className="text-[14px] text-gray-500">Manage your daily deliveries and vacation pauses</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1B5E37" />
        </View>
      ) : (
        <FlatList
          data={subs}
          keyExtractor={(item) => item.subscription_id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => <SubscriptionCard sub={item} year={year} month={month} />}
          ListEmptyComponent={
            <View className="mt-12 items-center justify-center px-4">
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text className="mt-4 text-center text-[16px] font-bold text-gray-900">
                No active subscriptions
              </Text>
              <Text className="mt-2 text-center text-[14px] text-gray-500">
                You don't have any active subscriptions yet.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

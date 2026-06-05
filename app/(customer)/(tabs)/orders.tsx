import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/useCartStore";
import { orderApi, Order } from "@/features/dashboard/api/orderApi";
import { productApi, Product } from "@/features/dashboard/api/productApi";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { StatusBar } from "expo-status-bar";

function OrderCard({ order, onCancel }: { order: Order; onCancel: (isSpecial: boolean) => void }) {
  const isCancelable = (order.status === "pending" || order.status === "confirmed") && !!order.is_special;

  const handleCancelPress = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this delivery order?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => onCancel(order.is_special ?? false),
        },
      ]
    );
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
            <View className={`rounded px-1.5 py-0.5 border ${
              order.is_special
                ? "bg-sky-50 border-sky-100"
                : "bg-green-50 border-green-100"
            }`}>
              <Text className={`text-[10px] font-bold ${
                order.is_special ? "text-sky-700" : "text-green-700"
              }`}>
                {order.is_special ? "Special Order" : "Subscription"}
              </Text>
            </View>
          )}
        </View>
        <View
          className={`rounded-full px-2.5 py-1 ${
            isCancelable
              ? "bg-amber-100"
              : order.status === "delivered"
              ? "bg-green-100"
              : "bg-gray-100"
          }`}
        >
          <Text
            className={`text-[10px] font-bold ${
              isCancelable
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
            ₹{item.line_total}
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
        
        <View className="flex-row items-center gap-3">
          {isCancelable && (
            <TouchableOpacity
              onPress={handleCancelPress}
              className="rounded-lg bg-red-50 border border-red-100 px-3 py-1.5"
            >
              <Text className="text-[12px] font-bold text-red-600">Cancel</Text>
            </TouchableOpacity>
          )}
          <Text className="text-[15px] font-black text-[#1B5E37]">
            ₹{order.total}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const { user } = useAuthStore();
  const domainName = useAuthStore((s) => s.domain_name) || "";
  
  const params = useLocalSearchParams<{ openModal?: string }>();
  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"history" | "upcoming">("upcoming");
  
  // Ordering Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [orderDate, setOrderDate] = useState("");
  const [quantities, setQuantities] = useState<Record<string | number, number>>({});
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isTodayEligible = () => {
    const todayStr = getLocalDateString(new Date());
    const todayOrder = orders.find(o => o.scheduled_delivery_date === todayStr);
    if (!todayOrder) return true; // No order placed yet for today, absolutely eligible!
    // Eligible if not dispatched, not in transit, not delivered/undelivered
    return todayOrder.status === "pending" || todayOrder.status === "confirmed";
  };

  useEffect(() => {
    if (params.openModal === "true") {
      openOrderModal();
    }
  }, [params.openModal]);

  const fetchOrders = async () => {
    try {
      const data = await orderApi.getOrders(domainName);
      setOrders(data);
    } catch (e) {
      console.warn("Failed to fetch orders:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productApi.getProducts(domainName);
      setProducts(data.filter(p => p.is_active));
    } catch (e) {
      console.warn("Failed to fetch products:", e);
    }
  };

  useEffect(() => {
    if (domainName) {
      fetchOrders();
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [domainName]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
    fetchProducts();
  };

  const handleCancelOrder = async (orderId: string, isSpecial: boolean) => {
    try {
      setLoading(true);
      await orderApi.deleteOrder(domainName, orderId);
      const orderTypeLabel = isSpecial ? "special order" : "subscription delivery order";
      Alert.alert("Cancelled", `Your ${orderTypeLabel} has been successfully cancelled.`);
      fetchOrders();
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not cancel order.");
      setLoading(false);
    }
  };

  const openOrderModal = () => {
    // Set default order date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setOrderDate(getLocalDateString(tomorrow));
    
    // Pre-fill quantities from dashboard cart store!
    const initialQuantities: Record<string | number, number> = {};
    cartItems.forEach((item) => {
      if (item.quantity > 0) {
        initialQuantities[item.id] = item.quantity;
      }
    });
    setQuantities(initialQuantities);
    setShowCalendar(false);
    setIsModalOpen(true);
  };

  const updateQuantity = (productId: string | number, amount: number) => {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      const updated = Math.max(0, current + amount);
      return { ...prev, [productId]: updated };
    });
  };

  const handlePlaceOrder = async () => {
    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([prodId, qty]) => ({
        product: prodId,
        quantity: qty,
      }));

    if (items.length === 0) {
      Alert.alert("Empty Selection", "Please add at least 1 product to place an order.");
      return;
    }

    if (!orderDate.trim()) {
      Alert.alert("Required Date", "Please enter a valid scheduled delivery date.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      await orderApi.createOrder(domainName, {
        scheduled_delivery_date: orderDate,
        items,
      });
      Alert.alert("Order Placed!", "Your one-time extra order has been successfully placed!");
      clearCart();
      setIsModalOpen(false);
      fetchOrders();
    } catch (e: any) {
      Alert.alert("Order Failed", e?.message || "Failed to create order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (tab === "upcoming") {
      return (
        o.status === "pending" ||
        o.status === "confirmed" ||
        o.status === "dispatched" ||
        o.status === "in_transit"
      );
    } else {
      return o.status === "delivered";
    }
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8F6]">
      <StatusBar style="dark" />
      <View className="px-4 py-4 border-b border-gray-100 bg-white">
        <Text className="text-2xl font-black text-gray-900">Your Orders</Text>
        <Text className="text-[13px] text-gray-500">Track and manage your upcoming deliveries</Text>
      </View>

      <View className="px-4 py-3">
        <View className="flex-row rounded-xl bg-gray-200/80 p-1">
          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-lg py-2"
            style={
              tab === "upcoming"
                ? {
                    backgroundColor: "white",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 1,
                    elevation: 1,
                  }
                : { backgroundColor: "transparent" }
            }
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
            className="flex-1 items-center justify-center rounded-lg py-2"
            style={
              tab === "history"
                ? {
                    backgroundColor: "white",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 1,
                    elevation: 1,
                  }
                : { backgroundColor: "transparent" }
            }
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
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <OrderCard order={item} onCancel={(isSpecial) => handleCancelOrder(item.id, isSpecial)} />
          )}
          ListEmptyComponent={
            <View className="mt-16 items-center justify-center px-4">
              <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
              <Text className="mt-4 text-center text-[16px] font-bold text-gray-900">
                No {tab} orders found
              </Text>
              <Text className="mt-2 text-center text-[14px] text-gray-500">
                Place a special order or start a subscription to see deliveries here.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) for placing a one-time order */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={openOrderModal}
        className="absolute bottom-6 right-6 flex-row items-center gap-2 bg-[#1B5E37] px-5 py-4 rounded-full shadow-lg"
        style={{
          shadowColor: "#1B5E37",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 6,
          zIndex: 999,
        }}
      >
        <Ionicons name="cart-outline" size={20} color="white" />
        <Text className="text-[14px] font-bold text-white">Order Extra</Text>
      </TouchableOpacity>

      {/* Place Special/Extra Order Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="h-[80%] rounded-t-[32px] bg-white p-5">
            {/* Modal Header */}
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[20px] font-extrabold text-gray-900">
                Order Extra Items
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {/* Delivery Date Field */}
              <Text className="mb-2 text-[13px] font-bold text-gray-700">
                Delivery Date
              </Text>
              
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowCalendar(!showCalendar)}
                className="mb-3 flex-row items-center justify-between rounded-xl bg-gray-50 px-3.5 py-3 border border-gray-200"
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                  <Text className="text-[15px] font-semibold text-gray-900">
                    {orderDate ? new Date(orderDate).toDateString() : "Select Date"}
                  </Text>
                </View>
                <Ionicons name={showCalendar ? "chevron-up" : "chevron-down"} size={16} color="#6B7280" />
              </TouchableOpacity>

              {/* Expandable Calendar */}
              {showCalendar && (
                <View className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <Calendar
                    current={orderDate || getLocalDateString(new Date())}
                    minDate={getLocalDateString(new Date())}
                    onDayPress={(day) => {
                      setOrderDate(day.dateString);
                      setShowCalendar(false);
                    }}
                    markedDates={{
                      [orderDate]: { selected: true, selectedColor: "#1B5E37" }
                    }}
                    theme={{
                      selectedDayBackgroundColor: "#1B5E37",
                      selectedDayTextColor: "white",
                      todayTextColor: "#1B5E37",
                      arrowColor: "#1B5E37",
                      dotColor: "#1B5E37",
                    }}
                  />
                </View>
              )}

              {/* Date Quick picks */}
              <View className="mb-6 flex-row gap-2">
                {isTodayEligible() && (
                  <TouchableOpacity
                    onPress={() => {
                      setOrderDate(getLocalDateString(new Date()));
                    }}
                    className={`flex-1 rounded-lg py-2 border items-center ${
                      orderDate === getLocalDateString(new Date())
                        ? "bg-[#1B5E37]/10 border-[#1B5E37]"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <Text className={`text-[12px] font-bold ${
                      orderDate === getLocalDateString(new Date()) ? "text-[#1B5E37]" : "text-gray-700"
                    }`}>Today</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  onPress={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setOrderDate(getLocalDateString(tomorrow));
                  }}
                  className={`flex-1 rounded-lg py-2 border items-center ${
                    orderDate === (() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      return getLocalDateString(tomorrow);
                    })()
                      ? "bg-[#1B5E37]/10 border-[#1B5E37]"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <Text className={`text-[12px] font-bold ${
                    orderDate === (() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      return getLocalDateString(tomorrow);
                    })() ? "text-[#1B5E37]" : "text-gray-700"
                  }`}>Tomorrow</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const dayAfter = new Date();
                    dayAfter.setDate(dayAfter.getDate() + 2);
                    setOrderDate(getLocalDateString(dayAfter));
                  }}
                  className={`flex-1 rounded-lg py-2 border items-center ${
                    orderDate === (() => {
                      const dayAfter = new Date();
                      dayAfter.setDate(dayAfter.getDate() + 2);
                      return getLocalDateString(dayAfter);
                    })()
                      ? "bg-[#1B5E37]/10 border-[#1B5E37]"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <Text className={`text-[12px] font-bold ${
                    orderDate === (() => {
                      const dayAfter = new Date();
                      dayAfter.setDate(dayAfter.getDate() + 2);
                      return getLocalDateString(dayAfter);
                    })() ? "text-[#1B5E37]" : "text-gray-700"
                  }`}>Day After</Text>
                </TouchableOpacity>
              </View>

              {/* Products List */}
              <Text className="mb-3 text-[14px] font-black text-gray-900">
                Select Products
              </Text>

              {products.length === 0 ? (
                <View className="py-8 items-center justify-center">
                  <ActivityIndicator size="small" color="#1B5E37" />
                  <Text className="mt-2 text-xs text-gray-500">Loading products...</Text>
                </View>
              ) : (
                products.map((product) => {
                  const qty = quantities[product.id] || 0;
                  return (
                    <View
                      key={product.id}
                      className="mb-4 flex-row items-center justify-between rounded-2xl bg-gray-50 p-4 border border-gray-100"
                    >
                      <View className="flex-1 pr-3">
                        <Text className="text-[15px] font-bold text-gray-900">
                          {product.name}
                        </Text>
                        <Text className="mt-0.5 text-[12px] text-gray-500">
                          {product.description || `${product.unit || "unit"}`}
                        </Text>
                        <Text className="mt-1 text-[14px] font-black text-[#1B5E37]">
                          ₹{product.unit_price}
                        </Text>
                      </View>

                      {/* Stepper */}
                      <View className="flex-row items-center rounded-xl bg-white border border-gray-200 p-1">
                        <TouchableOpacity
                          onPress={() => updateQuantity(product.id, -1)}
                          className="h-8 w-8 items-center justify-center rounded-lg bg-gray-50"
                        >
                          <Ionicons name="remove" size={16} color="#4B5563" />
                        </TouchableOpacity>
                        <Text className="w-10 text-center text-[15px] font-bold text-gray-900">
                          {qty}
                        </Text>
                        <TouchableOpacity
                          onPress={() => updateQuantity(product.id, 1)}
                          className="h-8 w-8 items-center justify-center rounded-lg bg-gray-50"
                        >
                          <Ionicons name="add" size={16} color="#4B5563" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Confirm buttons */}
            <View className="flex-row gap-3 pt-4 border-t border-gray-100">
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                disabled={isPlacingOrder}
                className="flex-1 rounded-xl bg-white py-3.5 border border-gray-300 items-center"
              >
                <Text className="text-[15px] font-bold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="flex-1 rounded-xl bg-[#1B5E37] py-3.5 items-center"
              >
                {isPlacingOrder ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-[15px] font-bold text-white">Place Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

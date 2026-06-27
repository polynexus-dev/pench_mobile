import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/useCartStore";
import { orderApi } from "@/features/dashboard/api/orderApi";

const getProductThumbnail = (name: string) => {
  const text = name.toLowerCase();
  if (text.includes("milk")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-21.png";
  if (text.includes("paneer")) return "https://penchfoods.com/wp-content/uploads/2020/11/Paneer.png";
  if (text.includes("ghee")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-22.png";
  return "https://images.unsplash.com/photo-1628105652613-2d5fc2f3a6cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80";
};

const parseSubscriptionDetails = (name: string) => {
  const subRegex = /\((?:Sub: )?([^-\)]+)-\s*([^\)]+)\)/i;
  const match = name.match(subRegex);
  if (match) {
    return {
      frequency: match[1].trim(),
      quantity: match[2].trim(),
    };
  }
  return null;
};

interface CartItemRowProps {
  item: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  addToCart: (item: any) => void;
  removeFromCart: (id: string | number) => void;
}

const CartItemRow = React.memo(({
  item,
  isExpanded,
  onToggleExpand,
  addToCart,
  removeFromCart
}: CartItemRowProps) => {
  const isSub = typeof item.id === "string" && item.id.startsWith("sub_");
  const subDetails = isSub ? parseSubscriptionDetails(item.name) : null;
  const cleanName = isSub ? item.name.split(" (")[0] : item.name;

  const animatedHeight = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const heightStyle = {
    height: animatedHeight.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 98],
    }),
    opacity: animatedHeight.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    overflow: "hidden" as const,
  };

  return (
    <View
      className="mb-4 rounded-2xl bg-white p-3.5 border border-gray-100/70"
      style={{
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1.5,
      }}
    >
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          activeOpacity={isSub ? 0.7 : 1.0}
          onPress={() => isSub && onToggleExpand()}
          className="flex-row items-center flex-1 pr-3"
        >
          <View className="h-12 w-12 rounded-xl bg-gray-50 items-center justify-center overflow-hidden border border-gray-100 p-1 mr-3">
            <Image
              source={{ uri: getProductThumbnail(item.name) }}
              className="h-9 w-9"
              resizeMode="cover"
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 flex-wrap">
              <Text className="text-[14px] font-bold text-gray-900" numberOfLines={2}>
                {cleanName}
              </Text>
              {isSub && (
                <View 
                  style={{ backgroundColor: "rgba(27, 94, 55, 0.08)", borderColor: "rgba(27, 94, 55, 0.15)" }} 
                  className="px-1.5 py-0.5 rounded-md border"
                >
                  <Text className="text-[8px] font-black text-[#1B5E37] uppercase tracking-wider">
                    Subscription
                  </Text>
                </View>
              )}
            </View>
            
            <View className="flex-row items-center gap-2 mt-1">
              <Text className="text-[13px] font-extrabold text-[#1B5E37]">
                ₹{item.price}
              </Text>
              
              {isSub && (
                <View
                  className="flex-row items-center gap-0.5 py-0.5 px-1.5 bg-gray-50 border border-gray-100 rounded-md"
                >
                  <Text className="text-[9px] font-bold text-gray-500">Details</Text>
                  <Ionicons 
                    name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"} 
                    size={9} 
                    color="#6B7280" 
                  />
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Controls */}
        {isSub ? (
          <TouchableOpacity
            onPress={() => removeFromCart(item.id)}
            className="h-9 w-9 items-center justify-center rounded-full bg-red-50 border border-red-100"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
          </TouchableOpacity>
        ) : (
          <View className="flex-row items-center rounded-full bg-[#0C5A35]/5 border border-[#0C5A35]/10 p-1">
            <TouchableOpacity
              onPress={() => removeFromCart(item.id)}
              className="h-8 w-8 items-center justify-center rounded-full bg-white shadow-xs border border-gray-200/40"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="remove" size={14} color="#0C5A35" />
            </TouchableOpacity>
            <Text className="w-9 text-center text-[13px] font-black text-gray-800">
              {item.quantity}
            </Text>
            <TouchableOpacity
              onPress={() =>
                addToCart({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  quantity: 1,
                })
              }
              className="h-8 w-8 items-center justify-center rounded-full bg-white shadow-xs border border-gray-200/40"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add" size={14} color="#0C5A35" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Expandable Subscription Details Section */}
      {isSub && (
        <Animated.View style={heightStyle}>
          <View 
            style={{ backgroundColor: "rgba(250, 249, 246, 0.8)", borderColor: "rgba(229, 229, 229, 0.4)" }} 
            className="mt-3 p-3 rounded-xl border border-dashed gap-y-1.5"
          >
            <View className="flex-row justify-between">
              <Text className="text-[13px] font-semibold text-gray-500">Frequency</Text>
              <Text className="text-[13px] font-bold text-gray-800">{subDetails?.frequency || "Standard Plan"}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[13px] font-semibold text-gray-500">Volume per Delivery</Text>
              <Text className="text-[13px] font-bold text-gray-800">{subDetails?.quantity || "1.0 L"}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[13px] font-semibold text-gray-500">Rate (₹ / Delivery)</Text>
              <Text className="text-[13px] font-black text-[#1B5E37]">₹{item.price}</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
});

export function CartScreen() {
  const { user } = useAuthStore();
  const domainName = useAuthStore((s) => s.domain_name) || "";
  const cartItems = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);

  const [orderDate, setOrderDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<string | number, boolean>>({});

  const toggleExpand = (id: string | number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setOrderDate(getLocalDateString(tomorrow));
  }, []);

  const fetchOrders = async () => {
    if (!domainName) return;
    try {
      const data = await orderApi.getOrders(domainName);
      setOrders(data);
    } catch (e) {
      console.warn("Failed to fetch orders:", e);
    }
  };

  useEffect(() => {
    if (domainName) {
      fetchOrders();
    }
  }, [domainName]);

  const isTodayEligible = () => {
    const todayStr = getLocalDateString(new Date());
    const todayOrder = orders.find((o) => o.scheduled_delivery_date === todayStr);
    if (!todayOrder) return true;
    return todayOrder.status === "pending" || todayOrder.status === "confirmed";
  };

  const handlePlaceOrder = async () => {
    const items = cartItems.map((item) => ({
      product: item.id,
      quantity: item.quantity,
    }));

    if (items.length === 0) {
      Alert.alert("Empty Selection", "Please add at least 1 product to place an order.");
      return;
    }

    if (!orderDate.trim()) {
      Alert.alert("Required Date", "Please select a valid scheduled delivery date.");
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
      router.replace("/(customer)/(tabs)/dashboard");
    } catch (e: any) {
      Alert.alert("Order Failed", e?.message || "Failed to create order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => {
    const isSub = typeof item.id === "string" && item.id.startsWith("sub_");
    let multiplier = 1;
    if (isSub) {
      const idStr = String(item.id).toLowerCase();
      if (idStr.includes("alternate")) {
        multiplier = 15;
      } else if (idStr.includes("mon_wed_fri") || idStr.includes("tue_thu_sat")) {
        multiplier = 13;
      } else if (idStr.includes("weekends")) {
        multiplier = 8;
      } else {
        multiplier = 30;
      }
    }
    return sum + item.price * item.quantity * multiplier;
  }, 0);

  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFD]" edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="flex-row items-center border-b border-gray-100 bg-white px-4 py-3.5 shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-[18px] font-black text-gray-900">Your Cart</Text>
          <Text className="text-[11px] font-bold text-gray-500 mt-0.5">Place a one-time order</Text>
        </View>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={() => clearCart()} className="px-2 py-1 rounded-md bg-red-50">
            <Text className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Delete All</Text>
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
        /* Empty State */
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-28 w-28 items-center justify-center rounded-full bg-[#E5EFEA] mb-5">
            <Ionicons name="cart-outline" size={56} color="#0C5A35" />
          </View>
          <Text className="text-lg font-black text-gray-900 mb-2">Your cart is empty</Text>
          <Text className="text-[13px] font-medium text-gray-500 text-center mb-6 max-w-[260px] leading-5">
            Add some pure, farm-fresh milk and organic dairy essentials to your cart.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="rounded-full bg-[#0C5A35] px-8 py-3.5 shadow-md active:opacity-90"
          >
            <Text className="text-[14px] font-bold text-white uppercase tracking-wider">Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Scrollable Content */
        <View className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Selected Products List */}
            <Text className="mb-3 text-[14px] font-black text-gray-900 uppercase tracking-wider">
              Selected Products
            </Text>

            {cartItems.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                isExpanded={expandedItems[item.id] || false}
                onToggleExpand={() => toggleExpand(item.id)}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
              />
            ))}

            {/* Delivery Date */}
            <Text className="mt-6 mb-3 text-[14px] font-black text-gray-900 uppercase tracking-wider">
              {cartItems.some((item) => typeof item.id === "string" && item.id.startsWith("sub_"))
                ? "Subscription Start Date"
                : "Delivery Date"}
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowCalendar(!showCalendar)}
              className="mb-3 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3.5 border border-gray-200/60 shadow-xs"
            >
              <View className="flex-row items-center gap-2.5">
                <Ionicons name="calendar-outline" size={18} color="#0C5A35" />
                <Text className="text-[14px] font-bold text-gray-800">
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
                    [orderDate]: { selected: true, selectedColor: "#1B5E37" },
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
                  className={`flex-1 rounded-xl py-2.5 border items-center shadow-xs ${
                    orderDate === getLocalDateString(new Date())
                      ? "bg-[#1B5E37]/10 border-[#1B5E37]"
                      : "bg-white border-gray-200/60"
                  }`}
                >
                  <Text
                    className={`text-[12px] font-black ${
                      orderDate === getLocalDateString(new Date())
                        ? "text-[#1B5E37]"
                        : "text-gray-600"
                    }`}
                  >
                    Today
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setOrderDate(getLocalDateString(tomorrow));
                }}
                className={`flex-1 rounded-xl py-2.5 border items-center shadow-xs ${
                  orderDate ===
                  (() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return getLocalDateString(tomorrow);
                  })()
                    ? "bg-[#1B5E37]/10 border-[#1B5E37]"
                    : "bg-white border-gray-200/60"
                }`}
              >
                <Text
                  className={`text-[12px] font-black ${
                    orderDate ===
                    (() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      return getLocalDateString(tomorrow);
                    })()
                      ? "text-[#1B5E37]"
                      : "text-gray-600"
                  }`}
                >
                  Tomorrow
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const dayAfter = new Date();
                  dayAfter.setDate(dayAfter.getDate() + 2);
                  setOrderDate(getLocalDateString(dayAfter));
                }}
                className={`flex-1 rounded-xl py-2.5 border items-center shadow-xs ${
                  orderDate ===
                  (() => {
                    const dayAfter = new Date();
                    dayAfter.setDate(dayAfter.getDate() + 2);
                    return getLocalDateString(dayAfter);
                  })()
                    ? "bg-[#1B5E37]/10 border-[#1B5E37]"
                    : "bg-white border-gray-200/60"
                }`}
              >
                <Text
                  className={`text-[12px] font-black ${
                    orderDate ===
                    (() => {
                      const dayAfter = new Date();
                      dayAfter.setDate(dayAfter.getDate() + 2);
                      return getLocalDateString(dayAfter);
                    })()
                      ? "text-[#1B5E37]"
                      : "text-gray-600"
                  }`}
                >
                  Day After
                </Text>
              </TouchableOpacity>
            </View>

            {/* Morning Delivery Notice (Only for one-time products) */}
            {cartItems.some((item) => typeof item.id !== "string" || !item.id.startsWith("sub_")) && (
              <View 
                style={{ backgroundColor: "rgba(254, 243, 199, 0.4)", borderColor: "rgba(252, 211, 77, 0.4)" }} 
                className="mb-6 flex-row items-center gap-2.5 rounded-2xl border p-4"
              >
                <Ionicons name="time-outline" size={18} color="#D97706" />
                <Text className="text-[12px] font-bold text-amber-800 leading-normal flex-1">
                  Note: Delivery for one-time products is only available during morning hours (6:30 AM to 9:00 AM).
                </Text>
              </View>
            )}

            {/* Price Details Card */}
            <View className="rounded-2xl border border-gray-100 bg-[#FAF9F6] p-4 mb-4">
              <Text className="text-[12px] font-black text-gray-800 uppercase tracking-wider mb-3">
                Bill Summary
              </Text>
              <View className="flex-row justify-between mb-2">
                <Text className="text-[13px] font-medium text-gray-500">Item Total</Text>
                <Text className="text-[13px] font-bold text-gray-800">₹{totalAmount}</Text>
              </View>
              <View className="flex-row justify-between mb-3 border-b border-gray-200/40 pb-2">
                <Text className="text-[13px] font-medium text-gray-500">Delivery Charge</Text>
                <Text className="text-[13px] font-bold text-green-600">FREE</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-[14px] font-black text-gray-900">Total Amount</Text>
                <Text className="text-[18px] font-extrabold text-[#0C5A35]">₹{totalAmount}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Sticky Footer */}
          <View
            className="border-t border-gray-100 bg-white p-4 pb-6"
            style={{
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.03,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <View className="mb-3.5 flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Total Payable
                </Text>
                <Text className="text-[20px] font-black text-[#0C5A35]">
                  ₹{totalAmount}
                </Text>
              </View>
              <View className="flex-row items-center gap-1 bg-green-50 px-2.5 py-1 rounded-full">
                <Ionicons name="shield-checkmark" size={12} color="#0C5A35" />
                <Text className="text-[10px] font-black text-[#0C5A35]">Secure payment</Text>
              </View>
            </View>

            <TouchableOpacity
              disabled={true}
              className="w-full rounded-2xl bg-gray-200 py-4 items-center justify-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 1,
                elevation: 1,
              }}
            >
              <Text className="text-[15px] font-bold text-gray-400 uppercase tracking-wider">
                No Payment Gateway Added
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

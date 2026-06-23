import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { RefreshControl, View, Text, TouchableOpacity, Alert, ActivityIndicator, Image } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabPadding } from "@/hooks/useBottomTabPadding";
import { router, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/useCartStore";
import { productApi, Product } from "../api/productApi";
import { orderApi } from "../api/orderApi";
import { Calendar } from "react-native-calendars";
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { StatusBar } from "expo-status-bar";
import {
  HeaderSection,
  BannerCarousel,
  ProductCard,
} from "../components/CustomerHomeComponents";

import { BANNERS, CATEGORIES } from "@/data/mockData";

const getProductThumbnail = (name: string) => {
  const text = name.toLowerCase();
  if (text.includes("milk")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-21.png";
  if (text.includes("paneer")) return "https://penchfoods.com/wp-content/uploads/2020/11/Paneer.png";
  if (text.includes("ghee")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-22.png";
  return "https://images.unsplash.com/photo-1628105652613-2d5fc2f3a6cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80";
};

export function CustomerDashboardScreen() {
  const { user } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const insets = useSafeAreaInsets();
  const bottomTabPadding = useBottomTabPadding(26);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);


  // Bottom Sheet and Ordering states
  const cartSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["60%", "90%"], []);
  const [orderDate, setOrderDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribeBlur = navigation.addListener("blur", () => {
      cartSheetRef.current?.close();
    });
    const unsubscribeTabPress = navigation.addListener("tabPress" as any, () => {
      cartSheetRef.current?.close();
    });
    return () => {
      unsubscribeBlur();
      unsubscribeTabPress();
    };
  }, [navigation]);

  const domainName = useAuthStore((s) => s.domain_name) || "";

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setOrderDate(getLocalDateString(tomorrow));
  }, []);

  const isTodayEligible = () => {
    const todayStr = getLocalDateString(new Date());
    const todayOrder = orders.find(o => o.scheduled_delivery_date === todayStr);
    if (!todayOrder) return true;
    return todayOrder.status === "pending" || todayOrder.status === "confirmed";
  };

  const fetchProducts = async () => {
    if (!domainName) return;
    try {
      setLoading(true);
      const data = await productApi.getProducts(domainName);
      setProducts(data);
    } catch (error) {
      console.warn("Error fetching products:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
      fetchProducts();
      fetchOrders();
    }
  }, [domainName]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
    fetchOrders();
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
      useCartStore.getState().clearCart();
      cartSheetRef.current?.close();
      fetchOrders();
    } catch (e: any) {
      Alert.alert("Order Failed", e?.message || "Failed to create order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        enableTouchThrough={!isSheetOpen}
        pressBehavior="close"
      />
    ),
    [isSheetOpen]
  );

  const filteredProducts = products;

  return (
    <View className="flex-1 bg-[#FDFDFD]">
      <StatusBar style="dark" />
      <View>
        <HeaderSection locationName={user?.city_name || "Nagpur, Maharashtra"} />
      </View>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <BannerCarousel items={BANNERS} />

        <View className="px-4 mt-2 mb-4 flex-row items-end justify-between">
          <View>
            <Text className="text-[18px] font-bold text-gray-900">Fresh Today</Text>
            <Text className="text-[12px] text-gray-500 mt-0.5">Pure farm-fresh essentials</Text>
          </View>
          <Text className="text-[13px] font-bold text-[#0C5A35]">View all</Text>
        </View>

        <View className="px-4">
          <View className="flex-row flex-wrap justify-between">
            {filteredProducts.map((product) => {
              const cartItem = cartItems.find((i) => i.id === product.id);
              const cartQty = cartItem?.quantity || 0;

              return (
                <ProductCard
                  key={product.id}
                  item={product}
                  cartQty={cartQty}
                  onAdd={() =>
                    addToCart({
                      id: product.id,
                      name: product.name,
                      price: Number(product.unit_price || product.price || 0),
                      quantity: 1,
                    })
                  }
                  onRemove={() => removeFromCart(product.id)}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      {cartItems.length > 0 && !isSheetOpen && (
        <View 
          pointerEvents="box-none"
          className="absolute left-0 right-0 items-center z-50"
          style={{ bottom: bottomTabPadding }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              cartSheetRef.current?.snapToIndex(0);
            }}
            className="flex-row items-center rounded-full px-2 py-2 shadow-lg gap-2"
            style={{
              backgroundColor: "#178d2bff",
              // borderColor: "#1b802c",
              // borderWidth: 1,
              // shadowColor: "#0c5a10",
              // shadowOffset: { width: 0, height: 4 },
              // shadowOpacity: 0.25,
              // shadowRadius: 8,
              // elevation: 6,
            }}
          >
            {/* Left: Product Image Thumbnail */}
            <View className="h-10 w-10 rounded-full bg-white items-center justify-center overflow-hidden p-1">
               <Image
                  source={{ uri: getProductThumbnail(cartItems[0]?.name || "") }}
                  className="h-8 w-8"
                  resizeMode="cover"
               />
            </View>

            {/* Middle: Details */}
            <View className="mx-3.5 pr-2 items-start justify-center">
              <Text className="text-[13px] font-black text-white leading-none">View cart</Text>
              <Text className="text-[10px] font-bold text-white/80 mt-1 leading-none">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} {cartItems.reduce((acc, i) => acc + i.quantity, 0) === 1 ? "item" : "items"}
              </Text>
            </View>

            {/* Right: Chevron Circle */}
            <View className="h-10 w-10 rounded-full bg-white/20 items-center justify-center">
               <Ionicons name="chevron-forward" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      <BottomSheet
        ref={cartSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={(index) => {
          setIsSheetOpen(index !== -1);
        }}
        backdropComponent={isSheetOpen ? renderBackdrop : undefined}
        backgroundStyle={{
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 10,
        }}
        handleIndicatorStyle={{
          backgroundColor: "#E0E0E0",
          width: 60,
          height: 4,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mb-2 mt-2 flex-row items-center justify-between">
            <View>
              <Text className="text-[20px] font-extrabold text-gray-900">
                Your Cart
              </Text>
              <Text className="text-[12px] text-gray-500">
                Place a one-time order
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => cartSheetRef.current?.close()}
              className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Delivery Date */}
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
                className={`flex-1 rounded-lg py-2 border items-center ${orderDate === getLocalDateString(new Date())
                    ? "bg-[#1B5E37]/10 border-[#1B5E37]"
                    : "bg-gray-50 border-gray-200"
                  }`}
              >
                <Text className={`text-[12px] font-bold ${orderDate === getLocalDateString(new Date()) ? "text-[#1B5E37]" : "text-gray-700"
                  }`}>Today</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setOrderDate(getLocalDateString(tomorrow));
              }}
              className={`flex-1 rounded-lg py-2 border items-center ${orderDate === (() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return getLocalDateString(tomorrow);
                })()
                  ? "bg-[#1B5E37]/10 border-[#1B5E37]"
                  : "bg-gray-50 border-gray-200"
                }`}
            >
              <Text className={`text-[12px] font-bold ${orderDate === (() => {
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
              className={`flex-1 rounded-lg py-2 border items-center ${orderDate === (() => {
                  const dayAfter = new Date();
                  dayAfter.setDate(dayAfter.getDate() + 2);
                  return getLocalDateString(dayAfter);
                })()
                  ? "bg-[#1B5E37]/10 border-[#1B5E37]"
                  : "bg-gray-50 border-gray-200"
                }`}
            >
              <Text className={`text-[12px] font-bold ${orderDate === (() => {
                  const dayAfter = new Date();
                  dayAfter.setDate(dayAfter.getDate() + 2);
                  return getLocalDateString(dayAfter);
                })() ? "text-[#1B5E37]" : "text-gray-700"
                }`}>Day After</Text>
            </TouchableOpacity>
          </View>

          {/* Cart Products List */}
          <Text className="mb-3 text-[14px] font-black text-gray-900">
            Selected Products
          </Text>

          {cartItems.map((item) => {
            return (
              <View
                key={item.id}
                className="mb-4 flex-row items-center justify-between rounded-2xl bg-[#F8F9FA] p-4 border border-[#F0F0F0]"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-[15px] font-bold text-gray-900">
                    {item.name}
                  </Text>
                  <Text className="mt-1 text-[14px] font-black text-[#1B5E37]">
                    ₹{item.price}
                  </Text>
                </View>

                {/* Stepper */}
                <View className="flex-row items-center rounded-xl bg-white border border-gray-200 p-1">
                  <TouchableOpacity
                    onPress={() => removeFromCart(item.id)}
                    className="h-8 w-8 items-center justify-center rounded-lg bg-gray-50"
                  >
                    <Ionicons name="remove" size={16} color="#4B5563" />
                  </TouchableOpacity>
                  <Text className="w-10 text-center text-[15px] font-bold text-gray-900">
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
                    className="h-8 w-8 items-center justify-center rounded-lg bg-gray-50"
                  >
                    <Ionicons name="add" size={16} color="#4B5563" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* Total & Place Order Button */}
          <View className="mt-4 border-t border-gray-100 pt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[15px] font-bold text-gray-600">Total Amount</Text>
              <Text className="text-[20px] font-black text-[#1B5E37]">
                ₹{cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="w-full rounded-2xl bg-[#1B5E37] py-4 items-center justify-center shadow-md"
            >
              {isPlacingOrder ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-[16px] font-bold text-white">Confirm & Place Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
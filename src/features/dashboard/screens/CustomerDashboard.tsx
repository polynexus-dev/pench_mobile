import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { RefreshControl, View, Text, TouchableOpacity, Alert, ActivityIndicator, Image } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabPadding } from "@/hooks/useBottomTabPadding";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/useCartStore";
import { productApi, Product } from "../api/productApi";
import { StatusBar } from "expo-status-bar";
import {
  HeaderSection,
  BannerCarousel,
  ProductCard,
} from "../components/CustomerHomeComponents";

import { BANNERS, CATEGORIES } from "@/data/mockData";
import { LocationSelectBottomSheet } from "../../map/screens/LocationSelectBottomSheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { asyncStorage } from "../../../services/storage/asyncStorage";
import { httpClient } from "../../../services/api/httpClient";
import { buildUrl } from "../../../services/api/buildUrl";

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

  const locationSheetRef = useRef<BottomSheetModal>(null);
  const [hasCheckedLocation, setHasCheckedLocation] = useState(false);

  useEffect(() => {
    const checkLocation = async () => {
      try {
        const savedLoc = await asyncStorage.getItem("pench_customer_location");
        const isNotSet = !savedLoc || savedLoc === "null" || savedLoc === "undefined";
        if (isNotSet && !hasCheckedLocation) {
          setHasCheckedLocation(true);
          locationSheetRef.current?.present();
        }
      } catch (err) {
        console.warn("Error checking customer location:", err);
      }
    };
    if (user && !hasCheckedLocation) {
      checkLocation();
    }
  }, [user, hasCheckedLocation]);

  const handleLocationConfirm = async (loc: { lat: number; lng: number; address: string; profile: string }) => {
    try {
      await asyncStorage.setItem("pench_customer_location", JSON.stringify(loc));

      // Save to location profiles dictionary
      const savedStr = await asyncStorage.getItem("pench_customer_location_profiles");
      const currentProfiles = savedStr ? JSON.parse(savedStr) : {};
      currentProfiles[loc.profile] = { lat: loc.lat, lng: loc.lng, address: loc.address };
      await asyncStorage.setItem("pench_customer_location_profiles", JSON.stringify(currentProfiles));

      // Update ERP profile with city/address info
      const url = buildUrl(domainName, "/api/accounts/me/");
      const response = await httpClient.patch(url, {
        city_name: `${loc.profile}: ${loc.address.split(",")[0]?.trim() || "Nagpur"}`,
      });
      useAuthStore.getState().setUser(response as any);
    } catch (err) {
      console.warn("Failed to save location/patch profile:", err);
    } finally {
      locationSheetRef.current?.dismiss();
    }
  };

  const handleLocationSkip = () => {
    locationSheetRef.current?.dismiss();
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const domainName = useAuthStore((s) => s.domain_name) || "";

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

  useEffect(() => {
    if (domainName) {
      fetchProducts();
    }
  }, [domainName]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const filteredProducts = products;

  return (
    <View className="flex-1 bg-[#FDFDFD]">
      <StatusBar style="dark" />
      <View style={{ zIndex: 1 }}>
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

        {/* Flexible Subscription Model Section */}
        <View className="mx-4 mt-4 mb-2 p-5 rounded-2xl bg-[#F3F9F6] border border-[#0C5A35]/15 shadow-sm">
          <View className="flex-row items-center gap-2.5 mb-4">
            <View className="h-9 w-9 rounded-xl bg-[#0C5A35]/10 items-center justify-center">
              <Ionicons name="repeat-outline" size={18} color="#0C5A35" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-black text-gray-900 leading-none">
                Flexible Milk Subscriptions
              </Text>
              <Text className="text-[11px] font-semibold text-gray-500 mt-1.5 leading-none">
                Customized schedules, zero commitments
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between gap-3 mt-1">
            {/* Feature 1 */}
            <View className="flex-1 items-start">
              <View className="h-7 w-7 rounded-lg bg-white shadow-sm items-center justify-center mb-2">
                <Ionicons name="calendar-outline" size={14} color="#0C5A35" />
              </View>
              <Text className="text-[11px] font-black text-gray-800 leading-none">Custom Plans</Text>
              <Text className="text-[9px] font-semibold text-gray-500 mt-1.5 leading-normal">Daily or alternate deliveries</Text>
            </View>

            {/* Feature 2 */}
            <View className="flex-1 items-start">
              <View className="h-7 w-7 rounded-lg bg-white shadow-sm items-center justify-center mb-2">
                <Ionicons name="pause-circle-outline" size={14} color="#0C5A35" />
              </View>
              <Text className="text-[11px] font-black text-gray-800 leading-none">Pause / Resume</Text>
              <Text className="text-[9px] font-semibold text-gray-500 mt-1.5 leading-normal">Going out? Stop delivery instantly</Text>
            </View>

            {/* Feature 3 */}
            <View className="flex-1 items-start">
              <View className="h-7 w-7 rounded-lg bg-white shadow-sm items-center justify-center mb-2">
                <Ionicons name="notifications-off-outline" size={14} color="#0C5A35" />
              </View>
              <Text className="text-[11px] font-black text-gray-800 leading-none">No Ring Delivery</Text>
              <Text className="text-[9px] font-semibold text-gray-500 mt-1.5 leading-normal">Silent morning doorstep drop</Text>
            </View>
          </View>

          {/* Action button to navigate to Subscription Page */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(customer)/(tabs)/subscriptions" as any)}
            className="mt-4 bg-[#0C5A35] flex-row items-center justify-center py-2.5 rounded-xl active:opacity-90"
          >
            <Text className="text-[12px] font-black text-white uppercase tracking-wider">
              Subscribe Now
            </Text>
            <Ionicons name="arrow-forward-outline" size={14} color="#ffffff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        <View className="px-4 mt-4 mb-4 flex-row items-end justify-between">
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

      {cartItems.length > 0 && (
        <View 
          pointerEvents="box-none"
          className="absolute left-0 right-0 items-center z-50"
          style={{ bottom: bottomTabPadding }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              router.push("/(customer)/cart");
            }}
            className="flex-row items-center rounded-full px-2 py-2 shadow-lg gap-1"
            style={{
              backgroundColor: "#178d2bff",
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

      {/* Location Select Bottom Sheet */}
      <LocationSelectBottomSheet
        ref={locationSheetRef}
        onClose={handleLocationSkip}
        onConfirm={handleLocationConfirm}
        onSkip={handleLocationSkip}
      />
    </View>
  );
}
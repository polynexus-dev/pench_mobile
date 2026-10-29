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
import { ProductDetailBottomSheet } from "../components/ProductDetailBottomSheet";

import { BANNERS, CATEGORIES } from "@/data/mockData";
import { LocationSelectBottomSheet } from "../../map/screens/LocationSelectBottomSheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { asyncStorage } from "../../../services/storage/asyncStorage";
import { httpClient } from "../../../services/api/httpClient";
import { buildUrl } from "../../../services/api/buildUrl";
import { useRequireAuth } from "@/features/auth/hooks/useRequireAuth";
import { guestCityFromSchema } from "@/constants/guestTenants";
import { locationApi } from "@/services/api/locationApi";

const getProductThumbnail = (name: string) => {
  const text = name.toLowerCase();
  if (text.includes("milk")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-21.png";
  if (text.includes("paneer")) return "https://penchfoods.com/wp-content/uploads/2020/11/Paneer.png";
  if (text.includes("ghee")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-22.png";
  return "https://images.unsplash.com/photo-1628105652613-2d5fc2f3a6cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80";
};

export function CustomerDashboardScreen() {
  const { user } = useAuthStore();
  const isGuest = useAuthStore((s) => s.isGuest);
  const guestCity = useAuthStore((s) => s.guestCity);
  const { requireAuth } = useRequireAuth();
  const cartItems = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const insets = useSafeAreaInsets();
  const bottomTabPadding = useBottomTabPadding(26);

  const domainName = useAuthStore((s) => s.domain_name) || "";

  const locationSheetRef = useRef<BottomSheetModal>(null);
  const productSheetRef = useRef<BottomSheetModal>(null);
  const [hasCheckedLocation, setHasCheckedLocation] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleProductPress = useCallback((product: Product) => {
    setSelectedProduct(product);
    productSheetRef.current?.present();
  }, []);

  useEffect(() => {
    const checkLocation = async () => {
      try {
        // 1. Check if backend already has saved locations for this user
        if (domainName) {
          try {
            const locs = await locationApi.getLocations(domainName);
            if (locs && locs.length > 0) {
              const defaultLoc = locs.find((l) => l.is_default) || locs[0];
              const tag = defaultLoc.tag ? defaultLoc.tag.charAt(0).toUpperCase() + defaultLoc.tag.slice(1) : "Home";
              const lat = typeof defaultLoc.latitude === "string" ? parseFloat(defaultLoc.latitude) : defaultLoc.latitude;
              const lng = typeof defaultLoc.longitude === "string" ? parseFloat(defaultLoc.longitude) : defaultLoc.longitude;
              const safeLat = isNaN(lat) ? 21.1458 : lat;
              const safeLng = isNaN(lng) ? 79.0882 : lng;

              await asyncStorage.setItem(
                "pench_customer_location",
                JSON.stringify({
                  id: defaultLoc.id,
                  lat: safeLat,
                  lng: safeLng,
                  address: defaultLoc.address,
                  landmark: defaultLoc.landmark,
                  profile: tag,
                })
              );

              if (!user?.city_name || user.city_name === "Nagpur, Maharashtra") {
                useAuthStore.getState().setUser({
                  ...user!,
                  city_name: `${tag}: ${defaultLoc.address.split(",")[0]?.trim() || "Nagpur"}`,
                });
              }
              return;
            }
          } catch (err) {
            console.warn("Location API check in dashboard failed:", err);
          }
        }

        // 2. Fall back to local storage
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
  }, [user, hasCheckedLocation, domainName]);

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

  const handleLocationSkip = useCallback(() => {
    // Sheet dismissed, no-op
  }, []);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      <View style={{ zIndex: 10 }}>
        <HeaderSection
          locationName={
            isGuest
              ? guestCityFromSchema(guestCity)?.label ?? "Select your city"
              : user?.city_name || "Nagpur, Maharashtra"
          }
          onLocationPress={() => {
            locationSheetRef.current?.present();
          }}
        />
      </View>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Guest strip — browsing is open, ordering needs an account */}
        {isGuest && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(auth)/login" as any)}
            className="mx-4 mt-3 flex-row items-center rounded-2xl border border-[#0C5A35]/15 bg-[#F3F9F6] px-4 py-3"
          >
            <View className="h-8 w-8 items-center justify-center rounded-full bg-[#0C5A35]/10">
              <Ionicons name="person-outline" size={16} color="#0C5A35" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[12px] font-black leading-none text-gray-900">
                You&apos;re browsing as a guest
              </Text>
              <Text className="mt-1.5 text-[10px] font-semibold leading-none text-gray-500">
                Sign in to order, subscribe and use Pench Money
              </Text>
            </View>
            <Text className="text-[11px] font-black uppercase tracking-wider text-[#0C5A35]">
              Sign In
            </Text>
          </TouchableOpacity>
        )}

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
            onPress={() => {
              if (!requireAuth({ action: "start a subscription" })) return;
              router.push("/(customer)/(tabs)/subscriptions" as any);
            }}
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
                  onPress={() => handleProductPress(product)}
                  onAdd={() => {
                    if (!requireAuth({ action: "add items to your cart" })) return;
                    addToCart({
                      id: product.id,
                      name: product.name,
                      price: Number(product.unit_price || product.price || 0),
                      quantity: 1,
                    });
                  }}
                  onRemove={() => removeFromCart(product.id)}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>



      {/* Location Select Bottom Sheet */}
      <LocationSelectBottomSheet
        ref={locationSheetRef}
        onClose={handleLocationSkip}
        onConfirm={handleLocationConfirm}
        onSkip={handleLocationSkip}
      />

      {/* Product Detail Bottom Sheet Modal */}
      <ProductDetailBottomSheet
        ref={productSheetRef}
        product={selectedProduct}
      />
    </View>
  );
}
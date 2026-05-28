import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/useCartStore";
import { productApi, Product } from "../api/productApi";
import {
  HeaderSection,
  BannerCarousel,
  CategoryBar,
  ProductCard,
} from "../components/CustomerHomeComponents";

import { BANNERS, CATEGORIES } from "@/data/mockData";

export function CustomerDashboardScreen() {
  const { user } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const insets = useSafeAreaInsets();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

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
    fetchProducts();
  }, [domainName]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter(
          (p) => p.category?.toLowerCase().includes(selectedCategory.toLowerCase())
        );

  return (
    <View className="flex-1 bg-[#FDFDFD]">
      <StatusBar style="dark" />
      <View style={{ paddingTop: insets.top }}>
        <HeaderSection locationName={user?.city_name || "Nagpur, Maharashtra"} />
      </View>
      <CategoryBar
        categories={CATEGORIES}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <ScrollView
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

      {cartItems.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            router.push({
              pathname: "/(customer)/(tabs)/orders",
              params: { openModal: "true" },
            });
          }}
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-[#1B5E37] shadow-lg z-50"
          style={{
            shadowColor: "#1B5E37",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 6,
          }}
        >
          <Ionicons name="cart" size={26} color="white" />
          <View
            className="absolute -top-1.5 -right-1.5 h-6 w-6 items-center justify-center rounded-full bg-red-500 border border-white"
            style={{ elevation: 2 }}
          >
            <Text className="text-[10px] font-black text-white">
              {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

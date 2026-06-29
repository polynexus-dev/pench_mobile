import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Animated, Dimensions, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useCartStore } from "@/store/useCartStore";
import { productApi, Product } from "@/features/dashboard/api/productApi";
import { useAuthStore } from "@/store/authStore";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

const getProductThumbnail = (name: string) => {
  const text = name.toLowerCase();
  if (text.includes("milk")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-21.png";
  if (text.includes("paneer")) return "https://penchfoods.com/wp-content/uploads/2020/11/Paneer.png";
  if (text.includes("ghee")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-22.png";
  return "https://images.unsplash.com/photo-1628105652613-2d5fc2f3a6cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80";
};

export default function ProductDetailModal() {
  const { id, productJson } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const cartItems = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.addToCart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const domainName = useAuthStore((s) => s.domain_name) || "";

  useEffect(() => {
    if (productJson) {
      try {
        setProduct(JSON.parse(productJson as string));
        setLoading(false);
      } catch (e) {
        console.warn("Failed to parse productJson:", e);
      }
    } else if (id && domainName) {
      const fetchFallback = async () => {
        try {
          const data = await productApi.getProducts(domainName);
          const found = data.find((p) => String(p.id) === String(id));
          if (found) {
            setProduct(found);
          }
        } catch (error) {
          console.warn("Failed to fetch product details:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchFallback();
    } else if (id) {
      // If domainName is not ready yet, keep loading
      setLoading(true);
    }
  }, [id, productJson, domainName]);

  const pulse = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FDFDFD]">
        <ActivityIndicator size="large" color="#0C5A35" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FDFDFD] p-4">
        <Text className="text-gray-500 font-bold text-lg text-center">Product not found</Text>
        <TouchableOpacity 
          className="mt-4 px-6 py-2.5 bg-[#0C5A35] rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const price = Number(product.unit_price || product.price || 0);
  const mrp = Number(product.mrp || (price > 0 ? Math.round(price * 1.15) : 0));
  const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const productImageUrl = getProductThumbnail(product.name || "");
  const cartItem = cartItems.find((item) => String(item.id) === String(product.id));
  const cartQty = cartItem?.quantity || 0;

  const defaultDescription = "Sourced directly from local dairy farms. Our products undergo minimal processing to retain their natural flavor, freshness, and rich nutrients. Delivered fresh to your doorstep every morning under temperature-controlled conditions to ensure the highest standards of hygiene and quality.";

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Product Image Section */}
        <View className="relative w-full h-[320px] bg-[#FAF9F5]">
          <Image
            source={{ uri: productImageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
          
          {/* Back/Close button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={{ marginTop: insets.top || 16 }}
            className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md border border-gray-100"
          >
            <Ionicons name="chevron-back" size={22} color="#1F2937" />
          </TouchableOpacity>

          {/* Favorite button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsFavorite(!isFavorite)}
            style={{ marginTop: insets.top || 16 }}
            className="absolute right-4 h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md border border-gray-100"
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isFavorite ? "#E11D48" : "#757575"}
            />
          </TouchableOpacity>
        </View>

        {/* Content Card overlapping the image slightly */}
        <View className="mt-[-24px] rounded-t-[32px] bg-white p-6 border-t border-gray-100/50 shadow-xs">
          {/* Category & Unit */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-[10px] font-bold text-[#0C5A35] uppercase tracking-widest">
              {product.category || "DAIRY"}
            </Text>
            <Text className="text-[12px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
              {product.unit || "500 ml"}
            </Text>
          </View>

          {/* Product Name */}
          <Text className="text-[22px] font-black text-gray-900 leading-tight mb-3">
            {product.name}
          </Text>

          {/* Badges Row */}
          <View className="flex-row flex-wrap gap-2 mb-6">
            {product.is_returnable && (
              <View className="flex-row items-center rounded-full bg-[#EAF5EF] px-3 py-1 border border-[#0C5A35]/15">
                <Ionicons name="leaf" size={12} color="#0C5A35" />
                <Text className="ml-1 text-[10px] font-black text-[#0C5A35] uppercase tracking-wider">Glass Bottle Returnable</Text>
              </View>
            )}
            <View className="flex-row items-center rounded-full bg-[#FFF9E6] px-3 py-1 border border-[#F59E0B]/15">
              <Ionicons name="ribbon-outline" size={12} color="#F59E0B" />
              <Text className="ml-1 text-[10px] font-black text-[#F59E0B] uppercase tracking-wider">Farm Fresh</Text>
            </View>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-gray-100 w-full mb-6" />

          {/* Price Section */}
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-[12px] font-bold text-gray-400 mb-0.5">Price per unit</Text>
              <View className="flex-row items-baseline">
                <Text className="text-3xl font-black text-gray-900">₹ {price}</Text>
                {discountPercent > 0 && (
                  <>
                    <Text className="text-sm font-bold text-gray-400 line-through ml-2.5">
                      ₹ {mrp}
                    </Text>
                    <View className="ml-2.5 bg-[#EF4444]/10 rounded-md px-1.5 py-0.5">
                      <Text className="text-[10px] font-black text-[#EF4444]">
                        {discountPercent}% OFF
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Description Section */}
          <View className="mb-6">
            <Text className="text-[13px] font-black text-gray-900 uppercase tracking-widest mb-2.5">
              Product Description
            </Text>
            <Text className="text-[14px] leading-6 text-gray-600 font-medium">
              {product.description || defaultDescription}
            </Text>
          </View>

          {/* Info cards (Eco friendly, Morning delivery, cold chain) */}
          <View className="flex-row gap-3 mt-2">
            <View className="flex-1 bg-[#F9FBF9] border border-gray-100 rounded-xl p-3 items-center">
              <Ionicons name="time-outline" size={20} color="#0C5A35" />
              <Text className="text-[10px] font-bold text-gray-800 mt-1.5 text-center">Before 7 AM</Text>
              <Text className="text-[8px] text-gray-400 mt-0.5 text-center">Morning Delivery</Text>
            </View>
            <View className="flex-1 bg-[#F9FBF9] border border-gray-100 rounded-xl p-3 items-center">
              <Ionicons name="thermometer-outline" size={20} color="#0C5A35" />
              <Text className="text-[10px] font-bold text-gray-800 mt-1.5 text-center">Cold Chain</Text>
              <Text className="text-[8px] text-gray-400 mt-0.5 text-center">Maintained at 4°C</Text>
            </View>
            <View className="flex-1 bg-[#F9FBF9] border border-gray-100 rounded-xl p-3 items-center">
              <Ionicons name="shield-checkmark-outline" size={20} color="#0C5A35" />
              <Text className="text-[10px] font-bold text-gray-800 mt-1.5 text-center">Quality Assured</Text>
              <Text className="text-[8px] text-gray-400 mt-0.5 text-center">Strict Lab Tests</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 16), paddingTop: 16 }}
        className="px-6 border-t border-gray-100 bg-white shadow-lg absolute bottom-0 left-0 right-0"
      >
        {cartQty === 0 ? (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                pulse();
                addToCart({
                  id: product.id,
                  name: product.name,
                  price: price,
                  quantity: 1,
                });
              }}
              className="w-full bg-[#0C5A35] flex-row items-center justify-center py-4 rounded-2xl shadow-md active:opacity-95"
            >
              <Ionicons name="cart-outline" size={20} color="white" />
              <Text className="text-[14px] font-black text-white ml-2.5 uppercase tracking-wider">
                Add to Cart
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View className="flex-row items-center justify-between gap-3">
            {/* Quantity Selector */}
            <View className="flex-row items-center bg-[#F3F9F6] border border-[#0C5A35]/15 rounded-2xl flex-1 justify-between py-1.5 px-3">
              <TouchableOpacity
                onPress={() => removeFromCart(product.id)}
                className="h-10 w-10 bg-white items-center justify-center rounded-xl border border-gray-100 shadow-sm active:bg-gray-50"
              >
                <Ionicons name="remove" size={18} color="#0C5A35" />
              </TouchableOpacity>
              <Text className="text-[16px] font-black text-gray-900 px-4">
                {cartQty} in Cart
              </Text>
              <TouchableOpacity
                onPress={() => {
                  pulse();
                  addToCart({
                    id: product.id,
                    name: product.name,
                    price: price,
                    quantity: 1,
                  });
                }}
                className="h-10 w-10 bg-white items-center justify-center rounded-xl border border-gray-100 shadow-sm active:bg-gray-50"
              >
                <Ionicons name="add" size={18} color="#0C5A35" />
              </TouchableOpacity>
            </View>

            {/* Go to Cart button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                router.push("/(customer)/cart");
              }}
              className="bg-[#0C5A35] px-6 py-4 rounded-2xl flex-row items-center justify-center shadow-md active:opacity-95"
            >
              <Text className="text-[13px] font-black text-white uppercase tracking-wider mr-1">
                Checkout
              </Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

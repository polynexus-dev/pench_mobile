import React, { useMemo, forwardRef, useState } from "react";
import { View, Text, Image, TouchableOpacity, Animated, ActivityIndicator, Alert } from "react-native";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCartStore } from "@/store/useCartStore";
import { Product } from "@/features/dashboard/api/productApi";
import { useRouter } from "expo-router";

type Props = {
  product: Product | null;
  hasActiveSubscription: boolean | null;
};

const getProductThumbnail = (name: string) => {
  const text = name.toLowerCase();
  if (text.includes("milk")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-21.png";
  if (text.includes("paneer")) return "https://penchfoods.com/wp-content/uploads/2020/11/Paneer.png";
  if (text.includes("ghee")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-22.png";
  return "https://images.unsplash.com/photo-1628105652613-2d5fc2f3a6cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80";
};

export const ProductDetailBottomSheet = forwardRef<BottomSheetModal, Props>(
  function ProductDetailBottomSheet({ product, hasActiveSubscription }, ref) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    
    const cartItems = useCartStore((s) => s.items);
    const addToCart = useCartStore((s) => s.addToCart);
    const removeFromCart = useCartStore((s) => s.removeFromCart);
    
    const [isFavorite, setIsFavorite] = useState(false);
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    // Use snap points that allow opening at 60% and dragging/scrolling to full-screen (100%)
    const snapPoints = useMemo(() => ["60%", "100%"], []);

    if (!product) return null;

    const price = Number(product.unit_price || product.price || 0);
    const mrp = Number(product.mrp || (price > 0 ? Math.round(price * 1.15) : 0));
    const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    const productImageUrl = getProductThumbnail(product.name || "");
    const cartItem = cartItems.find((item) => String(item.id) === String(product.id));
    const cartQty = cartItem?.quantity || 0;

    const defaultDescription = "Sourced directly from local dairy farms. Our products undergo minimal processing to retain their natural flavor, freshness, and rich nutrients. Delivered fresh to your doorstep every morning under temperature-controlled conditions to ensure the highest standards of hygiene and quality.";

    const pulse = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    };

    const handleClose = () => {
      if (ref && "current" in ref && ref.current) {
        ref.current.dismiss();
      }
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: "#FFFFFF", borderRadius: 32 }}
        handleComponent={null}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <View className="flex-1 bg-white relative rounded-t-[32px] overflow-hidden pt-8">
          
          <BottomSheetScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ paddingBottom: 120 }}
            className="rounded-t-[32px] overflow-hidden"
          >
            {/* Image Header */}
            <View className="relative w-full h-[260px] bg-[#FAF9F5] overflow-hidden">
              <Image
                source={{ uri: productImageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
              
              {/* Floating Favorite icon over image */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsFavorite(!isFavorite)}
                className="absolute right-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm border border-gray-100"
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={20}
                  color={isFavorite ? "#E11D48" : "#757575"}
                />
              </TouchableOpacity>
            </View>

            {/* Product Meta details */}
            <View className="p-6">
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

              {/* Price Details */}
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

              {/* Quality / Delivery features grid */}
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
          </BottomSheetScrollView>

          {/* Sticky Bottom Action Bar inside sheet */}
          <View
            style={{ paddingBottom: Math.max(insets.bottom, 16), paddingTop: 16 }}
            className="px-6 border-t border-gray-100 bg-white shadow-lg absolute bottom-0 left-0 right-0"
          >
            {cartQty === 0 ? (
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    if (hasActiveSubscription === false) {
                      Alert.alert(
                        "Subscription Required",
                        "You must have an active subscription plan to add products to your cart.",
                        [
                          { text: "Cancel", style: "cancel" },
                          { text: "Subscribe Now", onPress: () => {
                              handleClose();
                              router.push("/(customer)/(tabs)/subscriptions" as any);
                            }
                          }
                        ]
                      );
                      return;
                    }
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
                      if (hasActiveSubscription === false) {
                        Alert.alert(
                          "Subscription Required",
                          "You must have an active subscription plan to add products to your cart.",
                          [
                            { text: "Cancel", style: "cancel" },
                            { text: "Subscribe Now", onPress: () => {
                                handleClose();
                                router.push("/(customer)/(tabs)/subscriptions" as any);
                              }
                            }
                          ]
                        );
                        return;
                      }
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
                    handleClose();
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
      </BottomSheetModal>
    );
  }
);
export default ProductDetailBottomSheet;

import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Clipboard from "expo-clipboard";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/useCartStore";
import { orderApi } from "@/features/dashboard/api/orderApi";
import { productApi } from "@/features/dashboard/api/productApi";

const UPI_ID = "paytmqr5fwdg5@ptys";
const PAYEE_NAME = "PENCH MILK AND PRODUCTS";
const MERCHANT_NUMBER = "9665008869";

interface PaymentScreenProps {
  onBack?: () => void;
  orderDate?: string;
  totalAmount?: number;
}

export function PaymentScreen({
  onBack,
  orderDate: propOrderDate,
  totalAmount: propTotalAmount,
}: PaymentScreenProps = {}) {
  const params = useLocalSearchParams<{ orderDate?: string; totalAmount?: string }>();
  const domainName = useAuthStore((s) => s.domain_name) || "";
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [copied, setCopied] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Fallback calculation if not passed via props or params
  const calculatedTotal = cartItems.reduce((sum, item) => {
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

  const totalAmount =
    propTotalAmount !== undefined
      ? propTotalAmount
      : params.totalAmount
      ? Number(params.totalAmount)
      : calculatedTotal;

  const deliveryDate = propOrderDate || params.orderDate || "";

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleCopyUpiId = async () => {
    try {
      await Clipboard.setStringAsync(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      Alert.alert("UPI ID", UPI_ID);
    }
  };

  const handleOpenUpiApp = async () => {
    const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(
      PAYEE_NAME
    )}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent("Pench Milk Order")}`;

    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
        await Linking.openURL(upiUrl);
      } else {
        Alert.alert(
          "UPI App",
          `Please scan the QR code above or pay to UPI ID: ${UPI_ID} using Paytm, PhonePe, Google Pay, or BHIM.`
        );
      }
    } catch {
      Alert.alert(
        "UPI Payment",
        `Please scan the QR code above or pay manually using UPI ID: ${UPI_ID}`
      );
    }
  };

  const handleConfirmOrder = async () => {
    let finalDeliveryDate = deliveryDate ? deliveryDate.trim() : "";
    if (!finalDeliveryDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const day = String(tomorrow.getDate()).padStart(2, "0");
      finalDeliveryDate = `${year}-${month}-${day}`;
    }

    setIsPlacingOrder(true);
    try {
      let availableProducts: any[] = [];
      try {
        availableProducts = await productApi.getProducts(domainName);
      } catch {
        // ignore product fetch failure
      }

      const items = cartItems.map((item) => {
        let productId = item.id;
        if (typeof productId === "string" && productId.startsWith("sub_")) {
          const match = productId.match(/^sub_([^_]+)/);
          if (match && match[1]) {
            productId = match[1];
          }
        }

        // If productId is not a number, find matching product in available products
        if (isNaN(Number(productId)) && availableProducts.length > 0) {
          const matched = availableProducts.find(
            (p) =>
              String(p.id) === String(productId) ||
              p.name?.toLowerCase().includes(String(productId).toLowerCase()) ||
              item.name?.toLowerCase().includes(p.name?.toLowerCase()) ||
              p.sku?.toLowerCase() === String(productId).toLowerCase()
          );
          if (matched) {
            productId = matched.id;
          } else {
            productId = availableProducts[0].id;
          }
        }

        return {
          product: !isNaN(Number(productId)) ? Number(productId) : productId,
          quantity: Number(item.quantity) || 1,
        };
      });

      if (items.length === 0) {
        Alert.alert("Empty Selection", "Your cart is empty. Please select products first.");
        handleBack();
        return;
      }

      await orderApi.createOrder(domainName, {
        scheduled_delivery_date: finalDeliveryDate,
        items,
      });

      Alert.alert(
        "Order Confirmed!",
        `Your order of ₹${totalAmount} has been placed successfully for delivery on ${new Date(
          finalDeliveryDate
        ).toDateString()}!`,
        [
          {
            text: "View Orders",
            onPress: () => {
              clearCart();
              router.replace("/(customer)/(tabs)/orders");
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert("Order Failed", e?.message || "Failed to create order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]" edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center border-b border-gray-100 bg-white px-4 py-3.5 shadow-xs">
        <TouchableOpacity onPress={handleBack} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-[18px] font-black text-gray-900">UPI Payment</Text>
          <Text className="text-[11px] font-bold text-gray-500">Scan & Pay to place order</Text>
        </View>
        <View className="flex-row items-center gap-1 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
          <Ionicons name="shield-checkmark" size={13} color="#0C5A35" />
          <Text className="text-[10px] font-black text-[#0C5A35]">100% Secure</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Payable Amount Banner */}
        <View
          className="rounded-2xl bg-white p-4 mb-4 border border-gray-100/80"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                Total Amount Payable
              </Text>
              <Text className="text-[26px] font-black text-[#0C5A35] mt-0.5">
                ₹{totalAmount}
              </Text>
            </View>
            {deliveryDate ? (
              <View className="items-end bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/50">
                <Text className="text-[10px] font-semibold text-gray-400 uppercase">
                  Delivery Date
                </Text>
                <Text className="text-[12px] font-bold text-gray-800 mt-0.5">
                  {new Date(deliveryDate).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* QR Code Poster Card */}
        <View
          className="rounded-3xl bg-white p-4 mb-4 border border-gray-100/90 items-center overflow-hidden"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <View className="w-full flex-row items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-green-500" />
              <Text className="text-[13px] font-black text-gray-900">
                Scan QR Code to Pay
              </Text>
            </View>
            <Text className="text-[11px] font-semibold text-gray-400">
              Any UPI App
            </Text>
          </View>

          {/* QR Code Image */}
          <View className="rounded-2xl overflow-hidden border border-gray-200/70 bg-white p-1">
            <Image
              source={require("../../../../assets/images/paytm_qr.png")}
              style={{ width: 280, height: 440 }}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* UPI ID Details Card */}
        <View
          className="rounded-2xl bg-white p-4 mb-4 border border-gray-100"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.03,
            shadowRadius: 6,
            elevation: 1.5,
          }}
        >
          <Text className="text-[12px] font-black text-gray-800 uppercase tracking-wider mb-2.5">
            Merchant UPI ID
          </Text>

          <View className="flex-row items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200/60 mb-3">
            <View className="flex-1 mr-2">
              <Text className="text-[10px] font-bold text-gray-400 uppercase">UPI ID</Text>
              <Text className="text-[14px] font-black text-gray-900 mt-0.5" selectable>
                {UPI_ID}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleCopyUpiId}
              activeOpacity={0.7}
              className={`flex-row items-center gap-1.5 px-3 py-2 rounded-lg border ${
                copied
                  ? "bg-green-600 border-green-600"
                  : "bg-[#0C5A35] border-[#0C5A35]"
              }`}
            >
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={14}
                color="#FFFFFF"
              />
              <Text className="text-[12px] font-black text-white">
                {copied ? "Copied!" : "Copy"}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between pt-1 border-t border-gray-100">
            <View>
              <Text className="text-[10px] font-bold text-gray-400">Payee Name</Text>
              <Text className="text-[12px] font-extrabold text-gray-800">{PAYEE_NAME}</Text>
            </View>
            <View className="items-end">
              <Text className="text-[10px] font-bold text-gray-400">Merchant Mobile</Text>
              <Text className="text-[12px] font-extrabold text-gray-800">{MERCHANT_NUMBER}</Text>
            </View>
          </View>
        </View>

        {/* Quick App Intent Button */}
        <TouchableOpacity
          onPress={handleOpenUpiApp}
          activeOpacity={0.8}
          className="mb-4 flex-row items-center justify-center gap-2 rounded-2xl bg-[#002E6E] py-3.5 px-4 shadow-sm active:opacity-90"
        >
          <Ionicons name="phone-portrait-outline" size={18} color="#FFFFFF" />
          <Text className="text-[14px] font-black text-white uppercase tracking-wider">
            Open UPI App to Pay ₹{totalAmount}
          </Text>
        </TouchableOpacity>

        {/* Step Guide */}
        <View className="rounded-2xl bg-amber-50/50 p-4 border border-amber-200/50 mb-6">
          <Text className="text-[12px] font-black text-amber-900 uppercase tracking-wider mb-2">
            How to Complete Order:
          </Text>
          <Text className="text-[12px] text-amber-800 leading-5">
            1. Scan the QR code or copy UPI ID ({UPI_ID}) in your UPI app.
          </Text>
          <Text className="text-[12px] text-amber-800 leading-5">
            2. Complete the payment of ₹{totalAmount}.
          </Text>
          <Text className="text-[12px] text-amber-800 leading-5">
            3. Tap the "Confirm & Place Order" button below.
          </Text>
        </View>

        {/* Confirm Order Button */}
        <TouchableOpacity
          onPress={handleConfirmOrder}
          disabled={isPlacingOrder}
          activeOpacity={0.85}
          className="w-full rounded-2xl bg-[#0C5A35] py-4 items-center justify-center shadow-md active:opacity-90"
          style={{
            shadowColor: "#0C5A35",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {isPlacingOrder ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text className="text-[15px] font-black text-white uppercase tracking-wider">
                Placing Order...
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text className="text-[15px] font-black text-white uppercase tracking-wider">
                I Have Paid • Confirm Order
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

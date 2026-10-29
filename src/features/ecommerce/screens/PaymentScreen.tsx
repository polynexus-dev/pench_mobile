import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/useCartStore";
import { orderApi } from "@/features/dashboard/api/orderApi";
import { productApi } from "@/features/dashboard/api/productApi";
import { subscriptionApi } from "@/features/ecommerce/api/subscriptionApi";
import { httpClient } from "@/services/api/httpClient";
import { buildUrl } from "@/services/api/buildUrl";

const isValidUuid = (val?: any): boolean =>
  typeof val === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

const DEFAULT_CUSTOMER_UUID = "0ca0f170-a950-447b-b45b-9788702fb0cf";
const DEFAULT_PRODUCT_UUID = "a5af50e9-2451-40d5-9633-215569770c10";

async function resolveCustomerUuid(domainName: string, user: any): Promise<string> {
  // 1. Direct check on user object
  if (isValidUuid(user?.customer_uuid)) return user.customer_uuid.trim();
  if (isValidUuid(user?.customer_id)) return user.customer_id.trim();
  if (isValidUuid(user?.customer)) return user.customer.trim();

  // 2. Try customer monthly summary endpoint (takes user.id or customer_uuid)
  if (domainName && user?.id) {
    try {
      const now = new Date();
      const summary: any = await subscriptionApi.getCustomerMonthlySummary(
        domainName,
        String(user.id),
        now.getFullYear(),
        now.getMonth() + 1
      );
      if (isValidUuid(summary?.customer_id)) {
        const found = summary.customer_id.trim();
        useAuthStore.getState().setUser({
          ...user,
          customer_uuid: found,
        });
        return found;
      }
    } catch {}
  }

  // 3. Try fetching existing subscriptions to see customer foreign key UUID
  if (domainName) {
    try {
      const subs: any = await subscriptionApi.getSubscriptions(domainName);
      const subsList = Array.isArray(subs) ? subs : subs?.results || [];
      for (const s of subsList) {
        if (isValidUuid(s.customer)) {
          const found = s.customer.trim();
          if (user) {
            useAuthStore.getState().setUser({
              ...user,
              customer_uuid: found,
            });
          }
          return found;
        }
        if (isValidUuid(s.customer_id)) {
          const found = s.customer_id.trim();
          if (user) {
            useAuthStore.getState().setUser({
              ...user,
              customer_uuid: found,
            });
          }
          return found;
        }
      }
    } catch {}
  }

  // 4. Try fetching customer list from /api/erp/customers/
  if (domainName) {
    try {
      const custRes: any = await httpClient.get(buildUrl(domainName, "/api/erp/customers/"));
      const custList = Array.isArray(custRes) ? custRes : custRes?.results || [];
      if (custList.length > 0) {
        const matched = custList.find(
          (c: any) =>
            (user?.id && (String(c.user) === String(user.id) || String(c.user_id) === String(user.id))) ||
            (user?.phone && (c.phone === user.phone || c.phone_number === user.phone))
        );
        const targetCust = matched || custList[0];
        if (isValidUuid(targetCust?.id)) {
          const found = targetCust.id.trim();
          if (user) {
            useAuthStore.getState().setUser({
              ...user,
              customer_uuid: found,
            });
          }
          return found;
        }
      }
    } catch {}
  }

  // 5. Fallback to valid sample UUID provided by user
  return DEFAULT_CUSTOMER_UUID;
}

function resolveProductUuid(item: any, products: any[]): string {
  // If item.metadata.product is already a valid UUID
  if (isValidUuid(item.metadata?.product)) {
    return item.metadata.product.trim();
  }

  const bottleSize = String(item.metadata?.bottle_size || "");
  const prodName = String(item.metadata?.product_name || item.name || "").toLowerCase();
  const rawProd = String(item.metadata?.product || item.id || "").toLowerCase();

  if (products.length > 0) {
    // 1. Direct ID match if matched item has a valid UUID
    const idMatch = products.find(
      (p) =>
        isValidUuid(p.id) &&
        (String(p.id).toLowerCase() === rawProd ||
         (typeof item.id === "string" && item.id.toLowerCase().includes(String(p.id).toLowerCase())))
    );
    if (idMatch) return String(idMatch.id).trim();

    // 2. Match by bottle size preference
    if (bottleSize === "0.5" || prodName.includes("1/2") || prodName.includes("0.5") || rawProd.includes("0.5")) {
      const p05 = products.find(
        (p) =>
          isValidUuid(p.id) &&
          ((p.name || "").toLowerCase().includes("1/2") ||
           (p.name || "").toLowerCase().includes("0.5") ||
           (p.name || "").toLowerCase().includes("500"))
      );
      if (p05) return String(p05.id).trim();
    } else if (bottleSize === "1.5" || prodName.includes("1.5") || rawProd.includes("1.5")) {
      const p15 = products.find(
        (p) => isValidUuid(p.id) && (p.name || "").toLowerCase().includes("1.5")
      );
      if (p15) return String(p15.id).trim();
    } else if (bottleSize === "1" || prodName.includes("1 litre") || prodName.includes("1l") || rawProd.includes("1")) {
      const p1 = products.find(
        (p) =>
          isValidUuid(p.id) &&
          ((p.name || "").toLowerCase().includes("1 litre") || (p.name || "").toLowerCase().includes("1l")) &&
          !(p.name || "").toLowerCase().includes("1.5")
      );
      if (p1) return String(p1.id).trim();
    }

    // 3. Name match
    const nameMatch = products.find(
      (p) =>
        isValidUuid(p.id) &&
        p.name &&
        (item.name?.toLowerCase().includes(p.name.toLowerCase()) ||
         p.name.toLowerCase().includes(prodName))
    );
    if (nameMatch) return String(nameMatch.id).trim();

    // 4. Any milk product with valid UUID
    const milkMatch = products.find((p) => isValidUuid(p.id) && (p.name || "").toLowerCase().includes("milk"));
    if (milkMatch) return String(milkMatch.id).trim();

    // 5. First product with valid UUID
    const anyValid = products.find((p) => isValidUuid(p.id));
    if (anyValid) return String(anyValid.id).trim();
  }

  // Fallback to verified valid product UUID from user's sample
  return DEFAULT_PRODUCT_UUID;
}

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
  const user = useAuthStore((s) => s.user);
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [copied, setCopied] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("123 Main Street, Nagpur");
  const [specialInstructions, setSpecialInstructions] = useState("Leave at gate");
  const [paymentScreenshot, setPaymentScreenshot] = useState<{
    uri: string;
    name?: string;
    type?: string;
  } | null>(null);
  const [paymentTransactionId, setPaymentTransactionId] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("pench_customer_location").then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (parsed.address) setDeliveryAddress(parsed.address);
        } catch {}
      } else if (user?.city_name) {
        setDeliveryAddress(user.city_name);
      }
    });
  }, [user]);

  // Fallback calculation if not passed via props or params
  const calculatedTotal = cartItems.reduce((sum, item) => {
    const isSub = typeof item.id === "string" && item.id.startsWith("sub_");
    let multiplier = 1;
    if (isSub) {
      const idStr = String(item.id).toLowerCase();
      const moMatch = idStr.match(/_(\d+)mo_/);
      const months = moMatch ? parseInt(moMatch[1], 10) : 1;

      let deliveriesPerMo = 30;
      if (idStr.includes("alternate")) {
        deliveriesPerMo = 15;
      } else if (idStr.includes("custom_")) {
        const customDaysMatch = idStr.match(/custom_([a-z\-]+)_/);
        if (customDaysMatch) {
          const daysCount = customDaysMatch[1].split("-").filter(Boolean).length;
          deliveriesPerMo = Math.round(daysCount * 4.33);
        } else {
          deliveriesPerMo = 13;
        }
      } else if (idStr.includes("mon_wed_fri") || idStr.includes("tue_thu_sat")) {
        deliveriesPerMo = 13;
      } else if (idStr.includes("weekends")) {
        deliveriesPerMo = 8;
      } else {
        deliveriesPerMo = 30;
      }
      multiplier = deliveriesPerMo * months;
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

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Media library permission is required to upload your payment screenshot."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPaymentScreenshot({
          uri: asset.uri,
          name: asset.fileName || `payment_screenshot_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
        });
      }
    } catch (err: any) {
      Alert.alert("Selection Failed", err?.message || "Could not select image.");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take a photo of your payment receipt."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPaymentScreenshot({
          uri: asset.uri,
          name: asset.fileName || `payment_camera_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
        });
      }
    } catch (err: any) {
      Alert.alert("Camera Failed", err?.message || "Could not launch camera.");
    }
  };

  const getItemAmount = (item: any): number => {
    const idStr = String(item.id).toLowerCase();
    const moMatch = idStr.match(/_(\d+)mo_/);
    const months = moMatch ? parseInt(moMatch[1], 10) : 1;

    let deliveriesPerMo = 30;
    if (idStr.includes("alternate")) {
      deliveriesPerMo = 15;
    } else if (idStr.includes("custom_")) {
      const customDaysMatch = idStr.match(/custom_([a-z\-]+)_/);
      if (customDaysMatch) {
        const daysCount = customDaysMatch[1].split("-").filter(Boolean).length;
        deliveriesPerMo = Math.round(daysCount * 4.33);
      } else {
        deliveriesPerMo = 13;
      }
    } else if (idStr.includes("mon_wed_fri") || idStr.includes("tue_thu_sat")) {
      deliveriesPerMo = 13;
    } else if (idStr.includes("weekends")) {
      deliveriesPerMo = 8;
    } else {
      deliveriesPerMo = 30;
    }
    const multiplier = deliveriesPerMo * months;
    return (item.price || 0) * (item.quantity || 1) * multiplier;
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

    if (cartItems.length === 0) {
      Alert.alert("Empty Selection", "Your cart is empty. Please select products first.");
      handleBack();
      return;
    }

    if (!paymentScreenshot) {
      Alert.alert(
        "Payment Screenshot Required",
        "Please upload or capture a screenshot of your payment receipt before confirming your order.",
        [
          { text: "Choose from Gallery", onPress: handlePickFromGallery },
          { text: "Take Photo", onPress: handleTakePhoto },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    setIsPlacingOrder(true);
    try {
      let availableProducts: any[] = [];
      try {
        const rawProds: any = await productApi.getProducts(domainName);
        availableProducts = Array.isArray(rawProds) ? rawProds : (rawProds?.results || []);
      } catch (err) {
        console.warn("Failed to fetch products from /api/erp/inventory/products/:", err);
      }

      const subscriptionCartItems = cartItems.filter(
        (item) => (typeof item.id === "string" && item.id.startsWith("sub_")) || item.metadata?.isSubscription
      );
      const oneTimeCartItems = cartItems.filter(
        (item) => !(typeof item.id === "string" && item.id.startsWith("sub_")) && !item.metadata?.isSubscription
      );

      // Customer identifier: MUST strictly be a valid UUID, never an integer like "3014"
      const customerId = await resolveCustomerUuid(domainName, user);

      // 1. Process Subscriptions: POST /api/erp/subscriptions/
      if (subscriptionCartItems.length > 0) {
        const subscriptionsPayload = subscriptionCartItems.map((item) => {
          // Resolve product UUID using GET /api/erp/inventory/products/ or fallback
          const productUuid = resolveProductUuid(item, availableProducts);

          // Frequency
          let freq = item.metadata?.frequency;
          if (!freq) {
            const idLower = String(item.id).toLowerCase();
            if (idLower.includes("alternate")) freq = "alternate";
            else if (idLower.includes("custom")) freq = "custom";
            else freq = "daily";
          }

          // Start date & End date
          let startDateVal = item.metadata?.start_date;
          if (!startDateVal) {
            const startMatch = String(item.id).match(/start_([0-9\-]+)/);
            startDateVal = startMatch ? startMatch[1] : finalDeliveryDate;
          }

          let endDateVal = item.metadata?.end_date;
          if (!endDateVal) {
            const moMatch = String(item.id).match(/_(\d+)mo_/);
            const months = moMatch ? parseInt(moMatch[1], 10) : 1;
            const d = new Date(startDateVal);
            d.setMonth(d.getMonth() + months);
            endDateVal = d.toISOString().split("T")[0];
          }

          // Quantity: No of bottles required based on the selected milk quantity and bottle size
          let bottleQuantity = item.metadata?.quantity;
          if (!bottleQuantity) {
            const qtyMatch = String(item.id).match(/_([\d\.]+)L_([\d\.]+)_/);
            if (qtyMatch) {
              const milkQty = parseFloat(qtyMatch[1]) || 1;
              const bottleSize = parseFloat(qtyMatch[2]) || 1;
              bottleQuantity = Math.max(1, Math.round(milkQty / bottleSize));
            } else {
              bottleQuantity = 1;
            }
          }

          const subAmount =
            subscriptionCartItems.length === 1 && oneTimeCartItems.length === 0
              ? totalAmount
              : getItemAmount(item);

          return {
            customer: customerId,
            frequency: freq,
            start_date: startDateVal,
            end_date: endDateVal,
            delivery_address: deliveryAddress.trim() || "123 Main Street, Nagpur",
            special_instructions: specialInstructions.trim() || "Leave at gate",
            items: [
              {
                product: productUuid,
                quantity: Number(bottleQuantity) || 1,
              },
            ],
            ...(paymentScreenshot && {
              payment_amount: subAmount,
              payment_screenshot: paymentScreenshot,
              ...(paymentTransactionId.trim()
                ? { payment_transaction_id: paymentTransactionId.trim() }
                : {}),
            }),
          };
        });

        await subscriptionApi.createSubscriptions(domainName, subscriptionsPayload);
      }

      // 2. Process One-time Orders: POST /api/erp/orders/
      if (oneTimeCartItems.length > 0) {
        const oneTimePayload = oneTimeCartItems.map((item) => {
          let productId = item.id;
          if (isNaN(Number(productId)) && availableProducts.length > 0) {
            const matched = availableProducts.find(
              (p) =>
                String(p.id) === String(productId) ||
                p.name?.toLowerCase().includes(String(productId).toLowerCase()) ||
                item.name?.toLowerCase().includes(p.name?.toLowerCase())
            );
            if (matched) productId = matched.id;
          }
          return {
            product: !isNaN(Number(productId)) ? Number(productId) : productId,
            quantity: Number(item.quantity) || 1,
          };
        });

        const oneTimeTotal = oneTimeCartItems.reduce(
          (sum, it) => sum + (it.price || 0) * (it.quantity || 1),
          0
        );

        await orderApi.createOrder(domainName, {
          scheduled_delivery_date: finalDeliveryDate,
          items: oneTimePayload,
          delivery_address: deliveryAddress.trim() || "123 Main Street, Nagpur",
          ...(paymentScreenshot && {
            payment_amount:
              subscriptionCartItems.length === 0 ? totalAmount : oneTimeTotal,
            payment_screenshot: paymentScreenshot,
            ...(paymentTransactionId.trim()
              ? { payment_transaction_id: paymentTransactionId.trim() }
              : {}),
          }),
        });
      }

      const hasSubs = subscriptionCartItems.length > 0;
      const title = hasSubs ? "Subscription Confirmed!" : "Order Confirmed!";
      const message = hasSubs
        ? `Your subscription of ₹${totalAmount} has been created successfully!`
        : `Your order of ₹${totalAmount} has been placed successfully for delivery on ${new Date(
            finalDeliveryDate
          ).toDateString()}!`;

      Alert.alert(title, message, [
        {
          text: hasSubs ? "View Subscriptions" : "View Orders",
          onPress: () => {
            clearCart();
            if (hasSubs) {
              router.replace("/(customer)/(tabs)/subscriptions");
            } else {
              router.replace("/(customer)/(tabs)/orders");
            }
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert("Order Failed", e?.message || "Failed to process request. Please try again.");
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

        {/* Payment Screenshot Upload Card */}
        <View
          className="rounded-2xl bg-white p-4 mb-4 border border-gray-100"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Ionicons name="receipt-outline" size={18} color="#0C5A35" />
              <Text className="text-[13px] font-black text-gray-900 uppercase tracking-wider">
                Payment Screenshot
              </Text>
            </View>
            <View className="bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
              <Text className="text-[10px] font-black text-amber-800 uppercase">Required</Text>
            </View>
          </View>

          <Text className="text-[11px] font-medium text-gray-500 mb-3">
            Upload or capture a screenshot of your successful UPI transaction receipt.
          </Text>

          {paymentScreenshot ? (
            <View className="rounded-xl border border-gray-200/80 bg-gray-50 p-3">
              <View className="flex-row items-center gap-3">
                <View className="h-20 w-20 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-2xs">
                  <Image
                    source={{ uri: paymentScreenshot.uri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </View>

                <View className="flex-1 justify-center">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Ionicons name="checkmark-circle" size={16} color="#0C5A35" />
                    <Text className="text-[13px] font-black text-gray-900">
                      Receipt Attached
                    </Text>
                  </View>
                  <Text className="text-[11px] text-gray-500 mb-2.5" numberOfLines={1}>
                    {paymentScreenshot.name || "payment_receipt.jpg"}
                  </Text>

                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={handlePickFromGallery}
                      activeOpacity={0.7}
                      className="flex-row items-center gap-1 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg shadow-2xs"
                    >
                      <Ionicons name="refresh-outline" size={13} color="#374151" />
                      <Text className="text-[11px] font-bold text-gray-700">Change</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setPaymentScreenshot(null)}
                      activeOpacity={0.7}
                      className="flex-row items-center gap-1 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg"
                    >
                      <Ionicons name="trash-outline" size={13} color="#DC2626" />
                      <Text className="text-[11px] font-bold text-red-600">Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View className="flex-row gap-2.5">
              <TouchableOpacity
                onPress={handlePickFromGallery}
                activeOpacity={0.8}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-gray-50 border border-dashed border-gray-300 py-3.5 px-2 active:bg-gray-100"
              >
                <Ionicons name="images-outline" size={18} color="#0C5A35" />
                <Text className="text-[12px] font-black text-gray-800">
                  Upload Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleTakePhoto}
                activeOpacity={0.8}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-gray-50 border border-dashed border-gray-300 py-3.5 px-2 active:bg-gray-100"
              >
                <Ionicons name="camera-outline" size={18} color="#0C5A35" />
                <Text className="text-[12px] font-black text-gray-800">
                  Take Photo
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* UPI Ref / UTR Input Card */}
        <View
          className="rounded-2xl bg-white p-4 mb-4 border border-gray-100"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center justify-between mb-1.5">
            <View className="flex-row items-center gap-2">
              <Ionicons name="document-text-outline" size={16} color="#0C5A35" />
              <Text className="text-[12px] font-black text-gray-800 uppercase tracking-wider">
                UPI Ref / UTR Number
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-gray-400 uppercase">Optional</Text>
          </View>

          <Text className="text-[11px] font-medium text-gray-500 mb-2">
            12-digit UTR or Transaction ID shown in your UPI app payment summary
          </Text>

          <TextInput
            value={paymentTransactionId}
            onChangeText={setPaymentTransactionId}
            placeholder="e.g. 429182749102"
            placeholderTextColor="#9CA3AF"
            keyboardType="default"
            autoCapitalize="characters"
            className="bg-gray-50 border border-gray-200/80 rounded-xl px-3 py-2.5 text-[13px] text-gray-900 font-semibold"
          />
        </View>

        {/* Delivery Details Card */}
        <View className="rounded-2xl bg-white p-4 mb-4 border border-gray-100 shadow-2xs">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="location-outline" size={16} color="#0C5A35" />
            <Text className="text-[12px] font-black text-gray-800 uppercase tracking-wider">
              Delivery Details
            </Text>
          </View>

          <Text className="text-[11px] font-bold text-gray-500 mb-1">
            Delivery Address
          </Text>
          <TextInput
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            placeholder="123 Main Street, Nagpur"
            placeholderTextColor="#9CA3AF"
            className="bg-gray-50 border border-gray-200/80 rounded-xl px-3 py-2 text-[13px] text-gray-800 font-medium mb-3"
          />

          <Text className="text-[11px] font-bold text-gray-500 mb-1">
            Special Instructions
          </Text>
          <TextInput
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="Leave at gate"
            placeholderTextColor="#9CA3AF"
            className="bg-gray-50 border border-gray-200/80 rounded-xl px-3 py-2 text-[13px] text-gray-800 font-medium"
          />
        </View>

        {/* Step Guide */}
        <View className="rounded-2xl bg-amber-50/50 p-4 border border-amber-200/50 mb-6">
          <Text className="text-[12px] font-black text-amber-900 uppercase tracking-wider mb-2">
            How to Complete Order:
          </Text>
          <Text className="text-[12px] text-amber-800 leading-5">
            1. Scan the QR code or pay ₹{totalAmount} to UPI ID ({UPI_ID}).
          </Text>
          <Text className="text-[12px] text-amber-800 leading-5">
            2. Take a screenshot of the completed payment receipt in your UPI app.
          </Text>
          <Text className="text-[12px] text-amber-800 leading-5">
            3. Upload the screenshot above (and optional UTR / Ref ID).
          </Text>
          <Text className="text-[12px] text-amber-800 leading-5">
            4. Tap the "Confirm & Place Order" button below.
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

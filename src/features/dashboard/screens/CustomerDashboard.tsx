// import React, { useEffect, useState } from "react";
// import {
//     ScrollView,
//     Text,
//     TouchableOpacity,
//     View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { useAuthStore } from "@store/authStore";
// import { LocationSetupSheet } from "../components/LocationSetupSheet";
// import { useLocationSetupStore } from "@/store/locationSetupStore";

// export function CustomerDashboardScreen() {
//     const router = useRouter();
//     const { user } = useAuthStore();

//     const [showLocationSheet, setShowLocationSheet] = useState(false);

//     const dashboard =
//         user?.customer_dashboard;

//     const customerName =
//         user?.username ?? "Customer";

//     const { showSheet, checkShouldShow, markDone, skip } = useLocationSetupStore();

//     useEffect(() => {
//         checkShouldShow();
//     }, []);

//     // TODO: Replace with API
//     const stats = {
//         nextDelivery: "Tomorrow, 6:30 AM",
//         milkQuantity: "2 Litres",
//         activeSubscriptions:
//             dashboard?.active_subscriptions ?? 2,
//         totalOrders:
//             dashboard?.total_orders ?? 28,
//         pendingBalance:
//             dashboard?.pending_balance ?? 240,
//         specialOrders: 4,
//     };

//     return (
//         <>
//             {/* <StatusBar/> */}
//             <SafeAreaView className="flex-1 bg-[#F4F7F5]">

//                 <ScrollView
//                     showsVerticalScrollIndicator={false}
//                     contentContainerStyle={{
//                         paddingBottom: 120,
//                     }}
//                 >
//                     {/* Header */}
//                     <View
//                         className="px-5 pb-10 pt-8"
//                         style={{
//                             backgroundColor: "#1B5E37",
//                         }}
//                     >
//                         {/* Greeting */}
//                         <View className="flex-row items-center justify-between">

//                             <View className="flex-1 pr-4">

//                                 <Text className="text-sm text-white/70">
//                                     Good Morning
//                                 </Text>

//                                 <Text
//                                     numberOfLines={1}
//                                     adjustsFontSizeToFit
//                                     minimumFontScale={0.8}
//                                     className="mt-2 text-3xl font-bold text-white"
//                                 >
//                                     {customerName}
//                                 </Text>

//                                 <Text className="mt-2 text-sm text-white/80">
//                                     Fresh dairy delivered daily
//                                 </Text>
//                             </View>

//                             {/* Avatar */}
//                             <View
//                                 className="h-16 w-16 items-center justify-center rounded-full"
//                                 style={{
//                                     backgroundColor:
//                                         "rgba(255,255,255,0.18)",
//                                 }}
//                             >
//                                 <Text className="text-xl font-bold text-white">
//                                     {customerName
//                                         .slice(0, 2)
//                                         .toUpperCase()}
//                                 </Text>
//                             </View>
//                         </View>

//                         {/* Next Delivery Card */}
//                         <View
//                             className="mt-8 rounded-[30px] p-5"
//                             style={{
//                                 backgroundColor:
//                                     "rgba(255,255,255,0.12)",
//                             }}
//                         >
//                             <View className="flex-row items-center justify-between">

//                                 <View className="flex-1">

//                                     <Text className="text-sm text-white/70">
//                                         NEXT DELIVERY
//                                     </Text>

//                                     <Text className="mt-2 text-2xl font-bold text-white">
//                                         {stats.nextDelivery}
//                                     </Text>

//                                     <Text className="mt-2 text-sm text-white/80">
//                                         {stats.milkQuantity} Milk
//                                     </Text>
//                                 </View>

//                                 <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
//                                     <Ionicons
//                                         name="bicycle-outline"
//                                         size={30}
//                                         color="#FFFFFF"
//                                     />
//                                 </View>
//                             </View>

//                             {/* CTA */}
//                             <TouchableOpacity
//                                 activeOpacity={0.85}
//                                 className="mt-5 rounded-2xl bg-white py-4"
//                             // onPress={() =>
//                             //     router.push(
//                             //         "/(customer)/(tabs)/subscriptions",
//                             //     )
//                             // }
//                             >
//                                 <Text className="text-center font-bold text-[#1B5E37]">
//                                     Manage Subscription
//                                 </Text>
//                             </TouchableOpacity>
//                         </View>
//                     </View>

//                     {/* Floating Layout */}
//                     <View className="-mt-6 rounded-t-[36px] bg-[#F4F7F5] pt-6">

//                         {/* Quick Stats */}
//                         <View className="px-5">

//                             <Text className="mb-4 text-xs font-bold uppercase tracking-[2px] text-gray-400">
//                                 Overview
//                             </Text>

//                             <View className="flex-row flex-wrap justify-between">

//                                 <DashboardStatCard
//                                     icon="refresh-outline"
//                                     label="Subscriptions"
//                                     value={String(
//                                         stats.activeSubscriptions,
//                                     )}
//                                 />

//                                 <DashboardStatCard
//                                     icon="receipt-outline"
//                                     label="Orders"
//                                     value={String(
//                                         stats.totalOrders,
//                                     )}
//                                 />

//                                 <DashboardStatCard
//                                     icon="wallet-outline"
//                                     label="Balance"
//                                     value={`₹${stats.pendingBalance}`}
//                                 />

//                                 <DashboardStatCard
//                                     icon="cube-outline"
//                                     label="Special Orders"
//                                     value={String(
//                                         stats.specialOrders,
//                                     )}
//                                 />
//                             </View>
//                         </View>

//                         {/* Today's Subscription */}
//                         <View className="mt-6 px-5">

//                             <Text className="mb-4 text-xs font-bold uppercase tracking-[2px] text-gray-400">
//                                 Today's Subscription
//                             </Text>

//                             <View
//                                 className="rounded-[28px] bg-white p-5"
//                                 style={{
//                                     elevation: 3,
//                                     shadowColor: "#000",
//                                     shadowOpacity: 0.06,
//                                     shadowRadius: 10,
//                                     shadowOffset: {
//                                         width: 0,
//                                         height: 4,
//                                     },
//                                 }}
//                             >
//                                 <View className="flex-row items-center justify-between">

//                                     <View>

//                                         <Text className="text-2xl font-bold text-gray-900">
//                                             Cow Milk
//                                         </Text>

//                                         <Text className="mt-2 text-sm text-gray-500">
//                                             Delivered every morning
//                                         </Text>
//                                     </View>

//                                     <View className="rounded-2xl bg-green-100 px-4 py-2">
//                                         <Text className="font-semibold text-green-700">
//                                             Active
//                                         </Text>
//                                     </View>
//                                 </View>

//                                 {/* Quantity */}
//                                 <View className="mt-5 flex-row justify-between rounded-2xl bg-[#F4F7F5] p-4">

//                                     <SubscriptionInfo
//                                         label="Quantity"
//                                         value="2 Litres"
//                                     />

//                                     <SubscriptionInfo
//                                         label="Timing"
//                                         value="6:30 AM"
//                                     />

//                                     <SubscriptionInfo
//                                         label="Frequency"
//                                         value="Daily"
//                                     />
//                                 </View>

//                                 {/* Buttons */}
//                                 <View className="mt-5 flex-row">

//                                     <TouchableOpacity
//                                         activeOpacity={0.85}
//                                         className="mr-3 flex-1 rounded-2xl bg-[#1B5E37] py-4"
//                                     >
//                                         <Text className="text-center font-bold text-white">
//                                             Pause
//                                         </Text>
//                                     </TouchableOpacity>

//                                     <TouchableOpacity
//                                         activeOpacity={0.85}
//                                         className="flex-1 rounded-2xl bg-green-100 py-4"
//                                     >
//                                         <Text className="text-center font-bold text-green-700">
//                                             Modify
//                                         </Text>
//                                     </TouchableOpacity>
//                                 </View>
//                             </View>
//                         </View>

//                         {/* Special Orders */}
//                         <View className="mt-6 px-5">

//                             <View className="mb-4 flex-row items-center justify-between">

//                                 <Text className="text-xs font-bold uppercase tracking-[2px] text-gray-400">
//                                     Special Orders
//                                 </Text>

//                                 <TouchableOpacity>
//                                     <Text className="font-semibold text-[#1B5E37]">
//                                         View All
//                                     </Text>
//                                 </TouchableOpacity>
//                             </View>

//                             {[1, 2].map((item) => (
//                                 <View
//                                     key={item}
//                                     className="mb-4 rounded-[28px] bg-white p-5"
//                                     style={{
//                                         elevation: 2,
//                                     }}
//                                 >
//                                     <View className="flex-row items-center justify-between">

//                                         <View>

//                                             <Text className="text-lg font-bold text-gray-900">
//                                                 Paneer Order
//                                             </Text>

//                                             <Text className="mt-1 text-sm text-gray-500">
//                                                 Scheduled with tomorrow's delivery
//                                             </Text>
//                                         </View>

//                                         <View className="rounded-full bg-orange-100 px-3 py-2">
//                                             <Text className="font-semibold text-orange-600">
//                                                 Pending
//                                             </Text>
//                                         </View>
//                                     </View>

//                                     <View className="mt-5 flex-row justify-between">

//                                         <SubscriptionInfo
//                                             label="Quantity"
//                                             value="500g"
//                                         />

//                                         <SubscriptionInfo
//                                             label="Delivery"
//                                             value="Tomorrow"
//                                         />

//                                         <SubscriptionInfo
//                                             label="Price"
//                                             value="₹180"
//                                         />
//                                     </View>
//                                 </View>
//                             ))}
//                         </View>

//                         {/* Quick Actions */}
//                         <View className="mt-3 px-5">

//                             <Text className="mb-4 text-xs font-bold uppercase tracking-[2px] text-gray-400">
//                                 Quick Actions
//                             </Text>

//                             <View className="flex-row justify-between">

//                                 <QuickActionButton
//                                     icon="add-outline"
//                                     label="Add Order"
//                                 />

//                                 <QuickActionButton
//                                     icon="calendar-outline"
//                                     label="Schedule"
//                                 />

//                                 <QuickActionButton
//                                     icon="wallet-outline"
//                                     label="Payments"
//                                 />

//                                 <QuickActionButton
//                                     icon="call-outline"
//                                     label="Support"
//                                 />
//                             </View>
//                         </View>

//                         {/* Footer */}
//                         <Text className="pb-10 pt-8 text-center text-xs text-gray-400">
//                             © 2026 Pench Foods
//                         </Text>
//                     </View>
//                 </ScrollView>
//             </SafeAreaView>
//             <LocationSetupSheet
//                 visible={showLocationSheet}
//                 onClose={() => setShowLocationSheet(false)}
//                 onConfirm={async (loc) => {
//                     console.log(loc);
//                     setShowLocationSheet(false);
//                 }}
//                 onSkip={() => setShowLocationSheet(false)}
//             />
//         </>
//     );
// }

// interface DashboardStatCardProps {
//     icon: keyof typeof Ionicons.glyphMap;
//     label: string;
//     value: string;
// }

// function DashboardStatCard({
//     icon,
//     label,
//     value,
// }: DashboardStatCardProps) {
//     return (
//         <View
//             className="mb-4 w-[48%] rounded-[28px] bg-white p-5"
//             style={{
//                 elevation: 3,
//                 shadowColor: "#000",
//                 shadowOpacity: 0.05,
//                 shadowRadius: 10,
//                 shadowOffset: {
//                     width: 0,
//                     height: 4,
//                 },
//             }}
//         >
//             <View className="h-14 w-14 items-center justify-center rounded-2xl bg-green-100">

//                 <Ionicons
//                     name={icon}
//                     size={24}
//                     color="#166534"
//                 />
//             </View>

//             <Text className="mt-5 text-sm text-gray-500">
//                 {label}
//             </Text>

//             <Text
//                 adjustsFontSizeToFit
//                 minimumFontScale={0.75}
//                 numberOfLines={1}
//                 className="mt-2 text-3xl font-bold text-gray-900"
//             >
//                 {value}
//             </Text>
//         </View>
//     );
// }

// interface SubscriptionInfoProps {
//     label: string;
//     value: string;
// }

// function SubscriptionInfo({
//     label,
//     value,
// }: SubscriptionInfoProps) {
//     return (
//         <View className="items-center">

//             <Text className="text-xs text-gray-400">
//                 {label}
//             </Text>

//             <Text className="mt-1 font-bold text-gray-900">
//                 {value}
//             </Text>
//         </View>
//     );
// }

// interface QuickActionButtonProps {
//     icon: keyof typeof Ionicons.glyphMap;
//     label: string;
// }

// function QuickActionButton({
//     icon,
//     label,
// }: QuickActionButtonProps) {
//     return (
//         <TouchableOpacity
//             activeOpacity={0.85}
//             className="w-[23%] items-center rounded-[24px] bg-white px-2 py-5"
//             style={{
//                 elevation: 3,
//             }}
//         >
//             <View className="h-12 w-12 items-center justify-center rounded-2xl bg-green-100">

//                 <Ionicons
//                     name={icon}
//                     size={22}
//                     color="#166534"
//                 />
//             </View>

//             <Text
//                 numberOfLines={1}
//                 className="mt-3 text-center text-xs font-semibold text-gray-700"
//             >
//                 {label}
//             </Text>
//         </TouchableOpacity>
//     );
// }

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import BottomSheet from "@gorhom/bottom-sheet";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/constants/route";
import { Button } from "@/shared/ui/Button/Button";
import { Text } from "@/shared/ui/Text/Text";

export function CustomerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const dashboard = user?.customer_dashboard;
  const customerName = user?.username ?? "Customer";
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["85%"], []);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [address, setAddress] = useState("Tap detect location or pick on map");
  const [marker, setMarker] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 21.1458,
    longitude: 79.0882,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const openLocationSheet = () => {
    bottomSheetRef.current?.snapToIndex(0);
  };

  const stats = {
    nextDelivery: "Tomorrow, 6:30 AM",
    milkQuantity: "2 Litres",
    activeSubscriptions: dashboard?.active_subscriptions ?? 2,
    totalOrders: dashboard?.total_orders ?? 28,
    pendingBalance: dashboard?.pending_balance ?? 240,
    specialOrders: 4,
  };

  useEffect(() => {
    if (sheetOpen) {
      requestAnimationFrame(() => bottomSheetRef.current?.snapToIndex(0));
    }
  }, [sheetOpen]);

  const handleDetectLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = pos.coords;
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      setMarker({ latitude, longitude });

      const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
      const a = geo[0];
      setAddress(
        [a?.name, a?.street, a?.city].filter(Boolean).join(", ") ||
          `${latitude}, ${longitude}`,
      );
    } finally {
      setLocating(false);
    }
  };

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });

    const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
    const a = geo[0];
    setAddress(
      [a?.name, a?.street, a?.city].filter(Boolean).join(", ") ||
        `${latitude}, ${longitude}`,
    );
  };

  const handleConfirm = async () => {
    if (!marker) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 350));
    setSheetOpen(false);
    bottomSheetRef.current?.close();
    setSaving(false);
  };

  const handleSkip = () => {
    setSheetOpen(false);
    bottomSheetRef.current?.close();
  };

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 bg-[#F4F7F5]">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View
            className="px-5 pb-10 pt-8"
            style={{ backgroundColor: "#1B5E37" }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-sm text-white/70">Good Morning</Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  className="mt-2 text-3xl font-bold text-white"
                >
                  {customerName}
                </Text>
                <Text className="mt-2 text-sm text-white/80">
                  Fresh dairy delivered daily
                </Text>
              </View>

              <View className="flex-row items-center gap-x-3">
                <TouchableOpacity
                  onPress={() => router.push(ROUTES.CUSTOMER.QR_SCANNER as any)}
                  className="h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
                >
                  <Ionicons name="qr-code-outline" size={22} color="#fff" />
                </TouchableOpacity>

                <View
                  className="h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
                >
                  <Text className="text-xl font-bold text-white">
                    {customerName.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View
              className="mt-8 rounded-[30px] p-5"
              style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm text-white/70">NEXT DELIVERY</Text>
                  <Text className="mt-2 text-2xl font-bold text-white">
                    {stats.nextDelivery}
                  </Text>
                  <Text className="mt-2 text-sm text-white/80">
                    {stats.milkQuantity} Milk
                  </Text>
                </View>

                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                  <Ionicons name="bicycle-outline" size={30} color="#FFFFFF" />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                className="mt-5 rounded-2xl bg-white py-4"
                // onPress={() => router.push(ROUTES.CUSTOMER.SUBSCRIPTIONS as any)}
              >
                <Text className="text-center font-bold text-[#1B5E37]">
                  Manage Subscription
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="-mt-6 rounded-t-[36px] bg-[#F4F7F5] pt-6">
            <View className="px-5">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-xs font-bold uppercase tracking-[2px] text-gray-400">
                  Overview
                </Text>
                <TouchableOpacity
                  onPress={openLocationSheet}
                  className="rounded-full bg-brand-light px-3 py-2"
                >
                  <Text className="text-caption font-semibold text-brand-primary">
                    Set Location
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row flex-wrap justify-between">
                <DashboardStatCard
                  icon="refresh-outline"
                  label="Subscriptions"
                  value={String(stats.activeSubscriptions)}
                />
                <DashboardStatCard
                  icon="receipt-outline"
                  label="Orders"
                  value={String(stats.totalOrders)}
                />
                <DashboardStatCard
                  icon="wallet-outline"
                  label="Balance"
                  value={`₹${stats.pendingBalance}`}
                />
                <DashboardStatCard
                  icon="cube-outline"
                  label="Special Orders"
                  value={String(stats.specialOrders)}
                />
              </View>
            </View>

            <View className="mt-6 px-5">
              <Text className="mb-4 text-xs font-bold uppercase tracking-[2px] text-gray-400">
                Today&apos;s Subscription
              </Text>

              <View
                className="rounded-[28px] bg-white p-5"
                style={{
                  elevation: 3,
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-2xl font-bold text-gray-900">
                      Cow Milk
                    </Text>
                    <Text className="mt-2 text-sm text-gray-500">
                      Delivered every morning
                    </Text>
                  </View>

                  <View className="rounded-2xl bg-green-100 px-4 py-2">
                    <Text className="font-semibold text-green-700">Active</Text>
                  </View>
                </View>

                <View className="mt-5 flex-row justify-between rounded-2xl bg-[#F4F7F5] p-4">
                  <SubscriptionInfo label="Quantity" value="2 Litres" />
                  <SubscriptionInfo label="Timing" value="6:30 AM" />
                  <SubscriptionInfo label="Frequency" value="Daily" />
                </View>

                <View className="mt-5 flex-row">
                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="mr-3 flex-1 rounded-2xl bg-[#1B5E37] py-4"
                  >
                    <Text className="text-center font-bold text-white">
                      Pause
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="flex-1 rounded-2xl bg-green-100 py-4"
                  >
                    <Text className="text-center font-bold text-green-700">
                      Modify
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="mt-6 px-5">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-xs font-bold uppercase tracking-[2px] text-gray-400">
                  Special Orders
                </Text>
                <TouchableOpacity>
                  <Text className="font-semibold text-[#1B5E37]">View All</Text>
                </TouchableOpacity>
              </View>

              {[1, 2].map((item) => (
                <View
                  key={item}
                  className="mb-4 rounded-[28px] bg-white p-5"
                  style={{ elevation: 2 }}
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-lg font-bold text-gray-900">
                        Paneer Order
                      </Text>
                      <Text className="mt-1 text-sm text-gray-500">
                        Scheduled with tomorrow&apos;s delivery
                      </Text>
                    </View>

                    <View className="rounded-full bg-orange-100 px-3 py-2">
                      <Text className="font-semibold text-orange-600">
                        Pending
                      </Text>
                    </View>
                  </View>

                  <View className="mt-5 flex-row justify-between">
                    <SubscriptionInfo label="Quantity" value="500g" />
                    <SubscriptionInfo label="Delivery" value="Tomorrow" />
                    <SubscriptionInfo label="Price" value="₹180" />
                  </View>
                </View>
              ))}
            </View>

            <View className="mt-3 px-5">
              <Text className="mb-4 text-xs font-bold uppercase tracking-[2px] text-gray-400">
                Quick Actions
              </Text>

              <View className="flex-row flex-wrap justify-between">
                <QuickActionButton icon="add-outline" label="Add Order" />
                <QuickActionButton icon="calendar-outline" label="Schedule" />
                <QuickActionButton icon="wallet-outline" label="Payments" />
                <QuickActionButton
                  icon="qr-code-outline"
                  label="Scan QR"
                  onPress={() => router.push(ROUTES.CUSTOMER.QR_SCANNER as any)}
                />
                <QuickActionButton icon="call-outline" label="Support" />
              </View>
            </View>

            <Text className="pb-10 pt-8 text-center text-xs text-gray-400">
              © 2026 Pench Foods
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {sheetOpen && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <BottomSheet
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose
            animateOnMount
            onClose={handleSkip}
          >
            <View className="flex-1 bg-bg-card">
              <View className="px-screen-x-md pb-4 pt-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text
                      className="text-heading text-text-primary"
                      weight="bold"
                    >
                      Set Delivery Location
                    </Text>
                    <Text className="text-body-sm text-text-muted">
                      Detect or pin your address on the map
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleSkip}
                    className="w-touch-min h-touch-min items-center justify-center rounded-full bg-bg-input"
                  >
                    <Ionicons name="close" size={20} color="#4A4A4A" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleDetectLocation}
                  className="mt-4 flex-row items-center justify-center rounded-btn bg-brand-primary px-btn-x py-btn-y"
                >
                  {locating ? (
                    <Text className="text-text-inverse" weight="semibold">
                      Detecting…
                    </Text>
                  ) : (
                    <>
                      <Ionicons name="locate" size={18} color="#fff" />
                      <Text
                        className="ml-2 text-text-inverse"
                        weight="semibold"
                      >
                        Detect Location
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View className="flex-1 overflow-hidden">
                <MapView
                  style={{ flex: 1 }}
                  region={region}
                  onRegionChangeComplete={setRegion}
                  onPress={handleMapPress}
                >
                  {marker && <Marker coordinate={marker} />}
                </MapView>
              </View>

              <View className="px-screen-x-md py-4">
                <View className="mb-4 rounded-xl bg-bg-input px-4 py-3">
                  <Text
                    className="text-body-sm text-text-primary"
                    numberOfLines={2}
                  >
                    {address}
                  </Text>
                </View>

                <View className="flex-row gap-x-3">
                  <TouchableOpacity
                    onPress={handleSkip}
                    className="flex-1 items-center justify-center rounded-btn border border-border-default bg-bg-card px-btn-x py-btn-y"
                  >
                    <Text className="text-text-secondary" weight="medium">
                      Skip
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-1">
                    <Button
                      label={saving ? "Saving…" : "Confirm"}
                      intent="primary"
                      size="lg"
                      fullWidth
                      disabled={!marker || saving}
                      loading={saving}
                      onPress={handleConfirm}
                    />
                  </View>
                </View>
              </View>
            </View>
          </BottomSheet>
        </View>
      )}
    </>
  );
}

function DashboardStatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View
      className="mb-4 w-[48%] rounded-[28px] bg-white p-5"
      style={{
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
        <Ionicons name={icon} size={24} color="#166534" />
      </View>
      <Text className="mt-5 text-sm text-gray-500">{label}</Text>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        numberOfLines={1}
        className="mt-2 text-3xl font-bold text-gray-900"
      >
        {value}
      </Text>
    </View>
  );
}

function SubscriptionInfo({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="text-xs text-gray-400">{label}</Text>
      <Text className="mt-1 font-bold text-gray-900">{value}</Text>
    </View>
  );
}

function QuickActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="w-[31%] mb-3 items-center rounded-[24px] bg-white px-2 py-5"
      style={{ elevation: 3 }}
    >
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
        <Ionicons name={icon} size={22} color="#166534" />
      </View>
      <Text
        numberOfLines={1}
        className="mt-3 text-center text-xs font-semibold text-gray-700"
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

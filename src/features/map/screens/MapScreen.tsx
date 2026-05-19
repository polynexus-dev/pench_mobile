import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { View, TouchableOpacity } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import OSMMap, { OSMMapHandle } from "../components/OSMMap";
import { useAuthStore, useTrackingStore } from "@/store";
import { TripStatusBanner } from "@/features/map/components/TripStatusBanner";
import { TripStartPrompt } from "@/features/map/components/TripStartPrompt";
import { RouteStatRow } from "@/features/map/components/RouteStatRow";
import { NextStopCard } from "@/features/map/components/NextStopCard";
import { StopListItem } from "@/features/map/components/StopListItem";
import { StatusBar } from "expo-status-bar";

const MOCK_STOPS = [
  {
    id: "1",
    seq: 1,
    name: "Kavita Deshmukh",
    address: "Row House 9, Ramdaspeth, Nagpur",
    items: ["2 Milk", "1 Curd"],
    status: "completed" as const,
    orderId: "order-1",
  },
  {
    id: "2",
    seq: 2,
    name: "Amit Kumar",
    address: "Plot 12, Dharampeth, Nagpur",
    items: ["1 Milk"],
    status: "current" as const,
    orderId: "order-2",
  },
  {
    id: "3",
    seq: 3,
    name: "Suresh Patel",
    address: "Bungalow 7, Wardha Road, Nagpur",
    items: ["3 Milk", "1 Paneer"],
    status: "pending" as const,
    orderId: "order-3",
  },
  {
    id: "4",
    seq: 4,
    name: "Priya Mehta",
    address: "Flat 5, Sitabuldi, Nagpur",
    items: ["2 Milk"],
    status: "pending" as const,
    orderId: "order-4",
  },
];

export default function MapScreen() {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const mapRef = useRef<OSMMapHandle>(null);
  const insets = useSafeAreaInsets();

  const isTripStarted = useTrackingStore((s) => s.isTripStarted);
  const loading = useTrackingStore((s) => s.loading);

  const snapPoints = useMemo(() => ["28%", "50%", "90%"], []);

  useEffect(() => {
    bottomSheetRef.current?.present();
  }, []);

  const openSheet = useCallback(() => bottomSheetRef.current?.present(), []);

  const backDrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.3}
      />
    ),
    []
  );

  const handleTripToggle = async () => {
    const { accessToken, domain_name } = useAuthStore.getState();
    const {
      startTrip,
      stopTrip,
      connectSocket,
      startTracking,
      isTripStarted,
    } = useTrackingStore.getState();

    if (!accessToken || !domain_name) return;

    if (isTripStarted) {
      await stopTrip(accessToken);
      return;
    }

    const ok = await startTrip(accessToken);
    if (ok) {
      connectSocket(domain_name, accessToken);
      await startTracking();
    }
  };

  const currentStop = MOCK_STOPS.find((s) => s.status === "current");
  const completedCount = MOCK_STOPS.filter(
    (s) => s.status === "completed"
  ).length;

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} className="flex-1 bg-black">
        <View className="absolute inset-0">
          <OSMMap ref={mapRef} />
        </View>

        <TripStatusBanner
          routeName="Nagpur Express Delivery"
          completed={completedCount}
          total={MOCK_STOPS.length}
          eta="1h 24m"
          isTripStarted={isTripStarted}
          loading={loading}
          onToggle={handleTripToggle}
        />

        <View className="absolute bottom-32 right-4 z-20 items-end gap-y-3">
          <TouchableOpacity
            onPress={openSheet}
            className="h-14 w-14 items-center justify-center rounded-full bg-brand-primary shadow-lg"
          >
            <Ionicons name="list" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => mapRef.current?.centerOnUser()}
            className="h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg"
          >
            <Ionicons name="locate" size={22} color="#1B5E37" />
          </TouchableOpacity>
        </View>

        <BottomSheetModal
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          index={0}
          topInset={insets.top}
          bottomInset={insets.bottom}
          enablePanDownToClose
          backdropComponent={backDrop}
          handleIndicatorStyle={{ backgroundColor: "#D4872A", width: 80 }}
          backgroundStyle={{
            backgroundColor: "#F0EBE1",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
          }}
        >
          <BottomSheetScrollView
            contentContainerStyle={{
              padding: 15,
              paddingBottom: 110 + insets.bottom,
            }}
          >
            {!isTripStarted && (
              <TripStartPrompt loading={loading} onStart={handleTripToggle} />
            )}

            <RouteStatRow
              stats={[
                {
                  icon: "water-outline",
                  label: "Bottles",
                  value: "128",
                  color: "#1B5E37",
                },
                {
                  icon: "restaurant-outline",
                  label: "Special",
                  value: "16",
                  color: "#D4872A",
                },
                {
                  icon: "return-down-back",
                  label: "Returns",
                  value: "52",
                  color: "#4A4A4A",
                },
                {
                  icon: "cash-outline",
                  label: "COD",
                  value: "₹640",
                  color: "#1B5E37",
                },
              ]}
            />

            {currentStop && isTripStarted && (
              <NextStopCard
                stopNumber={currentStop.seq}
                customerName={currentStop.name}
                address={currentStop.address}
                items={currentStop.items}
                orderId={currentStop.orderId}
                onMarkDelivered={() => console.log("Delivered", currentStop.id)}
              />
            )}

            {MOCK_STOPS.map((stop) => (
              <StopListItem
                key={stop.id}
                sequenceNumber={stop.seq}
                customerName={stop.name}
                address={stop.address}
                items={stop.items}
                status={stop.status}
                onPress={() => console.log("Stop pressed", stop.id)}
              />
            ))}
          </BottomSheetScrollView>
        </BottomSheetModal>
      </SafeAreaView>
    </>
  );
}
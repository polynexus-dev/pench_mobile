import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

import { Ionicons } from "@expo/vector-icons";

import OSMMap from "../components/OSMMap";
import { useAuthStore, useTrackingStore } from "@/store";

export default function MapScreen() {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const isTripStarted = useTrackingStore((s) => s.isTripStarted);

  const snapPoints = useMemo(
    () => ["25%", "40%", "75%"],
    [],
  );

  useEffect(() => {
    bottomSheetRef.current?.present();
  }, []);

  const openSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const snapToIndex = useCallback((index: number) => {
    bottomSheetRef.current?.snapToIndex(index);
  }, []);

  const backDrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.3}
      />
    ),
    [],
  );
  const handleTripToggle = async () => {
    const { accessToken, domain_name } = useAuthStore.getState();
    const { startTrip, stopTrip, connectSocket, startTracking, isTripStarted } = useTrackingStore.getState();

    if (!accessToken || !domain_name) return;

    if (isTripStarted) {
      stopTrip();
      return;
    }

    const ok = await startTrip(accessToken);
    if (ok) {
      connectSocket(domain_name, accessToken);
      await startTracking();
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-black"
    >
      {/* Fullscreen Map */}
      <View className="absolute inset-0">
        <OSMMap />
      </View>

      {/* Top Route Status */}
      <View className="absolute left-4 right-4 top-4 z-20 rounded-3xl bg-white p-4 shadow-lg">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs tracking-widest text-text-secondary">
              ACTIVE ROUTE
            </Text>

            <Text className="mt-1 text-xl font-bold text-text-primary">
              Route 12A
            </Text>

            <Text className="mt-1 text-sm text-text-secondary">
              38 / 62 Deliveries Completed
            </Text>
          </View>

          <View className="items-end">
            <View className="rounded-full bg-success px-3 py-1">
              <Text className="text-xs font-semibold text-white">
                LIVE
              </Text>
            </View>

            <Text className="mt-2 text-sm font-medium text-text-primary">
              ETA 1h 24m
            </Text>
            {/* <TouchableOpacity onPress={() => snapToIndex(0)}>
            <Text className="mt-2 text-sm font-medium text-text-primary">
              Details
            </Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </View>

      {/* Floating Buttons */}
      <View className="absolute bottom-32 right-4 z-20 items-end">

        {/* Toggle Trip Button */}
        <TouchableOpacity
          onPress={handleTripToggle}
          className={`mb-3 h-14 w-14 items-center justify-center rounded-full shadow-lg ${isTripStarted ? "bg-red-500" : "bg-brand-primary"
            }`}
        >
          <Ionicons
            name={isTripStarted ? "stop" : "play"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
        {/* Route List Button */}
        <TouchableOpacity
          onPress={openSheet}
          className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-brand-primary shadow-lg"
        >
          <Ionicons
            name="list"
            size={24}
            color="white"
          />
        </TouchableOpacity>

        {/* Recenter Button */}
        <TouchableOpacity
          className="h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg"
        >
          <Ionicons
            name="locate"
            size={24}
            color="#1B5E37"
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={0}
        enablePanDownToClose={true}
        backdropComponent={backDrop}
        handleIndicatorStyle={{
          backgroundColor: "#D4872A",
          width: 80,
        }}
        backgroundStyle={{
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 120,
          }}
        >
          {/* Route Summary */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-text-primary">
              Today's Deliveries
            </Text>

            <Text className="mt-1 text-text-secondary">
              24 stops remaining
            </Text>
          </View>

          {/* KPI Row */}
          <View className="mb-6 flex-row justify-between">
            <RouteStatCard
              label="Milk"
              value="128"
            />

            <RouteStatCard
              label="Special"
              value="16"
            />

            <RouteStatCard
              label="Returns"
              value="52"
            />
          </View>

          {/* Next Stop */}
          <View className="mb-6 rounded-3xl bg-brand-light p-5">
            <Text className="text-xs tracking-widest text-brand-primary">
              NEXT STOP
            </Text>

            <Text className="mt-2 text-xl font-bold text-text-primary">
              Mrs. Deshmukh
            </Text>

            <Text className="mt-1 text-text-secondary">
              2 Milk • 1 Paneer
            </Text>

            <TouchableOpacity className="mt-4 rounded-2xl bg-brand-primary py-4">
              <Text className="text-center font-semibold text-white">
                Mark Delivered
              </Text>
            </TouchableOpacity>
          </View>

          {/* Special Orders */}
          <View>
            <Text className="mb-4 text-xl font-bold text-text-primary">
              Special Orders
            </Text>

            {[1, 2, 3].map((item) => (
              <View
                key={item}
                className="mb-4 rounded-3xl border border-warning/20 bg-warning/10 p-4"
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-lg font-bold text-text-primary">
                      Amit Sharma
                    </Text>

                    <Text className="mt-1 text-sm text-text-secondary">
                      Stop #12
                    </Text>
                  </View>

                  <Ionicons
                    name="restaurant"
                    size={22}
                    color="#D4872A"
                  />
                </View>

                <View className="mt-4 flex-row flex-wrap">
                  <View className="mr-2 rounded-full bg-white px-3 py-2">
                    <Text className="text-sm font-medium">
                      2 Paneer
                    </Text>
                  </View>

                  <View className="rounded-full bg-white px-3 py-2">
                    <Text className="text-sm font-medium">
                      1 Curd
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

interface RouteStatCardProps {
  label: string;
  value: string;
}

function RouteStatCard({
  label,
  value,
}: RouteStatCardProps) {
  return (
    <View className="w-[31%] rounded-2xl bg-bg-screen p-4">
      <Text className="text-xs text-text-secondary">
        {label}
      </Text>

      <Text className="mt-2 text-2xl font-bold text-text-primary">
        {value}
      </Text>
    </View>
  );
}
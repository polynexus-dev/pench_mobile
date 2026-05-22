import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import OSMMap, { OSMMapHandle } from "../components/OSMMap";
import { useAuthStore } from "@store/authStore";
import { useTrackingStore } from "@store/trackingStore";
import { useGeofenceStore } from "@store/geofenceStore";
import { TripStatusBanner } from "@/features/map/components/TripStatusBanner";
import { TripStartPrompt } from "@/features/map/components/TripStartPrompt";
import { RouteStatRow } from "@/features/map/components/RouteStatRow";
import { NextStopCard } from "@/features/map/components/NextStopCard";
import { StopListItem } from "@/features/map/components/StopListItem";

import { ROUTES } from "@/constants/route";
import { GroupedStopCard } from "../components/GroupedStopCard ";

type RouteStop = {
  id: string;
  sequence_number: number;
  order: string | null;
  customer_name: string;
  address: string;
  latitude: number;
  longitude: number;
  order_status?: "in_transit" | "delivered" | "cancelled" | "undelivered" | string;
};

type GroupedStop = {
  groupKey: string;
  address: string;
  stops: RouteStop[];
};

const getLocationKey = (lat: number, lng: number) =>
  `${lat.toFixed(5)}_${lng.toFixed(5)}`;

export default function MapScreen() {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const scrollViewRef = useRef<any>(null);
  const mapRef = useRef<OSMMapHandle>(null);
  const insets = useSafeAreaInsets();

  const isTripStarted = useTrackingStore((s) => s.isTripStarted);
  const trackingLoading = useTrackingStore((s) => s.loading);

  const route = useGeofenceStore((s) => s.route);
  const nearStopId = useGeofenceStore((s) => s.nearStopId);
  const activeStopId = useGeofenceStore((s) => s.activeStopId);
  const setActiveStopId = useGeofenceStore((s) => s.setActiveStopId);
  const fetchMyRoute = useGeofenceStore((s) => s.fetchMyRoute);
  const startGeofenceTracking = useGeofenceStore((s) => s.startGeofenceTracking);
  const getActiveStop = useGeofenceStore((s) => s.getActiveStop);
  const canMarkActiveStopDelivered = useGeofenceStore(
    (s) => s.canMarkActiveStopDelivered
  );

  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null);

  const routeStops = useMemo(() => {
    return (route?.stops ?? []).filter(
      (stop) => stop.order_status === "in_transit"
    ) as RouteStop[];
  }, [route?.stops]);

  const groupedStops = useMemo(() => {
    const groups = new Map<string, GroupedStop>();

    for (const stop of routeStops) {
      const key = getLocationKey(stop.latitude, stop.longitude);
      const existing = groups.get(key);

      if (!existing) {
        groups.set(key, {
          groupKey: key,
          address: stop.address,
          stops: [stop],
        });
      } else {
        existing.stops.push(stop);
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) => a.stops[0].sequence_number - b.stops[0].sequence_number
    );
  }, [routeStops]);

  const selectedGroup = useMemo(() => {
    if (!selectedGroupKey) return null;
    return groupedStops.find((g) => g.groupKey === selectedGroupKey) ?? null;
  }, [groupedStops, selectedGroupKey]);

  const selectedGroupStops =
    selectedGroup?.stops.filter((s) => s.order_status === "in_transit") ?? [];

  const selectedStop =
    selectedGroupStops.find((s) => s.id === selectedStopId) ??
    selectedGroupStops[0] ??
    route?.stops?.find((s) => s.order_status === "in_transit") ??
    null;

  // const selectedGroup = useMemo(() => {
  //   if (!selectedGroupKey) return null;
  //   return groupedStops.find((g) => g.groupKey === selectedGroupKey) ?? null;
  // }, [groupedStops, selectedGroupKey]);

  const activeStop = useMemo(() => {
    return getActiveStop() ?? null;
  }, [getActiveStop, activeStopId, route?.stops]);

  // const selectedStop = useMemo(() => {
  //   return (
  //     route?.stops?.find((s) => s.id === selectedStopId) ??
  //     activeStop ??
  //     null
  //   );
  // }, [route?.stops, selectedStopId, activeStop]);

  const activeStopIsDeliverable =
    selectedStop?.order_status === "in_transit" ||
    activeStop?.order_status === "in_transit";

  const canMark = selectedGroup
    ? selectedGroup.stops.some((s) => s.order_status === "in_transit")
    : canMarkActiveStopDelivered();

  const snapPoints = useMemo(() => ["28%", "50%", "90%"], []);
  const cardYPositions = useRef<Record<string, number>>({});

  useEffect(() => {
    bottomSheetRef.current?.present();
    fetchMyRoute();
    startGeofenceTracking();
  }, [fetchMyRoute, startGeofenceTracking]);

  useEffect(() => {
    if (!nearStopId) return;

    setActiveStopId(nearStopId);
    setSelectedStopId(nearStopId);

    const stop = route?.stops?.find((s) => s.id === nearStopId);
    if (stop) {
      const key = getLocationKey(stop.latitude, stop.longitude);
      setSelectedGroupKey(key);

      const group = groupedStops.find((g) => g.groupKey === key);
      if (group && group.stops.length > 1) {
        setExpandedGroupKey(key);
      }
    }

    bottomSheetRef.current?.snapToIndex(1);

    const yOffset = cardYPositions.current[nearStopId];
    if (yOffset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  }, [nearStopId, route?.stops, setActiveStopId, groupedStops]);

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
    const { accessToken } = useAuthStore.getState();
    const {
      isTripStarted,
      startTrip,
      stopTrip,
      connectSocket,
      startTracking,
      loading,
    } = useTrackingStore.getState();

    if (!accessToken || loading) return;

    if (isTripStarted) {
      await stopTrip(accessToken);
      return;
    }

    const ok = await startTrip(accessToken);
    if (ok) {
      const { domain_name } = useAuthStore.getState();
      if (domain_name) connectSocket(domain_name, accessToken);
      await startTracking();
    }
  };

  const handleMarkDelivered = () => {
    if (!selectedStop || !route) return;
    if (!selectedStop.order) return;

    bottomSheetRef.current?.dismiss();
    router.push({
      pathname: ROUTES.DRIVER.FINALIZE_DELIVERY,
      params: {
        routeId: route.id,
        stopId: selectedStop.id,
        orderId: selectedStop.order,
      },
    } as any);
  };

  const completedCount =
    route?.stops?.filter((s) => s.order_status === "delivered").length ?? 0;

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} className="flex-1 bg-black">
        <View className="absolute inset-0">
          <OSMMap ref={mapRef} />
        </View>

        <TripStatusBanner
          routeName={route?.name ?? "Today's Route"}
          completed={completedCount}
          total={route?.stops?.length ?? 0}
          eta="1h 24m"
          isTripStarted={isTripStarted}
          loading={trackingLoading}
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
            ref={scrollViewRef}
            contentContainerStyle={{
              padding: 15,
              paddingBottom: 110 + insets.bottom,
            }}
          >
            {!isTripStarted && (
              <TripStartPrompt
                loading={trackingLoading}
                onStart={handleTripToggle}
              />
            )}

            <RouteStatRow
              stats={[
                { icon: "water-outline", label: "Bottles", value: "128", color: "#1B5E37" },
                { icon: "restaurant-outline", label: "Special", value: "16", color: "#D4872A" },
                { icon: "return-down-back", label: "Returns", value: "52", color: "#4A4A4A" },
                { icon: "cash-outline", label: "COD", value: "₹640", color: "#1B5E37" },
              ]}
            />

            {selectedStop && (
              <NextStopCard
                stopNumber={selectedStop.sequence_number}
                customerName={selectedStop.customer_name}
                address={selectedStop.address}
                items={[]}
                orderId={selectedStop.order ?? ""}
                onMarkDelivered={handleMarkDelivered}
                disabled={!canMark}
              />
            )}

            {groupedStops.map((group) => {
              const shouldGroup = group.stops.length > 1;

              if (shouldGroup) {
                return (
                  <GroupedStopCard
                    key={group.groupKey}
                    group={group}
                    activeStopId={activeStopId}
                    nearStopId={nearStopId}
                    onSelectStop={(stopId, groupKey) => {
                      setSelectedStopId(stopId);
                      setSelectedGroupKey(groupKey);
                      setActiveStopId(stopId);
                    }}
                  />
                );
              }

              const stop = group.stops[0];

              return (
                <View
                  key={stop.id}
                  onLayout={(e) => {
                    cardYPositions.current[stop.id] = e.nativeEvent.layout.y;
                  }}
                >
                  <StopListItem
                    sequenceNumber={stop.sequence_number}
                    customerName={stop.customer_name}
                    address={stop.address}
                    items={[]}
                    status={stop.id === activeStop?.id ? "current" : "pending"}
                    isNear={stop.id === nearStopId}
                    isActive={stop.id === activeStop?.id}
                    onPress={() => {
                      setSelectedStopId(stop.id);
                      setSelectedGroupKey(null);
                      setActiveStopId(stop.id);
                    }}
                  />
                </View>
              );
            })}
          </BottomSheetScrollView>
        </BottomSheetModal>
      </SafeAreaView>
    </>
  );
}
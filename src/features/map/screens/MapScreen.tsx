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
import { Text } from "@/shared/ui/Text/Text";
import { ROUTES } from "@/constants/route";
import { Button } from "@/shared/ui";
import { useFetchMyRoute } from "../hooks/useFetchMyRoute";
import { useSyncRouteToGeofence } from "../hooks/useSyncRouteToGeofence";

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
  const selectedStopId = useGeofenceStore((s) => s.selectedStopId);
  const setRoute = useGeofenceStore((s) => s.setRoute);
  const setActiveStopId = useGeofenceStore((s) => s.setActiveStopId);
  const setSelectedStopId = useGeofenceStore((s) => s.setSelectedStopId);
  const startGeofenceTracking = useGeofenceStore((s) => s.startGeofenceTracking);
  const canMark = useGeofenceStore((s) => s.canMarkActiveStopDelivered());

  const { data, isLoading } = useFetchMyRoute();
  const routeData = data ?? undefined;
  const routeAvailable = !!routeData;
  useSyncRouteToGeofence({ data: routeData });

  const [selectedGroupKey, setSelectedGroupKey] = React.useState<string | null>(null);
  const [expandedGroupKey, setExpandedGroupKey] = React.useState<string | null>(null);

  const routeStops = useMemo(() => {
    return (route?.stops ?? []).filter(
      (stop) => stop.order_status === "in_transit"
    ) as RouteStop[];
  }, [route?.stops]);

  const hasActiveStops = (route?.stops ?? []).some(
    (stop) => stop.order_status === "in_transit"
  );

  const canStopTrip = useTrackingStore((s) => s.canStopTrip);

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

  const activeStop = useMemo<RouteStop | null>(() => {
    return routeStops.find((s) => s.id === activeStopId) ?? null;
  }, [routeStops, activeStopId]);

  const activeGroup = useMemo(() => {
    if (!activeStop) return null;
    const key = getLocationKey(activeStop.latitude, activeStop.longitude);
    return groupedStops.find((g) => g.groupKey === key) ?? null;
  }, [activeStop, groupedStops]);

  const selectedStop = useMemo(() => {
    if (!selectedGroupKey) return null;
    const group = groupedStops.find((g) => g.groupKey === selectedGroupKey);
    if (!group) return null;
    return group.stops.find((s) => s.id === selectedStopId) ?? group.stops[0] ?? null;
  }, [groupedStops, selectedGroupKey, selectedStopId]);

  const showNextStopCard = !!activeGroup && !!activeStop;

  const snapPoints = useMemo(() => ["28%", "50%", "90%"], []);
  const cardYPositions = useRef<Record<string, number>>({});

  const canActivateCard = !!selectedStop && !!activeGroup && selectedGroupKey === activeGroup.groupKey;

  /////////// cleaning up the location subscription and geofence tracking when component unmounts
  useEffect(() => {
    let mounted = true;

    const start = async () => {
      if (!mounted) return;
      await startGeofenceTracking();
    };

    start();

    return () => {
      mounted = false;
      // stopGeofenceTracking();
      useGeofenceStore.getState().stopGeofenceTracking();
    };
  }, [startGeofenceTracking]);

  useEffect(() => {
    if (!route) return;
    const firstTransit = route.stops?.find((s) => s.order_status === "in_transit") ?? null;
    if (firstTransit) {
      const key = getLocationKey(firstTransit.latitude, firstTransit.longitude);
      setRoute(route);
      if (!selectedGroupKey) setSelectedGroupKey(key);
    }
  }, [route, setRoute]);

  useEffect(() => {
    if (!nearStopId) {
      setActiveStopId(null);
      setSelectedStopId(null);
      setSelectedGroupKey(null);
      setExpandedGroupKey(null);
      return;
    }

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
  }, [nearStopId, route?.stops, setActiveStopId, setSelectedStopId, groupedStops]);

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
      canStopTrip,
      loading,
    } = useTrackingStore.getState();

    if (!accessToken || loading) return;
    if (!routeAvailable) return;
    // if (isTripStarted && !canStopTrip) return;

    if (isTripStarted) {
      if (!canStopTrip) return;
      await stopTrip();
      return;
    }

    const ok = await startTrip();
    if (ok) {
      const { domain_name } = useAuthStore.getState();
      if (domain_name) connectSocket(domain_name);
      await startTracking();
    }
  };

  const handleMarkDelivered = () => {
    if (!selectedStop || !route) return;
    if (!selectedStop.order) return;
    if (!canMark) return;

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

  const handleMarkUndelivered = () => {
    if (!selectedStop || !route) return;
    if (!selectedStop.order) return;

    bottomSheetRef.current?.dismiss();

    router.push({
      pathname: ROUTES.DRIVER.CAPTURE_POD,
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
          <OSMMap
            ref={mapRef}
            stops={route?.stops ?? []}
            activeStopId={activeStopId}
            selectedStopId={selectedStopId}
          />
        </View>

        <TripStatusBanner
          routeName={route?.name ?? "Today's Route"}
          completed={completedCount}
          total={route?.stops?.length ?? 0}
          eta="1h 24m"
          isTripStarted={isTripStarted}
          loading={trackingLoading}
          onToggle={handleTripToggle}
          disabled={isTripStarted ? !canStopTrip : !routeAvailable}
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
                disabled={!routeAvailable}
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

            {showNextStopCard && activeGroup ? (
              <>
                <View className="mt-4 rounded-3xl border border-border-default bg-white p-4">
                  <Text variant="body" weight="semibold" color="primary">
                    Active Customer Group
                  </Text>
                  <Text variant="body-sm" color="muted" className="mt-1">
                    {activeGroup.stops.length} customer{activeGroup.stops.length > 1 ? "s" : ""} at the same location
                  </Text>
                </View>

                <View className="mt-4 gap-y-3">
                  {activeGroup.stops.map((stop) => {
                    const isSelected = stop.id === selectedStopId;

                    return (
                      <TouchableOpacity
                        key={stop.id}
                        activeOpacity={0.85}
                        onPress={() => {
                          setSelectedStopId(stop.id);
                          setSelectedGroupKey(activeGroup.groupKey);
                        }}
                      >
                        <StopListItem
                          sequenceNumber={stop.sequence_number}
                          customerName={stop.customer_name}
                          address={stop.address}
                          items={[]}
                          status={isSelected ? "current" : "pending"}
                          isActive={isSelected}
                          pulse={isSelected}
                          showNearbyTag={isSelected}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedStop && (
                  <View className="mt-4">
                    <NextStopCard
                      stopNumber={selectedStop.sequence_number}
                      customerName={selectedStop.customer_name}
                      address={selectedStop.address}
                      items={[]}
                      orderId={selectedStop.order ?? ""}
                      disabled={!canActivateCard || !routeAvailable}
                      onMarkDelivered={handleMarkDelivered}
                      onMarkUndelivered={handleMarkUndelivered}
                    />
                  </View>
                )}
              </>
            ) : (
              <View className="mt-4 rounded-3xl border border-border-default bg-white p-4">
                <Text variant="body" color="muted" weight="medium">
                  {routeAvailable ? "No active customer in geofence" : "No route assigned for today"}
                </Text>
                <Text variant="body-sm" color="muted" className="mt-1">
                  {routeAvailable
                    ? "Move closer to a stop to activate delivery actions."
                    : "Trip toggle and customer actions are disabled until a route is assigned."}
                </Text>
              </View>
            )}

            <Button
              className="mt-6"
              label="Show all Customers"
              intent="secondary"
              fullWidth
              size="lg"
              disabled={!routeAvailable}
              onPress={() => {
                if (!routeAvailable) return;
                bottomSheetRef.current?.close();
                setTimeout(() => {
                  router.push(ROUTES.DRIVER.ALL_CUSTOMERS as any);
                }, 150);
              }}
            />
          </BottomSheetScrollView>
        </BottomSheetModal>
      </SafeAreaView>
    </>
  );
}
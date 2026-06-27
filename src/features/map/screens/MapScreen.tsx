

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, TouchableOpacity as RNTouchableOpacity } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { buildUrl } from "@/services/api/buildUrl";
import { httpClient } from "@/services/api/httpClient";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import OSMMap, { OSMMapHandle } from "../components/OSMMap";
import { useAuthStore } from "@store/authStore";
import { useTrackingStore } from "@store/trackingStore";
import { useGeofenceStore } from "@store/geofenceStore";
import TripStatusBanner from "@/features/map/components/TripStatusBanner";
import TripStartPrompt from "@/features/map/components/TripStartPrompt";
import RouteStatRow from "@/features/map/components/RouteStatRow";
import NextStopCard from "@/features/map/components/NextStopCard";
import StopListItem from "@/features/map/components/StopListItem";
import { Text } from "@/shared/ui/Text/Text";
import { ROUTES } from "@/constants/route";
import { Button } from "@/shared/ui";
import * as Location from "expo-location";

type RouteStop = {
  id: string;
  sequence_number: number;
  order: string | null;
  customer_name: string;
  customer_phone?: string;
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
  const lastSnappedGroupKey = useRef<string | null>(null);
  const insets = useSafeAreaInsets();
  const { selectStopId } = useLocalSearchParams<{ selectStopId?: string }>();

  const isTripStarted = useTrackingStore((s) => s.isTripStarted);
  const trackingLoading = useTrackingStore((s) => s.loading);
  const canStopTrip = useTrackingStore((s) => s.canStopTrip);

  const route = useGeofenceStore((s) => s.route);
  const nearStopId = useGeofenceStore((s) => s.nearStopId);
  const activeStopId = useGeofenceStore((s) => s.activeStopId);
  const selectedStopId = useGeofenceStore((s) => s.selectedStopId);
  const setActiveStopId = useGeofenceStore((s) => s.setActiveStopId);
  const setSelectedStopId = useGeofenceStore((s) => s.setSelectedStopId);
  const startGeofenceTracking = useGeofenceStore((s) => s.startGeofenceTracking);
  const canMark = useGeofenceStore((s) => s.canMarkActiveStopDelivered());

  const navigationStopId = useGeofenceStore((s) => s.navigationStopId);
  const navigationPolyline = useGeofenceStore((s) => s.navigationPolyline);
  const fetchNavigationPolyline = useGeofenceStore((s) => s.fetchNavigationPolyline);

  const routeAvailable = !!route;
  const domainName = useAuthStore((s) => s.domain_name) || "";
  const [summary, setSummary] = useState<{
    total_bottles_to_carry: number;
    special_orders: number;
    total_bottles_to_collect: number;
    delivered_orders: number;
    pending_orders: number;
    undelivered_orders: number;
  } | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!domainName) return;
    try {
      const url = buildUrl(domainName, "/api/orders/driver/today-summary/");
      const data = await httpClient.get(url);
      setSummary(data as any);
    } catch (e) {
      console.warn("Failed to fetch driver summary in map:", e);
    }
  }, [domainName]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const [selectedGroupKey, setSelectedGroupKey] = React.useState<string | null>(null);
  const [expandedGroupKey, setExpandedGroupKey] = React.useState<string | null>(null);

  const routeStops = useMemo(() => {
    return (route?.stops ?? []).filter(
      (stop) => stop.order_status === "in_transit"
    ) as RouteStop[];
  }, [route?.stops]);

  const allStopsFinished = useMemo(() => {
    if (!route?.stops?.length) return false;
    return route.stops.every(
      (stop) => stop.order_status === "delivered" || stop.order_status === "undelivered"
    );
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
    if (!group || group.stops.length === 0) return null;

    const exactMatch = group.stops.find((s) => s.id === selectedStopId);
    if (exactMatch) return exactMatch;

    return group.stops[0] ?? null;
  }, [groupedStops, selectedGroupKey, selectedStopId]);

  const selectedGroup = useMemo(() => {
    if (!selectedGroupKey) return null;
    return groupedStops.find((g) => g.groupKey === selectedGroupKey) ?? null;
  }, [groupedStops, selectedGroupKey]);

  // const showNextStopCard = !!selectedGroup && selectedGroup.stops.length > 0;
  const showNextStopCard = !!selectedGroup && selectedGroup.stops.length > 0 && !!nearStopId;

  const snapPoints = useMemo(() => ["28%", "50%", "90%"], []);
  const cardYPositions = useRef<Record<string, number>>({});

  const canActivateCard =
    !!selectedStop &&
    !!selectedGroup &&
    !!selectedStop.order &&
    selectedStop.order_status === "in_transit";

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      if (!mounted) return;
      await startGeofenceTracking();
    };

    start();

    return () => {
      mounted = false;
      useGeofenceStore.getState().stopGeofenceTracking();
    };
  }, [startGeofenceTracking]);

  useEffect(() => {
    if (!route) return;

    if (selectStopId) {
      const stop = route.stops?.find((s) => s.id === selectStopId);
      if (stop) {
        const key = getLocationKey(stop.latitude, stop.longitude);
        setSelectedGroupKey(key);
        setSelectedStopId(stop.id);

        if (typeof stop.latitude === "number" && typeof stop.longitude === "number") {
          setTimeout(() => {
            mapRef.current?.zoomToStop(stop.latitude, stop.longitude);
          }, 400);
        }
        return;
      }
    }

    const firstTransit = route.stops?.find((s) => s.order_status === "in_transit") ?? null;
    if (firstTransit && !selectedGroupKey) {
      const key = getLocationKey(firstTransit.latitude, firstTransit.longitude);
      setSelectedGroupKey(key);
      setSelectedStopId(firstTransit.id);
    }
  }, [route, selectedGroupKey, selectStopId, setSelectedStopId]);

  useEffect(() => {
    if (!nearStopId) {
      setActiveStopId(null);
      lastSnappedGroupKey.current = null;

      if (selectedGroupKey) {
        const existingGroup = groupedStops.find((g) => g.groupKey === selectedGroupKey);

        if (existingGroup && existingGroup.stops.length > 0) {
          const nextStopInGroup =
            existingGroup.stops.find((s) => s.id === selectedStopId) ??
            existingGroup.stops[0];

          setSelectedStopId(nextStopInGroup?.id ?? null);

          if (existingGroup.stops.length > 1) {
            setExpandedGroupKey(existingGroup.groupKey);
          } else {
            setExpandedGroupKey(null);
          }
        } else {
          setSelectedStopId(null);
          setSelectedGroupKey(null);
          setExpandedGroupKey(null);
        }
      } else {
        setSelectedStopId(null);
        setExpandedGroupKey(null);
      }

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
      } else {
        setExpandedGroupKey(null);
      }

      // Only present and snap the bottom sheet if we just entered a NEW geofence group!
      if (lastSnappedGroupKey.current !== key) {
        bottomSheetRef.current?.present();
        bottomSheetRef.current?.snapToIndex(1);
        lastSnappedGroupKey.current = key;
      }
    }

    const yOffset = cardYPositions.current[nearStopId];
    if (yOffset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  }, [
    nearStopId,
    route?.stops,
    groupedStops,
    selectedGroupKey,
    selectedStopId,
    setActiveStopId,
    setSelectedStopId,
  ]);

  useFocusEffect(
    useCallback(() => {
      fetchSummary();
      const currentRoute = useGeofenceStore.getState().route;
      const inTransitStops = (currentRoute?.stops ?? []).filter(
        (s) => s.order_status === "in_transit"
      ) as RouteStop[];

      if (!inTransitStops.length) {
        setSelectedStopId(null);
        setSelectedGroupKey(null);
        setExpandedGroupKey(null);
        setActiveStopId(null);
        return;
      }

      if (selectedGroupKey) {
        const existingGroup = groupedStops.find((g) => g.groupKey === selectedGroupKey);

        if (existingGroup && existingGroup.stops.length > 0) {
          const nextStop: RouteStop | null =
            existingGroup.stops.find((s) => s.id === selectedStopId) ??
            existingGroup.stops[0] ??
            null;

          setSelectedStopId(nextStop?.id ?? null);

          if (existingGroup.stops.length > 1) {
            setExpandedGroupKey(existingGroup.groupKey);
          } else {
            setExpandedGroupKey(null);
          }
        }
      }

      let fallbackStop: RouteStop | null = null;

      if (nearStopId) {
        fallbackStop = inTransitStops.find((s) => s.id === nearStopId) ?? null;
      }

      if (!fallbackStop) {
        fallbackStop = inTransitStops[0] ?? null;
      }

      if (!fallbackStop) {
        setSelectedStopId(null);
        setSelectedGroupKey(null);
        setExpandedGroupKey(null);
        setActiveStopId(null);
        return;
      }

      const fallbackKey = getLocationKey(
        fallbackStop.latitude,
        fallbackStop.longitude
      );

      setSelectedGroupKey(fallbackKey);
      setSelectedStopId(fallbackStop.id);
      setActiveStopId(nearStopId ?? null);

      const fallbackGroup = groupedStops.find((g) => g.groupKey === fallbackKey);
      if (fallbackGroup && fallbackGroup.stops.length > 1) {
        setExpandedGroupKey(fallbackKey);
      } else {
        setExpandedGroupKey(null);
      }
    }, [
      groupedStops,
      nearStopId,
      selectedGroupKey,
      selectedStopId,
      setActiveStopId,
      setSelectedStopId,
      fetchSummary,
    ])
  );
  useEffect(() => {
    let headingSub: Location.LocationSubscription | null = null;
    let mounted = true;

    const startHeadingTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || !mounted) return;

      headingSub = await Location.watchHeadingAsync((headingData) => {
        const heading =
          typeof headingData.trueHeading === "number" && headingData.trueHeading >= 0
            ? headingData.trueHeading
            : headingData.magHeading;

        if (typeof heading === "number") {
          mapRef.current?.updateDriverHeading(heading);
        }
      });
    };

    startHeadingTracking();

    return () => {
      mounted = false;
      headingSub?.remove();
    };
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

  const waitForLocationAndFetchRoute = useCallback(() => {
    const MAX_ATTEMPTS = 20;
    let attempts = 0;

    const interval = setInterval(() => {
      attempts++;
      const location = useGeofenceStore.getState().location;

      if (location) {
        clearInterval(interval);

        const { route } = useGeofenceStore.getState();
        if (route?.stops?.length) {
          const inTransit = route.stops.filter((s) => s.order_status === "in_transit");
          if (inTransit.length) {
            let closest = inTransit[0];
            let minDist = Infinity;

            for (const stop of inTransit) {
              const d = Math.sqrt(
                Math.pow(stop.latitude - location.lat, 2) +
                Math.pow(stop.longitude - location.lng, 2)
              );
              if (d < minDist) {
                minDist = d;
                closest = stop;
              }
            }

            useGeofenceStore.getState().setActiveStopId(closest.id);
            useGeofenceStore.setState((s) => ({
              ...s,
              navigationStopId: closest.id,
            }));
            useGeofenceStore.getState().fetchNavigationPolyline();
          }
        }
      }

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(interval);
        fetchNavigationPolyline();
      }
    }, 500);
  }, [fetchNavigationPolyline]);

  const handleTripToggle = async () => {
    const { accessToken } = useAuthStore.getState();
    const {
      isTripStarted: tripStarted,
      startTrip,
      stopTrip,
      connectSocket,
      startTracking,
      canStopTrip: canEndTrip,
      loading,
    } = useTrackingStore.getState();

    if (!accessToken || loading) return;
    if (!routeAvailable) return;

    if (tripStarted) {
      if (!allStopsFinished) return;
      await stopTrip();
      return;
    }

    const ok = await startTrip();
    if (ok) {
      const { domain_name } = useAuthStore.getState();
      if (domain_name) connectSocket(domain_name);
      await startTracking();
      waitForLocationAndFetchRoute();
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
        orderId: selectedStop.order,
        customerName: selectedStop.customer_name,
        deliveryDate: route.delivery_date ?? "",
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

  const formattedRouteName = useMemo(() => {
    const rawName = route?.name;
    if (!rawName) return "Today's Route";

    const formatDate = (dateStr: string) => {
      const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (!match) return dateStr;
      const [_, y, m, d] = match;
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const monthName = months[parseInt(m, 10) - 1];
      if (!monthName) return dateStr;
      return `${parseInt(d, 10)} ${monthName} ${y}`;
    };

    const parts = rawName.split(/\s*[-|/]\s*/).map(p => p.trim()).filter(Boolean);

    if (parts.length >= 3) {
      const area = parts[0];
      const datePart = parts[parts.length - 1];
      const cleanDate = datePart.split("#")[0].trim();
      return `${area} - ${formatDate(cleanDate)}`;
    } else if (parts.length === 2) {
      const area = parts[0];
      const cleanDate = parts[1].split("#")[0].trim();
      return `${area} - ${formatDate(cleanDate)}`;
    }

    return formatDate(rawName.split("#")[0].trim());
  }, [route?.name]);

  const completedCount =
    route?.stops?.filter((s) => s.order_status === "delivered").length ?? 0;

  return (
    <ScreenWrapper
      disablePadding
    >
      <View className="absolute inset-0">
        <OSMMap
          ref={mapRef}
          stops={route?.stops ?? []}
          activeStopId={activeStopId}
          selectedStopId={selectedStopId}
          navigationStopId={navigationStopId}
          navigationPolyline={navigationPolyline}
        />
      </View>

      <TripStatusBanner
        routeName={formattedRouteName}
        completed={completedCount}
        total={route?.stops?.length ?? 0}
        // eta="1h 24m"
        isTripStarted={isTripStarted}
        loading={trackingLoading}
        onToggle={handleTripToggle}
        disabled={isTripStarted ? !allStopsFinished : !routeAvailable}
        navigationStopName={
          navigationStopId
            ? route?.stops?.find((s) => s.id === navigationStopId)?.customer_name ?? null
            : null
        }
        navigationStopAddress={
          navigationStopId
            ? route?.stops?.find((s) => s.id === navigationStopId)?.address ?? null
            : null
        }
        onRefreshRoute={fetchNavigationPolyline}
      />

      <View className="absolute bottom-32 right-4 z-20 items-end gap-y-3">
        <RNTouchableOpacity
          onPress={openSheet}
          className="h-14 w-14 items-center justify-center rounded-full bg-brand-primary shadow-lg"
        >
          <Ionicons name="list" size={22} color="white" />
        </RNTouchableOpacity>

        <RNTouchableOpacity
          onPress={() => router.push(ROUTES.DRIVER.QR_SCANNER as any)}
          className="h-14 w-14 items-center justify-center rounded-full bg-brand-primary shadow-lg"
        >
          <Ionicons name="qr-code-outline" size={22} color="#fff" />
        </RNTouchableOpacity>

        <RNTouchableOpacity
          onPress={() => mapRef.current?.centerOnUser()}
          className="h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg"
        >
          <Ionicons name="locate" size={22} color="#1B5E37" />
        </RNTouchableOpacity>
      </View>

      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={0}
        topInset={insets.top}
        bottomInset={insets.bottom}
        enablePanDownToClose
        backdropComponent={backDrop}
        animateOnMount
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
              { icon: "water-outline", label: "Bottles", value: summary ? String(summary.total_bottles_to_carry) : "0", color: "#1B5E37" },
              { icon: "restaurant-outline", label: "Special", value: summary ? String(summary.special_orders) : "0", color: "#D4872A" },
              { icon: "return-down-back", label: "Returns", value: summary ? String(summary.total_bottles_to_collect) : "0", color: "#4A4A4A" },
              { icon: "time-outline", label: "Pending", value: summary ? String(summary.pending_orders) : "0", color: "#D4872A" },
            ]}
          />

          {showNextStopCard && selectedGroup ? (
            <>
              <View className="mt-4 rounded-3xl border border-border-default bg-white p-4">
                <Text variant="body" weight="semibold" color="primary">
                  Active Customer Group
                </Text>
                <Text variant="body-sm" color="muted" className="mt-1">
                  {selectedGroup.stops.length} customer
                  {selectedGroup.stops.length > 1 ? "s" : ""} at the same location
                </Text>
              </View>

              <View className="mt-4 gap-y-3">
                {selectedGroup.stops.map((stop) => {
                  const isSelected = stop.id === selectedStopId;

                  return (
                    <TouchableOpacity
                      key={stop.id}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedStopId(stop.id);
                        setSelectedGroupKey(selectedGroup.groupKey);
                        setActiveStopId(stop.id);
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
                    customerPhone={selectedStop.customer_phone}
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
            className="mt-6 bg-[#D1E0D6] active:bg-[#B8CFC0] border border-[#1B5E37]/15"
            label="Show all Customers"
            intent="secondary"
            fullWidth
            size="lg"
            leftIcon={<Ionicons name="people-outline" size={20} color="#1B5E37" />}
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
    </ScreenWrapper>
  );
}
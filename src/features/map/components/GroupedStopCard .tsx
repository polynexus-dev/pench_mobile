import React, { useEffect, useRef, useState } from "react";
import { Animated, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StopListItem } from "@/features/map/components/StopListItem";

type RouteStop = {
  id: string;
  sequence_number: number;
  order: string | null;
  customer_name: string;
  address: string;
  latitude: number;
  longitude: number;
  order_status?: string;
};

type GroupedStop = {
  groupKey: string;
  address: string;
  stops: RouteStop[];
};

type Props = {
  group: GroupedStop;
  activeStopId: string | null;
  nearStopId: string | null;
  isActiveGroup?: boolean;
  onSelectStop: (stopId: string, groupKey: string) => void;
};

export function GroupedStopCard({
  group,
  activeStopId,
  nearStopId,
  onSelectStop,
  isActiveGroup
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const firstStop = group.stops[0];
  const isCurrentGroup = group.stops.some((s) => s.id === activeStopId);
  const isNearGroup = group.stops.some((s) => s.id === nearStopId);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [expanded, anim]);

  const contentScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1],
  });

  const contentOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const maxHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, group.stops.length * 140 + 24],
  });

  return (
    <View className={`mb-3 overflow-hidden rounded-3xl ${isActiveGroup ? "bg-[#E8F5E9] border border-[#1B5E37]" : "bg-white"}`}>
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between px-4 py-4"
        activeOpacity={0.85}
      >
        <View className="flex-1 pr-3">
          <View className="flex-row items-start gap-3">
            <Ionicons
              name={isCurrentGroup ? "radio-button-on" : isNearGroup ? "location" : "business-outline"}
              size={18}
              color={isCurrentGroup ? "#1B5E37" : isNearGroup ? "#D4872A" : "#4A4A4A"}
              style={{ marginTop: 2 }}
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <View className="flex-1">
                  <View />
                </View>
              </View>
            </View>
          </View>

          <View className="mt-2">
            <View />
          </View>
        </View>

        <Animated.View
          style={{
            transform: [{ rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }],
          }}
        >
          <Ionicons name="chevron-down" size={20} color="#1B5E37" />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={{
          maxHeight,
          opacity: contentOpacity,
          transform: [{ scaleY: contentScale }],
          overflow: "hidden",
        }}
      >
        <View className="px-4 pb-4">
          <View className="gap-y-2">
            {group.stops.map((stop) => (
              <View key={stop.id}>
                <StopListItem
                  sequenceNumber={stop.sequence_number}
                  customerName={stop.customer_name}
                  address={stop.address}
                  items={[]}
                  status={stop.id === activeStopId ? "current" : "pending"}
                  isNear={stop.id === nearStopId}
                  isActive={stop.id === activeStopId}
                  onPress={() => onSelectStop(stop.id, group.groupKey)}
                />
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
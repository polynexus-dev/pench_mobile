import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";

export function CalendarSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const daysOfWeek = Array.from({ length: 7 });
  const gridRows = Array.from({ length: 5 });

  return (
    <View
      className="mb-4 rounded-2xl bg-white p-4 border border-gray-100"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      {/* Header placeholder */}
      <View className="flex-row justify-between items-center mb-6">
        <Animated.View style={{ opacity: pulseAnim }} className="h-6 w-6 rounded bg-gray-200" />
        <Animated.View style={{ opacity: pulseAnim }} className="h-6 w-32 rounded bg-gray-200" />
        <Animated.View style={{ opacity: pulseAnim }} className="h-6 w-6 rounded bg-gray-200" />
      </View>

      {/* Days of the week row */}
      <View className="flex-row justify-between mb-4">
        {daysOfWeek.map((_, idx) => (
          <Animated.View
            key={idx}
            style={{ opacity: pulseAnim }}
            className="h-3 w-8 rounded bg-gray-200"
          />
        ))}
      </View>

      {/* Calendar grid rows */}
      <View className="gap-y-4">
        {gridRows.map((_, rowIdx) => (
          <View key={rowIdx} className="flex-row justify-between">
            {daysOfWeek.map((_, colIdx) => (
              <Animated.View
                key={colIdx}
                style={{ opacity: pulseAnim }}
                className="h-8 w-8 rounded-full bg-gray-200"
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

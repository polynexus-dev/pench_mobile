import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/shared/ui/Text/Text";

type StopStatus = "current" | "pending" | "completed";

type Props = {
  sequenceNumber: number;
  customerName: string;
  address: string;
  items: any[];
  status: StopStatus;
  isNear?: boolean;
  isActive?: boolean;
  isHighlighted?: boolean;
  pulse?: boolean;
  showNearbyTag?: boolean;
  onPress?: () => void;
};

export function StopListItem({
  sequenceNumber,
  customerName,
  address,
  items = [],
  status,
  isNear = false,
  isActive = false,
  isHighlighted = false,
  pulse = false,
  showNearbyTag = false,
  onPress,
}: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;

    if (pulse) {
      pulseAnim.setValue(1);
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }

    return () => {
      anim?.stop();
    };
  }, [pulse, pulseAnim]);

  const isCompleted = status === "completed";
  const isSelected = isActive || isHighlighted;

  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress
    ? { onPress, activeOpacity: 0.9 as const }
    : {};

  return (
    <Animated.View
      style={{ transform: [{ scale: pulse ? pulseAnim : 1 }] }}
      className={`mb-3 rounded-3xl border p-4 shadow-sm ${
        isSelected
          ? "border-brand-primary bg-brand-light"
          : isCompleted
            ? "border-border-default bg-bg-card opacity-70"
            : "border-border-default bg-bg-card"
      }`}
    >
      <Container {...containerProps}>
        <View className="flex-row items-start justify-between">
          <View className="flex-row flex-1 items-center gap-x-3 pr-2">
            <View
              className={`h-10 w-10 items-center justify-center rounded-full ${
                isCompleted
                  ? "bg-border-default"
                  : isSelected
                    ? "bg-brand-primary"
                    : "bg-brand-primary"
              }`}
            >
              {isCompleted ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Text variant="caption" color="inverse" weight="bold">
                  {sequenceNumber}
                </Text>
              )}
            </View>

            <View className="flex-1">
              <Text
                variant="body"
                color="primary"
                weight="semibold"
                lines={1}
              >
                {customerName}
              </Text>

              <Text variant="body-sm" color="muted" lines={1} className="mt-0.5">
                {address}
              </Text>

              {items.length > 0 && (
                <View className="mt-2 flex-row flex-wrap gap-1">
                  {items.map((item) => (
                    <View key={item} className="rounded-full bg-bg-input px-2 py-1">
                      <Text variant="caption" color="secondary">
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {showNearbyTag && isSelected && (
            <View className="rounded-full bg-success px-3 py-1">
              <Text variant="caption" color="inverse" weight="semibold">
                Nearby
              </Text>
            </View>
          )}
        </View>
      </Container>
    </Animated.View>
  );
}
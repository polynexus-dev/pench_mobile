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

export default function StopListItem({
  sequenceNumber,
  customerName,
  address,
  items = [],
  status,
  // isNear = false,
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
      className={`mb-3 rounded-[20px] border p-4 shadow-sm ${
        isSelected
          ? "border-brand-primary bg-brand-light"
          : isCompleted
            ? "border-border-subtle bg-bg-card opacity-70"
            : "border-border-subtle bg-bg-card"
      }`}
    >
      <Container {...containerProps}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row flex-1 items-center gap-x-3.5 pr-2">
            <View
              className={`h-9 w-9 items-center justify-center rounded-full shadow-xs ${
                isCompleted
                  ? "bg-neutral-100"
                  : isSelected
                    ? "bg-brand-primary"
                    : "bg-brand-light"
              }`}
            >
              {isCompleted ? (
                <Ionicons name="checkmark-sharp" size={16} color="#1B5E37" />
              ) : (
                <Text
                  variant="body-sm"
                  weight="bold"
                  color={isSelected ? "inverse" : "brand"}
                >
                  {sequenceNumber}
                </Text>
              )}
            </View>

            <View className="flex-1">
              <Text
                variant="body"
                color="primary"
                weight="bold"
                lines={1}
              >
                {customerName}
              </Text>

              <Text variant="caption" color="secondary" lines={1} className="mt-1">
                {address}
              </Text>

              {items.length > 0 && (
                <View className="mt-2.5 flex-row flex-wrap gap-1">
                  {items.map((item) => (
                    <View key={item} className="rounded-full bg-bg-input px-2.5 py-0.5">
                      <Text variant="caption-sm" color="secondary" weight="semibold">
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {showNearbyTag && isSelected && (
            <View className="rounded-full bg-success px-2.5 py-0.5 border border-success/15 shadow-xs">
              <Text variant="caption-sm" color="inverse" weight="bold" className="text-[10px] uppercase tracking-wider">
                Nearby
              </Text>
            </View>
          )}
        </View>
      </Container>
    </Animated.View>
  );
}
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  fetchGuestCities,
  FALLBACK_GUEST_CITIES,
  type GuestCity,
} from "@/constants/guestTenants";

interface GuestCityPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: GuestCity) => void;
}

/**
 * Asks a guest which city they are shopping in. The catalog is tenant-scoped, so
 * this is the guest equivalent of the `domain_name` a login response returns.
 *
 * When the backend reports a single city — the case in production today — the
 * question is meaningless, so it is answered automatically and the guest goes
 * straight to the catalog.
 */
export function GuestCityPicker({
  visible,
  onClose,
  onSelect,
}: GuestCityPickerProps) {
  const insets = useSafeAreaInsets();
  const [cities, setCities] = React.useState<GuestCity[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Re-read on each open so a newly launched city shows up without a reinstall
  React.useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    setLoading(true);

    fetchGuestCities()
      .catch(() => FALLBACK_GUEST_CITIES)
      .then((list) => {
        if (cancelled) return;
        setLoading(false);

        // One city is not a choice — don't make the user tap through it
        if (list.length === 1) {
          onSelect(list[0]);
          return;
        }
        setCities(list);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, onSelect]);

  const showList = !loading && !!cities && cities.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          className="bg-white rounded-t-[28px] px-5 pt-5"
        >
          <View className="items-center mb-1">
            <View className="h-1 w-10 rounded-full bg-gray-200 mb-4" />
          </View>

          <View className="flex-row items-start justify-between mb-1">
            <View className="flex-1 pr-3">
              <Text className="text-[20px] font-black text-[#1A1A1A]">
                Where are you shopping?
              </Text>
              <Text className="text-[13px] font-medium text-[#757575] mt-1.5 leading-5">
                Pick your city to see the products we deliver there. You can browse
                freely — we&apos;ll only ask you to sign in when you order.
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={10}
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="close" size={18} color="#4A4A4A" />
            </TouchableOpacity>
          </View>

          {loading && (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color="#1B5E37" />
            </View>
          )}

          {showList && (
            <View className="mt-5 gap-y-2.5">
              {cities!.map((city) => (
                <TouchableOpacity
                  key={city.value}
                  activeOpacity={0.85}
                  onPress={() => onSelect(city)}
                  className="flex-row items-center justify-between rounded-2xl border border-[#E6EAE8] bg-white px-4 py-4"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-[#E8F5EE] mr-3">
                      <Ionicons name="location-outline" size={18} color="#1B5E37" />
                    </View>
                    <Text className="text-[15px] font-bold text-[#1A1A1A]">
                      {city.label}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default GuestCityPicker;

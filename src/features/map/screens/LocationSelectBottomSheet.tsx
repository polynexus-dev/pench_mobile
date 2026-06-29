import React, { useCallback, useMemo, useRef, useState, useEffect, forwardRef } from "react";
import { View, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Text } from "@/shared/ui/Text/Text";
import { Button } from "@/shared/ui/Button/Button";
import { Input } from "@/shared/ui";
import LocationSelectMap, { LocationSelectMapHandle } from "../components/LocationSelectMap";

type Props = {
  onClose: () => void;
  onConfirm: (location: { lat: number; lng: number; address: string; profile: string }) => void;
  onSkip: () => void;
};

// Default coordinates: Nagpur, Maharashtra
const DEFAULT_LAT = 21.1458;
const DEFAULT_LNG = 79.0882;

export const LocationSelectBottomSheet = forwardRef<BottomSheetModal, Props>(
  function LocationSelectBottomSheet({ onClose, onConfirm, onSkip }, ref) {
    const mapRef = useRef<LocationSelectMapHandle>(null);
    const snapPoints = useMemo(() => ["95%"], []);
    const { height: WINDOW_HEIGHT } = Dimensions.get("window");

    const [locating, setLocating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [address, setAddress] = useState("Tap detect location or pin on the map");
    const [coords, setCoords] = useState<{ lat: number; lng: number }>({
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
    });
    const [hasPinned, setHasPinned] = useState(false);
    const [profileType, setProfileType] = useState<"Home" | "Work" | "Other">("Home");
    const [flatNo, setFlatNo] = useState("");
    const [floorNo, setFloorNo] = useState("");
    const [buildingName, setBuildingName] = useState("");
    const [landmark, setLandmark] = useState("");

    // Handle reverse geocoding to update address
    const fetchAddress = async (lat: number, lng: number) => {
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geo && geo.length > 0) {
          const a = geo[0];
          const parts = [
            a.name,
            a.street,
            a.district,
            a.district, // fallback district repeat removal can happen, parts holds standard list
            a.city,
            a.region,
            a.postalCode,
          ].filter(Boolean);
          // Simple unique array filter to prevent duplicates
          const uniqueParts = parts.filter((item, index) => parts.indexOf(item) === index);
          setAddress(uniqueParts.join(", ") || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } else {
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      } catch (e) {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    };

    const handleLocationChange = (lat: number, lng: number) => {
      setCoords({ lat, lng });
      setHasPinned(true);
      fetchAddress(lat, lng);
    };

    const handleDetectLocation = async () => {
      setLocating(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          alert("Location permission is required to detect your location.");
          return;
        }

        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = pos.coords;

        setCoords({ lat: latitude, lng: longitude });
        setHasPinned(true);
        mapRef.current?.zoomToLocation(latitude, longitude);
        await fetchAddress(latitude, longitude);
      } catch (err: any) {
        alert("Failed to detect location: " + (err?.message || "Unknown error"));
      } finally {
        setLocating(false);
      }
    };

    const handleConfirm = async () => {
      if (!hasPinned) {
        alert("Please select or detect your location before confirming.");
        return;
      }
      if (!flatNo.trim()) {
        alert("Please enter your Flat / House / Plot Number.");
        return;
      }
      if (!buildingName.trim()) {
        alert("Please enter your Building / Apartment / Block Name.");
        return;
      }

      setSaving(true);
      try {
        let completeAddress = "";
        if (flatNo.trim()) completeAddress += `${flatNo.trim()}, `;
        if (floorNo.trim()) {
          const fl = floorNo.trim().toLowerCase();
          if (fl.includes("floor") || fl.includes("flr")) {
            completeAddress += `${floorNo.trim()}, `;
          } else {
            completeAddress += `${floorNo.trim()} Floor, `;
          }
        }
        if (buildingName.trim()) completeAddress += `${buildingName.trim()}, `;
        if (landmark.trim()) completeAddress += `(Near ${landmark.trim()}), `;
        completeAddress += address;

        await onConfirm({ lat: coords.lat, lng: coords.lng, address: completeAddress, profile: profileType });
        if (ref && "current" in ref && ref.current) {
          ref.current.dismiss();
        }
      } finally {
        setSaving(false);
      }
    };

    const handleSheetChange = (index: number) => {
      if (index >= 0) {
        handleDetectLocation();
      }
    };

    const handleInternalClose = () => {
      if (ref && "current" in ref && ref.current) {
        ref.current.dismiss();
      }
      onClose();
    };

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        onDismiss={onClose}
        onChange={handleSheetChange}
        enablePanDownToClose
        enableContentPanningGesture={false}
        backgroundStyle={{ backgroundColor: "#FDFDFD" }}
        handleIndicatorStyle={{ backgroundColor: "#CCCCCC" }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <BottomSheetScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Header Block */}
          <View className="px-4 pb-3 pt-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-[18px] font-black text-gray-900">
                  Set Delivery Location
                </Text>
                <Text className="text-[12px] font-medium text-gray-500 mt-0.5">
                  Pin your delivery address accurately on the map
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleInternalClose}
                className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleDetectLocation}
              className="mt-3.5 flex-row items-center justify-center rounded-xl bg-[#0C5A35] py-3 px-4 shadow-sm active:opacity-90"
            >
              {locating ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="locate-outline" size={18} color="#ffffff" />
                  <Text className="ml-2 text-[14px] font-bold text-white uppercase tracking-wider">
                    Detect Live Location
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Map Block (Housed inside a distinct card container component with horizontal margin and rounded corners) */}
          <View className="px-4 mb-4">
            <View 
              style={{ height: WINDOW_HEIGHT * 0.38, overflow: "hidden" }} 
              className="rounded-3xl border border-gray-100 bg-gray-50 shadow-sm"
            >
              <LocationSelectMap
                ref={mapRef}
                initialLat={coords.lat}
                initialLng={coords.lng}
                onLocationChange={handleLocationChange}
              />
            </View>
          </View>

          {/* Form and Address Fields Block */}
          <View className="px-4">
            <View className="mb-4 rounded-xl bg-gray-50 border border-gray-200/50 px-4 py-3 flex-row items-start gap-2.5">
              <Ionicons name="location-outline" size={18} color="#0C5A35" style={{ marginTop: 2 }} />
              <Text className="text-[13px] font-semibold text-gray-700 leading-normal flex-1" numberOfLines={2}>
                {address}
              </Text>
            </View>

            {/* Address Details Fields */}
            <View className="mb-5 gap-y-3">
              <View className="flex-row gap-x-3">
                <View className="flex-1">
                  <Input
                    label="Flat / House / Plot No.*"
                    placeholder="e.g. Flat 302"
                    value={flatNo}
                    onChangeText={setFlatNo}
                    autoCapitalize="words"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Floor No. (optional)"
                    placeholder="e.g. 3rd Floor"
                    value={floorNo}
                    onChangeText={setFloorNo}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <Input
                label="Building / Block / Apartment Name*"
                placeholder="e.g. Marvel Heights"
                value={buildingName}
                onChangeText={setBuildingName}
                autoCapitalize="words"
              />

              <Input
                label="Landmark / Nearby (optional)"
                placeholder="e.g. Near Gandhi Park"
                value={landmark}
                onChangeText={setLandmark}
                autoCapitalize="words"
              />
            </View>

            {/* Location Profile Chips */}
            <Text className="mb-2 text-[12px] font-black text-gray-800 uppercase tracking-wider">
              Save location as
            </Text>
            <View className="flex-row gap-2 mb-6">
              {(["Home", "Work", "Other"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setProfileType(type)}
                  className={`flex-1 py-2.5 rounded-xl border items-center ${
                    profileType === type
                      ? "bg-[#0C5A35]/10 border-[#0C5A35]"
                      : "bg-gray-50 border-gray-200/60"
                  }`}
                >
                  <Text
                    className={`text-[12px] font-black ${
                      profileType === type ? "text-[#0C5A35]" : "text-gray-600"
                    }`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons Block (Now scrollable along with the form) */}
            <View className="flex-row gap-x-3 pt-2">
              <TouchableOpacity
                onPress={onSkip}
                className="flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white py-3.5 active:opacity-80"
              >
                <Text className="text-[14px] font-bold text-gray-600 uppercase tracking-wider">
                  Skip
                </Text>
              </TouchableOpacity>

              <View className="flex-1">
                <Button
                  label={saving ? "Saving…" : "Confirm Location"}
                  intent="primary"
                  size="lg"
                  disabled={saving}
                  loading={saving}
                  onPress={handleConfirm}
                  className="bg-[#0C5A35] rounded-xl py-3.5"
                />
              </View>
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

export default LocationSelectBottomSheet;

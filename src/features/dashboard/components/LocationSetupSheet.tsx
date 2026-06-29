import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import MapView, { Marker, Region } from "react-native-maps";
import { Text } from "@/shared/ui/Text/Text";
import { Button } from "@/shared/ui/Button/Button";
import tokens from "@/shared/theme/tokens";

type Props = {
    visible: boolean;
    onClose: () => void;
    onConfirm: (location: { lat: number; lng: number; address: string }) => void;
    onSkip: () => void;
};

export function LocationSetupSheet({ visible, onClose, onConfirm, onSkip }: Props) {
    const sheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["95%"], []);
    const [locating, setLocating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [address, setAddress] = useState("Tap detect location or pick on map");
    const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
    const [region, setRegion] = useState<Region>({
        latitude: 21.1458,
        longitude: 79.0882,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });

    const handleClose = useCallback(() => {
        sheetRef.current?.close();
        onClose();
    }, [onClose]);

    const handleDetectLocation = async () => {
        setLocating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = pos.coords;

            setRegion({
                latitude,
                longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            });
            setMarker({ latitude, longitude });

            const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
            const a = geo[0];
            setAddress([a?.name, a?.street, a?.city].filter(Boolean).join(", ") || `${latitude}, ${longitude}`);
        } finally {
            setLocating(false);
        }
    };

    const handleMapPress = async (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setMarker({ latitude, longitude });
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        const a = geo[0];
        setAddress([a?.name, a?.street, a?.city].filter(Boolean).join(", ") || `${latitude}, ${longitude}`);
    };

    const handleConfirm = async () => {
        if (!marker) return;
        setSaving(true);
        onConfirm({ lat: marker.latitude, lng: marker.longitude, address });
        setSaving(false);
        handleClose();
    };

    if (!visible) return null;

    return (
        <BottomSheet ref={sheetRef} index={0} snapPoints={snapPoints} onClose={onClose}>
            <BottomSheetView className="flex-1 bg-bg-card">
                <View className="px-screen-x-md pb-4">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-3">
                            <Text className="text-heading text-text-primary">
                                Set Delivery Location
                            </Text>
                            <Text className="text-body-sm text-text-muted">
                                Detect or pin your address on the map
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={handleClose}
                            className="w-touch-min h-touch-min items-center justify-center rounded-full bg-bg-input"
                        >
                            <Ionicons name="close" size={20} color={tokens.Colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={handleDetectLocation}
                        className="mt-4 flex-row items-center justify-center rounded-btn bg-brand-primary px-btn-x py-btn-y"
                    >
                        {locating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="locate" size={18} color="#fff" />
                                <Text className="ml-2 text-text-inverse">
                                    Detect Location
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View className="flex-1 overflow-hidden">
                    <MapView
                        style={{ flex: 1 }}
                        region={region}
                        onRegionChangeComplete={setRegion}
                        onPress={handleMapPress}
                    >
                        {marker && <Marker coordinate={marker} />}
                    </MapView>
                </View>

                <View className="px-screen-x-md py-4">
                    <View className="mb-4 rounded-xl bg-bg-input px-4 py-3">
                        <Text className="text-body-sm text-text-primary" numberOfLines={2}>
                            {address}
                        </Text>
                    </View>

                    <View className="flex-row gap-x-3">
                        <TouchableOpacity
                            onPress={onSkip}
                            className="flex-1 items-center justify-center rounded-btn border border-border-default bg-bg-card px-btn-x py-btn-y"
                        >
                            <Text className="text-text-secondary" >
                                Skip
                            </Text>
                        </TouchableOpacity>

                        <View className="flex-1">
                            <Button
                                label={saving ? "Saving…" : "Confirm"}
                                intent="primary"
                                size="lg"
                                fullWidth
                                disabled={!marker || saving}
                                loading={saving}
                                onPress={handleConfirm}
                            />
                        </View>
                    </View>
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
}
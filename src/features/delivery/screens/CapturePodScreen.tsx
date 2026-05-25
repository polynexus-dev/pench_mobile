import React, { useEffect, useRef, useState } from "react";
import {
    View,
    TouchableOpacity,
    Alert,
    Image,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Text } from "@/shared/ui/Text/Text";
import { Button } from "@/shared/ui/Button/Button";
import { useAuthStore } from "@/store/authStore";
import { useSubmitUndelivered } from "../hooks/useSubmitUndelivered";
import * as ImageManipulator from "expo-image-manipulator";
import { useGeofenceStore } from "@store/geofenceStore";
import { ROUTES } from "@/constants/route";

export default function CapturePodScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const cameraRef = useRef<CameraView>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    const markStopUndelivered = useGeofenceStore((s) => s.markStopUndelivered);

    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const { domain_name } = useAuthStore((s) => s);
    const { mutateAsync: submitUndelivered, isPending } = useSubmitUndelivered();

    const [podLatitude] = useState("21.145800");
    const [podLongitude] = useState("79.088200");

    useEffect(() => {
        if (!permission?.granted) requestPermission();
    }, [permission, requestPermission]);

    const handleTakePhoto = async () => {
        try {
            setIsCapturing(true);

            const photo = await cameraRef.current?.takePictureAsync({
                quality: 0.7,
                skipProcessing: true,
            });

            if (!photo?.uri) {
                Alert.alert("Error", "Failed to capture photo");
                return;
            }

            const compressed = await ImageManipulator.manipulateAsync(
                photo.uri,
                [{ resize: { width: 1280 } }],
                { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
            );

            setPhotoUri(compressed.uri);
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Could not capture image");
        } finally {
            setIsCapturing(false);
        }
    };

    const handleRetake = () => setPhotoUri(null);


    const handleSubmit = async () => { 
        if (!domain_name || !orderId) {
            Alert.alert("Error", "Missing city or order id");
            return;
        }

        if (!photoUri) {
            Alert.alert("Error", "Please capture photo first");
            return;
        }

        const formData = new FormData();
        formData.append("pod_image", {
            uri: photoUri,
            name: `pod-${Date.now()}.jpg`,
            type: "image/jpeg",
        } as any);
        formData.append("pod_latitude", podLatitude);
        formData.append("pod_longitude", podLongitude);

        try {
            await submitUndelivered({ lastOrderId: orderId, payload: formData });
            markStopUndelivered(orderId);
            router.push(ROUTES.DRIVER.MAP as any);
        } catch {
            // handled in hook
        }
    };

    if (!permission) return <View className="flex-1 bg-black" />;

    if (!permission.granted) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-black px-5">
                <Text variant="heading" color="inverse" weight="bold">
                    Camera permission required
                </Text>
                <Text variant="body" color="inverse" className="mt-2 text-center">
                    Please allow camera access to capture proof of delivery attempt.
                </Text>

                <Button
                    label="Grant Permission"
                    intent="primary"
                    size="lg"
                    fullWidth
                    className="mt-6"
                    onPress={requestPermission}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
            <View className="flex-1">
                <View style={StyleSheet.absoluteFillObject}>
                    {!photoUri ? (
                        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
                    ) : (
                        <Image
                            source={{ uri: photoUri }}
                            style={{ flex: 1 }}
                            resizeMode="cover"
                        />
                    )}
                </View>

                <View className="absolute left-0 right-0 top-0 p-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="h-11 w-11 items-center justify-center rounded-full bg-black/50"
                    >
                        <Ionicons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View
                    className="absolute left-0 right-0 bottom-0 bg-bg-card px-4 pt-4"
                    style={{ paddingBottom: insets.bottom + 16 }}
                >
                    {!photoUri ? (
                        <>
                            <Text variant="body-sm" color="muted" className="text-center">
                                Capture POD photo at customer location
                            </Text>

                            <TouchableOpacity
                                onPress={handleTakePhoto}
                                disabled={isCapturing}
                                className="mt-4 h-16 items-center justify-center rounded-full bg-brand-primary"
                            >
                                {isCapturing ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Ionicons name="camera" size={26} color="#fff" />
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text variant="body-sm" color="muted" className="text-center">
                                Photo captured. Confirm to submit or retake.
                            </Text>

                            <View className="mt-4 gap-3">
                                <Button
                                    label="Retake"
                                    intent="secondary"
                                    size="lg"
                                    fullWidth
                                    disabled={isPending}
                                    onPress={handleRetake}
                                />
                                <Button
                                    label={isPending ? "Submitting..." : "Submit"}
                                    intent="primary"
                                    size="lg"
                                    fullWidth
                                    disabled={!photoUri || isPending || isCapturing}
                                    onPress={handleSubmit}
                                />
                            </View>
                        </>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}
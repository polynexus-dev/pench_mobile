import React, { useEffect, useRef, useState } from "react";
import {
    View,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Linking,
    StyleSheet,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Text } from "@/shared/ui/Text/Text";
import { useAuthStore } from "@/store/authStore";
import { useGeofenceStore } from "@/store/geofenceStore";
import { ROUTES } from "@/constants/route";
import { useResolveDriverQr } from "../hooks/useResolveDriverQr";
import type { ResolveQrResponse } from "../types/delivery.types";

const SCAN_AREA_SIZE = 280;

export function QRScannerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [enableTorch, setEnableTorch] = useState(false);
    const [lineTop, setLineTop] = useState(0);
    const isScanningRef = useRef(false);

    const { user } = useAuthStore();
    const { resolveQr, isResolving, resetResolveQr } = useResolveDriverQr();

    const resumeScanning = () => {
        setTimeout(() => {
            isScanningRef.current = false;
            setScanned(false);
            resetResolveQr();
        }, 1200);
    };

    useEffect(() => {
        if (!permission?.granted) requestPermission();
    }, [permission, requestPermission]);

    useEffect(() => {
        let animationFrameId: number;
        let position = 0;
        let direction = 1;

        const animate = () => {
            position += 2 * direction;
            if (position >= SCAN_AREA_SIZE - 4) {
                position = SCAN_AREA_SIZE - 4;
                direction = -1;
            } else if (position <= 0) {
                position = 0;
                direction = 1;
            }
            setLineTop(position);
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    const handleBarcodeScanned = async ({ data }: { data: string }) => {
        if (isScanningRef.current || scanned || isResolving) return;

        isScanningRef.current = true;
        setScanned(true);

        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch { }

        const uuidRegex =
            /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
        const match = data.match(uuidRegex);

        if (!match) {
            if (data.startsWith("http://") || data.startsWith("https://")) {
                Alert.alert(
                    "External QR Code",
                    "This QR code does not belong to the dairy system. Open website instead?",
                    [
                        { text: "Cancel", style: "cancel", onPress: resumeScanning },
                        {
                            text: "Open Website",
                            onPress: async () => {
                                await Linking.openURL(data);
                                resumeScanning();
                            },
                        },
                    ]
                );
            } else {
                Alert.alert("Invalid QR Code", "This QR code format is not recognized.", [
                    { text: "OK", onPress: resumeScanning },
                ]);
            }
            return;
        }

        const qrId = match[0];

        if (!user?.is_driver) {
            Alert.alert("Access Denied", "Only drivers can scan delivery QR codes.", [
                { text: "OK", onPress: resumeScanning },
            ]);
            return;
        }

        try {
            const res = (await resolveQr({ qrId })) as ResolveQrResponse;

            if (res.detail) {
                Alert.alert("QR Resolution Failed", res.detail, [
                    { text: "OK", onPress: resumeScanning },
                ]);
                return;
            }

            if (!res.order) {
                Alert.alert(
                    "No Active Order",
                    "No pending delivery order was found for this customer today.",
                    [{ text: "OK", onPress: resumeScanning }]
                );
                return;
            }

            router.replace({
                pathname: ROUTES.DRIVER.FINALIZE_DELIVERY,
                params: {
                    orderId: res.order.id,
                    customerName: res.customer?.name ?? "Unknown",
                    deliveryDate:
                        res.order.scheduled_delivery_date ??
                        new Date().toISOString().split("T")[0],
                },
            } as any);
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ||
                err?.message ||
                "Failed to resolve QR code.";
            Alert.alert("QR Resolution Failed", message, [
                { text: "OK", onPress: resumeScanning },
            ]);
        }
    };

    if (!permission) {
        return (
            <View style={styles.centerScreen}>
                <ActivityIndicator size="large" color="#1B5E37" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.permissionScreen}>
                <View style={styles.permissionIconWrap}>
                    <Ionicons name="camera-outline" size={32} color="#EF4444" />
                </View>

                <Text variant="heading" color="inverse" weight="bold" className="text-center">
                    Camera Access Required
                </Text>

                <Text variant="body" color="inverse" className="mt-2 text-center">
                    To scan customer QR code tags, we require camera access.
                </Text>

                <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
                    <Text color="inverse" weight="bold">
                        Grant Permission
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.root}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                enableTorch={enableTorch}
                onBarcodeScanned={scanned || isResolving ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />

            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <View style={styles.overlayTop} />
                <View style={styles.overlayRow}>
                    <View style={styles.overlaySide} />
                    <View style={styles.cutout} />
                    <View style={styles.overlaySide} />
                </View>
                <View style={styles.overlayBottom} />
            </View>

            <View style={styles.scanTargetContainer} pointerEvents="none">
                <View style={styles.scanTarget}>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                    <View
                        style={[
                            styles.scanLine,
                            { transform: [{ translateY: lineTop }] },
                        ]}
                    />
                </View>
            </View>

            <View
                style={[
                    styles.header,
                    { top: Math.max(insets.top, 16) },
                ]}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>

                <Text variant="body-lg" weight="bold" color="inverse">
                    Scan Customer QR
                </Text>

                <TouchableOpacity
                    onPress={() => setEnableTorch((prev) => !prev)}
                    style={[
                        styles.headerButton,
                        enableTorch ? styles.headerButtonActive : styles.headerButtonInactive,
                    ]}
                >
                    <Ionicons
                        name={enableTorch ? "flash" : "flash-off"}
                        size={20}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>

            <View
                style={[
                    styles.footer,
                    { paddingBottom: Math.max(insets.bottom, 24) },
                ]}
            >
                {isResolving ? (
                    <View style={styles.loadingPill}>
                        <ActivityIndicator size="small" color="#1B5E37" />
                        <Text variant="body" color="inverse" weight="semibold">
                            Resolving order details...
                        </Text>
                    </View>
                ) : (
                    <View style={styles.instructionPill}>
                        <Text variant="body-sm" color="inverse" weight="medium" className="text-center">
                            Align customer QR label within the frame
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#000" },
    centerScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" },
    permissionScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000", paddingHorizontal: 24 },
    permissionIconWrap: { marginBottom: 16, height: 64, width: 64, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "rgba(239, 68, 68, 0.1)" },
    permissionButton: { marginTop: 32, width: "100%", alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: "#1B5E37", paddingVertical: 16 },
    header: { position: "absolute", left: 16, right: 16, zIndex: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    headerButton: { height: 44, width: 44, alignItems: "center", justifyContent: "center", borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.50)" },
    headerButtonActive: { backgroundColor: "#1B5E37" },
    headerButtonInactive: { backgroundColor: "rgba(0,0,0,0.50)" },
    footer: { position: "absolute", left: 24, right: 24, bottom: 0, zIndex: 10, alignItems: "center" },
    loadingPill: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 999, borderWidth: 1, borderColor: "rgba(27, 94, 55, 0.35)", backgroundColor: "rgba(0,0,0,0.85)", paddingHorizontal: 24, paddingVertical: 16, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
    instructionPill: { borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.60)", paddingHorizontal: 24, paddingVertical: 12 },
    overlayTop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
    overlayRow: { flexDirection: "row", height: SCAN_AREA_SIZE },
    overlaySide: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
    cutout: { width: SCAN_AREA_SIZE, backgroundColor: "transparent" },
    overlayBottom: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
    scanTargetContainer: { position: "absolute", inset: 0, justifyContent: "center", alignItems: "center" },
    scanTarget: { width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE, position: "relative" },
    scanLine: { height: 3, width: "100%", backgroundColor: "#1B5E37", position: "absolute", shadowColor: "#1B5E37", shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
    corner: { position: "absolute", width: 28, height: 28, borderColor: "#1B5E37" },
    cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
    cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
    cornerBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
    cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
});
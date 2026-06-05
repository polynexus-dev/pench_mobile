import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
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
import { httpClient } from "@/services/api/httpClient";
import { buildUrl } from "@/services/api/buildUrl";
import { ROUTES } from "@/constants/route";

const SCAN_AREA_SIZE = 280;

export function QRScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enableTorch, setEnableTorch] = useState(false);
  const isScanningRef = useRef(false);

  const resumeScanning = () => {
    // Add a 1.5 seconds cooldown to prevent immediate rescanning of the same code
    setTimeout(() => {
      isScanningRef.current = false;
      setScanned(false);
    }, 1500);
  };

  const { user, domain_name } = useAuthStore();
  const [lineTop, setLineTop] = useState(0);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Start scanner line animation using requestAnimationFrame
  useEffect(() => {
    let animationFrameId: number;
    let position = 0;
    let direction = 1;
    const speed = 2.0;

    const animate = () => {
      position += speed * direction;
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
    if (isScanningRef.current || scanned || loading) return;
    isScanningRef.current = true;
    setScanned(true);

    // Play haptic feedback for success
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore if haptics fail or aren't supported
    }

    // 1. Try to extract UUID (qr_id) from the scanned data
    const uuidRegex =
      /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
    const match = data.match(uuidRegex);

    if (!match) {
      // Check if it is a generic URL
      if (data.startsWith("http://") || data.startsWith("https://")) {
        Alert.alert(
          "External QR Code",
          "This QR code does not belong to the dairy system. Open website instead?",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: resumeScanning,
            },
            {
              text: "Open Website",
              onPress: async () => {
                await Linking.openURL(data);
                resumeScanning();
              },
            },
          ],
        );
      } else {
        Alert.alert(
          "Invalid QR Code",
          "This QR code format is not recognized. Redirecting to Pench Foods marketing website.",
          [
            {
              text: "OK",
              onPress: async () => {
                await Linking.openURL("https://penchfoods.com");
                resumeScanning();
              },
            },
          ],
        );
      }
      return;
    }

    const qrId = match[0];

    // 2. Perform role-based redirection logic
    if (user?.is_driver) {
      setLoading(true);
      try {
        if (!domain_name) {
          throw new Error("Missing domain configuration.");
        }

        // Call resolve-qr endpoint
        const url = buildUrl(
          domain_name,
          `/api/erp/orders/driver/resolve-qr/${qrId}/`,
        );
        const response: any = await httpClient.get(url);

        const order = response?.order;
        if (!order) {
          Alert.alert(
            "No Active Order",
            "No pending delivery order was found for this customer today.",
            [{ text: "OK", onPress: resumeScanning }],
          );
          return;
        }

        // Look up matching stop in active route if available
        const stops = useGeofenceStore.getState().route?.stops || [];
        const matchingStop = stops.find((s) => s.order === order.id);

        // Redirect driver to submit delivery page
        router.replace({
          pathname: ROUTES.DRIVER.FINALIZE_DELIVERY,
          params: {
            routeId: useGeofenceStore.getState().route?.id || "N/A",
            stopId: matchingStop?.id || "N/A",
            orderId: order.id,
            customerName: response.customer?.name || "Unknown",
            customer_name: response.customer?.name || "Unknown",
            deliveryDate:
              order.scheduled_delivery_date ||
              new Date().toISOString().split("T")[0],
            delivery_date:
              order.scheduled_delivery_date ||
              new Date().toISOString().split("T")[0],
          },
        } as any);
      } catch (err: any) {
        Alert.alert(
          "Resolution Failed",
          err?.message ||
            "Failed to resolve QR code. Invalid code or connection error.",
          [{ text: "OK", onPress: resumeScanning }],
        );
      } finally {
        setLoading(false);
      }
    } else if (user?.is_customer) {
      // Customer scanning redirects directly to dashboard
      Alert.alert("Success", "QR Code Scanned successfully.", [
        {
          text: "Go to Dashboard",
          onPress: () => {
            router.replace(ROUTES.CUSTOMER.DASHBOARD as any);
          },
        },
      ]);
    } else {
      // Unknown user or guest inside app - open Pench Foods website
      await Linking.openURL("https://penchfoods.com");
      resumeScanning();
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#1B5E37" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black px-6">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
          <Ionicons name="camera-outline" size={32} color="#EF4444" />
        </View>
        <Text
          variant="heading"
          color="inverse"
          weight="bold"
          className="text-center"
        >
          Camera Access Required
        </Text>
        <Text
          variant="body"
          color="inverse"
          className="mt-2 text-center opacity-80"
        >
          To scan customer QR code tags, we require camera access. Please grant
          permissions to continue.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="mt-8 w-full items-center justify-center rounded-btn bg-[#1B5E37] py-4"
        >
          <Text color="inverse" weight="bold">
            Grant Permission
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={enableTorch}
        onBarcodeScanned={scanned || loading ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      {/* Dark Mask Overlay */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.overlayTop} />
        <View style={styles.overlayRow}>
          <View style={styles.overlaySide} />
          <View style={styles.cutout} />
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Cutout Highlight Borders */}
      <View style={styles.scanTargetContainer}>
        <View style={styles.scanTarget}>
          {/* Corners */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Animated Line */}
          <View
            style={[
              styles.scanLine,
              {
                transform: [{ translateY: lineTop }],
              },
            ]}
          />
        </View>
      </View>

      {/* Floating Top Header Controls */}
      <View
        style={[
          styles.header,
          {
            top: Math.max(insets.top, 16),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-black/50 border border-white/10"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text
          variant="body-lg"
          weight="bold"
          color="inverse"
          className="shadow-sm"
        >
          Scan Customer QR
        </Text>

        <TouchableOpacity
          onPress={() => setEnableTorch((prev) => !prev)}
          className={`h-11 w-11 items-center justify-center rounded-full border border-white/10 ${
            enableTorch ? "bg-[#1B5E37]" : "bg-black/50"
          }`}
        >
          <Ionicons
            name={enableTorch ? "flash" : "flash-off"}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Floating Instructions and Loading overlay */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        {loading ? (
          <View
            key="loading-view"
            className="flex-row items-center gap-x-3 bg-black/85 px-6 py-4 rounded-full border border-[#1B5E37]/35 shadow-lg"
          >
            <ActivityIndicator size="small" color="#1B5E37" />
            <Text variant="body" color="inverse" weight="semibold">
              Resolving order details...
            </Text>
          </View>
        ) : (
          <View
            key="instruction-view"
            className="bg-black/60 px-6 py-3 rounded-full border border-white/10"
          >
            <Text
              variant="body-sm"
              color="inverse"
              weight="medium"
              className="text-center"
            >
              Align customer QR label within the frame
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 24,
    right: 24,
    alignItems: "center",
    zIndex: 10,
  },
  // Backdrop masking
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  overlayRow: {
    flexDirection: "row",
    height: SCAN_AREA_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  cutout: {
    width: SCAN_AREA_SIZE,
    backgroundColor: "transparent",
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  // Scan Target Area
  scanTargetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  scanTarget: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: "relative",
  },
  scanLine: {
    height: 3,
    width: "100%",
    backgroundColor: "#1B5E37",
    position: "absolute",
    shadowColor: "#1B5E37",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  // Corner brackets
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#1B5E37",
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
});

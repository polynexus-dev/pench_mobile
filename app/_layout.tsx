import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { useAuthInit } from "@/hooks/useAuthInit";
import "@/services/location/backgroundTracking";
import { ToastProvider } from "@/shared/components/Toast/Toast";
import { useAuthStore } from "@/store/authStore";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import "../global.css";
import { BlurView } from 'expo-blur';
import { StatusBar } from "expo-status-bar";

function AppInit() {
  useNotifications();
  return null;
}

function StatusOverlays() {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'ios') {
    return null;
  }
  return (
    <>
      {/* Top Blur only */}
      <BlurView
        intensity={60}
        tint="dark"
        style={[
          styles.blur,
          { height: insets.top },
        ]}
      />
    </>
  );
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const ROLE_ROUTES: Record<string, string> = {
  driver: "/(driver)/(tabs)/dashboard",
  customer: "/(customer)/(tabs)/dashboard",
  admin: "/(admin)/(tabs)/dashboard",
};

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const user = useAuthStore((s) => s.user);
  const { isReady } = useAuthInit();

  // ── One-shot redirect guard ──────────────────────────────────
  const didRedirect = useRef(false);

  // ── Hide splash ──────────────────────────────────────────────
  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  // ── Redirect — fires only when isReady + user settle ────────
  useEffect(() => {
    if (!isReady) return;
    if (didRedirect.current) return;

    const currentSegment = segments[0] as string;
    const inAuthGroup = currentSegment === "(auth)";

    // ── Don't redirect while index.tsx is still deciding ────────
    if (currentSegment === undefined || currentSegment === null) return;

    if (!user) {
      if (!inAuthGroup) {
        didRedirect.current = true;
        router.replace("/(auth)/login" as any);
      }
      return;
    }

    if (inAuthGroup) {
      const appRole = (user.role as string)?.toLowerCase?.() ?? "";
      const route = ROLE_ROUTES[appRole] ?? "/(auth)/login";
      didRedirect.current = true;
      router.replace(route as any);
    }
  }, [isReady, user]); // ← segments excluded intentionally

  // ── Reset redirect guard on logout ──────────────────────────
  useEffect(() => {
    if (!user) {
      didRedirect.current = false;
    }
  }, [user]);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-screen">
        <ActivityIndicator size="large" color="#1B5E37" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar translucent backgroundColor="transparent" style="light" />
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <AppInit />
            <RootNavigator />
            <ToastProvider />
            <StatusOverlays />
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


const styles = StyleSheet.create({
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    overflow: 'hidden',
  },
});
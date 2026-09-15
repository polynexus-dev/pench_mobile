import { useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { ROUTES } from "@/constants/route";
import { useAuthStore } from "@/store/authStore";

interface RequireAuthOptions {
  /**
   * What the guest was trying to do, e.g. "add items to your cart".
   * Completes the sentence "Sign in to …".
   */
  action?: string;
  /**
   * Run before navigating away — use it to dismiss an open bottom sheet or
   * modal that would otherwise stay mounted over the login screen.
   */
  onNavigate?: () => void;
}

/**
 * Gate for the actions a guest cannot perform: adding to cart, subscribing and
 * anything wallet/account related. Browsing the catalog stays open to everyone.
 *
 * Usage:
 *   const { requireAuth } = useRequireAuth();
 *   onPress={() => {
 *     if (!requireAuth({ action: "add items to your cart" })) return;
 *     addToCart(...);
 *   }}
 */
export function useRequireAuth() {
  const router = useRouter();
  const isGuest = useAuthStore((s) => s.isGuest);
  const user = useAuthStore((s) => s.user);

  const isAuthenticated = !!user && !isGuest;

  const promptLogin = useCallback(
    ({ action, onNavigate }: RequireAuthOptions = {}) => {
      const go = (route: string) => {
        onNavigate?.();
        router.push(route as any);
      };

      Alert.alert(
        "Sign in to continue",
        action
          ? `Please sign in or create an account to ${action}.`
          : "Please sign in or create an account to continue.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Register", onPress: () => go("/(auth)/register") },
          { text: "Sign In", onPress: () => go(ROUTES.AUTH.LOGIN) },
        ]
      );
    },
    [router]
  );

  /**
   * Returns true when the action may proceed. Returns false and shows the
   * sign-in prompt when the current session is a guest.
   */
  const requireAuth = useCallback(
    (options: RequireAuthOptions = {}) => {
      if (isAuthenticated) return true;
      promptLogin(options);
      return false;
    },
    [isAuthenticated, promptLogin]
  );

  return { requireAuth, promptLogin, isGuest, isAuthenticated };
}

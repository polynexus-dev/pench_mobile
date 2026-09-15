import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { ROUTES } from "@/constants/route";
import { getErrorMessage, logError } from "@/errors/errorHandler";
import { clearLocalSession } from "@/features/auth/utils/clearSession";
import { useAuthStore } from "@/store/authStore";
import { accountApi, type DeleteAccountPayload } from "../api/accountApi";

/**
 * Permanently deletes the signed-in account.
 *
 * The confirmation UI lives in the profile screen — this hook only runs once the
 * user has already confirmed. On success the local session is wiped and the app
 * returns to login; there is nothing left to sign back into.
 */
export function useDeleteAccount() {
  const router = useRouter();
  const domainName = useAuthStore((s) => s.domain_name) || "";
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAccount = async (payload: DeleteAccountPayload = {}) => {
    if (isDeleting) return;

    if (!domainName) {
      Alert.alert(
        "Cannot delete account",
        "No active session domain is configured. Please sign in again and retry."
      );
      return;
    }

    setIsDeleting(true);
    try {
      const res = await accountApi.deleteAccount(domainName, payload);

      // Server-side account is gone (or queued for erasure) — drop everything local
      await clearLocalSession();

      const base =
        res?.detail ||
        res?.message ||
        (res?.scheduled_deletion_at
          ? `Your account is scheduled for deletion on ${res.scheduled_deletion_at}.`
          : "Your account and personal data have been deleted.");

      // Deleting the account does not write off money still owed — saying so
      // here avoids a dispute later.
      const owed = Number(res?.outstanding_balance ?? 0);
      const message =
        owed > 0
          ? `${base}\n\nAn unpaid balance of \u20B9${owed} remains due. Our team will contact you about settling it.`
          : base;

      router.replace(ROUTES.AUTH.LOGIN as any);
      Alert.alert("Account deleted", message);
    } catch (err) {
      logError(err, "useDeleteAccount:delete-account");
      Alert.alert(
        "Deletion failed",
        `${getErrorMessage(err)}\n\nYour account has not been deleted. Please try again, or contact support@penchfoods.in for help.`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteAccount, isDeleting };
}

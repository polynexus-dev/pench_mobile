import { useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { checkAppVersion } from "../services/versionService";
import { useVersionStore } from "../store/versionStore";

// Once the user taps "Remind Me Later", don't nag again until the next cold start
let optionalDismissed = false;

export function useAppVersionCheck() {
  const checkResult = useVersionStore((s) => s.checkResult);
  const setCheckResult = useVersionStore((s) => s.setCheckResult);

  const runCheck = useCallback(async () => {
    const result = await checkAppVersion();
    if (result && result.needsUpdate) {
      if (!result.isMandatory && optionalDismissed) return;
      setCheckResult(result);
    } else {
      setCheckResult(null);
    }
  }, [setCheckResult]);

  useEffect(() => {
    // 1. Check immediately on mount
    runCheck();

    // 2. Also re-check when app resumes from background
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          runCheck();
        }
      }
    );

    return () => subscription.remove();
  }, [runCheck]);

  const dismissOptional = useCallback(() => {
    if (checkResult && !checkResult.isMandatory) {
      optionalDismissed = true;
      setCheckResult(null);
    }
  }, [checkResult, setCheckResult]);

  return {
    checkResult,
    dismissOptional,
    recheck: runCheck,
  };
}

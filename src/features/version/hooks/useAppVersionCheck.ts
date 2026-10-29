import { useState, useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import {
  checkAppVersion,
  VersionCheckResult,
} from "../services/versionService";

export function useAppVersionCheck() {
  const [checkResult, setCheckResult] = useState<VersionCheckResult | null>(null);

  const runCheck = useCallback(async () => {
    const result = await checkAppVersion();
    if (result && result.needsUpdate) {
      setCheckResult(result);
    } else {
      setCheckResult(null);
    }
  }, []);

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
      setCheckResult(null);
    }
  }, [checkResult]);

  return {
    checkResult,
    dismissOptional,
    recheck: runCheck,
  };
}

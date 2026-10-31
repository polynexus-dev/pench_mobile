import { useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { checkAppVersion } from "../services/versionService";
import { useVersionStore } from "../store/versionStore";

// Longest the splash screen waits for the launch check before letting the app open
const LAUNCH_CHECK_MAX_WAIT_MS = 4000;

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
    // 1. Check on launch while the splash screen is still showing. The splash is
    //    released when the check finishes or after LAUNCH_CHECK_MAX_WAIT_MS,
    //    whichever comes first; a late result still raises the modal.
    const { setLaunchCheckDone } = useVersionStore.getState();
    const timeoutId = setTimeout(setLaunchCheckDone, LAUNCH_CHECK_MAX_WAIT_MS);
    runCheck().finally(() => {
      clearTimeout(timeoutId);
      setLaunchCheckDone();
    });

    // 2. Also re-check when app resumes from background (no splash on resume)
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          runCheck();
        }
      }
    );

    return () => {
      clearTimeout(timeoutId);
      subscription.remove();
    };
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

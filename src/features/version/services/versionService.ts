import * as Application from "expo-application";
import { Platform } from "react-native";
import { compareVersions } from "../utils/versionCompare";

export interface VersionConfig {
  minimumVersion: string;
  latestVersion: string;
  minimumBuildNumber?: number;
  forceUpdate: boolean;
  title?: string;
  message?: string;
  androidPackage?: string;
  iosAppId?: string;
  storeUrl?: string;
}

export interface VersionCheckResult {
  needsUpdate: boolean;
  isMandatory: boolean;
  currentVersion: string;
  currentBuild: string;
  targetVersion: string;
  title: string;
  message: string;
  storeUrl: string;
}

// Hosted on your public repository so you can update it anytime without a backend server
export const REMOTE_VERSION_CONFIG_URL =
  "https://raw.githubusercontent.com/polynexus-dev/pench_mobile/main/version.json";

export async function checkAppVersion(
  remoteUrl: string = REMOTE_VERSION_CONFIG_URL
): Promise<VersionCheckResult | null> {
  try {
    const currentVersion = Application.nativeApplicationVersion || "1.0.0";
    const currentBuild = Application.nativeBuildVersion || "1";
    const appId = Application.applicationId || "in.polynexus.penchfoods";

    // 1. Fetch remote version config with cache-busting timestamp
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${remoteUrl}?_t=${Date.now()}`, {
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn("Version check returned non-200 status:", response.status);
      return null;
    }

    const config: VersionConfig = await response.json();

    // 2. Evaluate if update is required
    const isVersionOlder = compareVersions(currentVersion, config.minimumVersion) < 0;
    const isBuildOlder =
      config.minimumBuildNumber !== undefined &&
      (parseInt(currentBuild, 10) || 0) < config.minimumBuildNumber;

    const needsUpdate = isVersionOlder || isBuildOlder;

    // 3. Resolve Store URL
    let storeUrl = config.storeUrl;
    if (!storeUrl) {
      if (Platform.OS === "android") {
        const pkg = config.androidPackage || appId;
        storeUrl = `market://details?id=${pkg}`;
      } else {
        const iosId = config.iosAppId;
        storeUrl = iosId
          ? `https://apps.apple.com/app/id${iosId}`
          : `https://apps.apple.com/search?term=Pench`;
      }
    }

    return {
      needsUpdate,
      isMandatory: !!config.forceUpdate,
      currentVersion,
      currentBuild,
      targetVersion: config.latestVersion || config.minimumVersion,
      title: config.title || "Update Required",
      message:
        config.message ||
        "A critical update is available. Please update the app to continue using Pench.",
      storeUrl,
    };
  } catch (error: any) {
    // If user is offline or fetch times out, fail gracefully to allow regular app launch
    console.warn("Version check failed or timed out:", error?.message || error);
    return null;
  }
}

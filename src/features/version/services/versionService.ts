import * as Application from "expo-application";
import { Platform } from "react-native";
import { env } from "@/config/env";
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
  isMaintenance?: boolean;
  currentVersion: string;
  currentBuild: string;
  targetVersion: string;
  title: string;
  message: string;
  storeUrl: string;
}

// Response shape of the backend GET /api/app-version/ endpoint (and its 426/503 bodies)
export interface BackendVersionPayload {
  status: "ok" | "soft_update" | "force_update" | "maintenance";
  force_update: boolean;
  soft_update: boolean;
  maintenance_mode: boolean;
  min_supported_version?: string;
  latest_version?: string;
  store_url?: string;
  message?: string;
}

// Identifies this binary to the backend AppVersionConfig (one app serves all roles)
export const APP_NAME = "pench";

const IOS_APP_STORE_ID = "6803119085";
const ANDROID_PACKAGE = "in.polynexus.penchfoods";

// Legacy fallback, used only when the backend is unreachable
export const REMOTE_VERSION_CONFIG_URL =
  "https://raw.githubusercontent.com/polynexus-dev/pench_mobile/main/version.json";

export function getCurrentAppVersion() {
  return {
    version: Application.nativeApplicationVersion || "1.0.0",
    build: Application.nativeBuildVersion || "1",
  };
}

// Sent on every API call so the backend can reject outdated builds with 426
export function getAppVersionHeaders(): Record<string, string> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return {};
  return {
    "X-App-Name": APP_NAME,
    "X-App-Platform": Platform.OS,
    "X-App-Version": getCurrentAppVersion().version,
  };
}

function defaultStoreUrl(): string {
  return Platform.OS === "android"
    ? `market://details?id=${ANDROID_PACKAGE}`
    : `https://apps.apple.com/app/id${IOS_APP_STORE_ID}`;
}

// Map a backend payload to the modal's result; null when no prompt is needed
export function resultFromBackendPayload(
  payload: BackendVersionPayload
): VersionCheckResult | null {
  if (!payload || !payload.status || payload.status === "ok") return null;

  const { version, build } = getCurrentAppVersion();
  const isMaintenance = payload.status === "maintenance";
  const isMandatory = payload.status === "force_update" || isMaintenance;

  return {
    needsUpdate: true,
    isMandatory,
    isMaintenance,
    currentVersion: version,
    currentBuild: build,
    targetVersion: payload.latest_version || payload.min_supported_version || version,
    title: isMaintenance
      ? "Under Maintenance"
      : isMandatory
        ? "Update Required"
        : "Update Available",
    message:
      payload.message ||
      (isMaintenance
        ? "Pench is temporarily under maintenance. Please try again shortly."
        : isMandatory
          ? "A newer version of Pench is required to continue. Please update the app."
          : "A new version of Pench is available with the latest features and improvements."),
    storeUrl: payload.store_url || defaultStoreUrl(),
  };
}

async function fetchWithTimeout(url: string, ms = 6000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkWithBackend(): Promise<VersionCheckResult | null> {
  const { version } = getCurrentAppVersion();
  const base = env.EXPO_PUBLIC_API_BASE_URL.replace(/\/+$/, "");
  const query = `app=${APP_NAME}&platform=${Platform.OS}&version=${encodeURIComponent(version)}`;

  const response = await fetchWithTimeout(`${base}/app-version/?${query}`);
  if (!response.ok) {
    throw new Error(`Backend version check returned ${response.status}`);
  }
  return resultFromBackendPayload(await response.json());
}

async function checkWithRemoteJson(
  remoteUrl: string
): Promise<VersionCheckResult | null> {
  const { version: currentVersion, build: currentBuild } = getCurrentAppVersion();

  const response = await fetchWithTimeout(`${remoteUrl}?_t=${Date.now()}`);
  if (!response.ok) {
    console.warn("Version check returned non-200 status:", response.status);
    return null;
  }

  const config: VersionConfig = await response.json();

  const isVersionOlder = compareVersions(currentVersion, config.minimumVersion) < 0;
  const isBuildOlder =
    config.minimumBuildNumber !== undefined &&
    (parseInt(currentBuild, 10) || 0) < config.minimumBuildNumber;

  if (!isVersionOlder && !isBuildOlder) return null;

  let storeUrl = config.storeUrl;
  if (!storeUrl) {
    storeUrl =
      Platform.OS === "android"
        ? `market://details?id=${config.androidPackage || ANDROID_PACKAGE}`
        : `https://apps.apple.com/app/id${config.iosAppId || IOS_APP_STORE_ID}`;
  }

  return {
    needsUpdate: true,
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
}

export async function checkAppVersion(
  remoteUrl: string = REMOTE_VERSION_CONFIG_URL
): Promise<VersionCheckResult | null> {
  try {
    return await checkWithBackend();
  } catch (error: any) {
    console.warn("Backend version check failed, trying remote config:", error?.message || error);
  }

  try {
    return await checkWithRemoteJson(remoteUrl);
  } catch (error: any) {
    // If user is offline or fetch times out, fail gracefully to allow regular app launch
    console.warn("Version check failed or timed out:", error?.message || error);
    return null;
  }
}

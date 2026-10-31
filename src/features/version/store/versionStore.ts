import { create } from "zustand";
import { VersionCheckResult } from "../services/versionService";

interface VersionState {
  checkResult: VersionCheckResult | null;
  // True once the launch check has finished (or timed out) so the splash can hide
  launchCheckDone: boolean;
  setCheckResult: (result: VersionCheckResult | null) => void;
  setLaunchCheckDone: () => void;
}

// Shared so both the launch/resume check and the httpClient 426/503 interceptor can raise the modal
export const useVersionStore = create<VersionState>((set) => ({
  checkResult: null,
  launchCheckDone: false,
  setCheckResult: (checkResult) => set({ checkResult }),
  setLaunchCheckDone: () => set({ launchCheckDone: true }),
}));

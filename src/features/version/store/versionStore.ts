import { create } from "zustand";
import { VersionCheckResult } from "../services/versionService";

interface VersionState {
  checkResult: VersionCheckResult | null;
  setCheckResult: (result: VersionCheckResult | null) => void;
}

// Shared so both the launch/resume check and the httpClient 426/503 interceptor can raise the modal
export const useVersionStore = create<VersionState>((set) => ({
  checkResult: null,
  setCheckResult: (checkResult) => set({ checkResult }),
}));

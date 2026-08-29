import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useAppStore } from "@/store/appStore";

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const setNetworkStatus = useAppStore((s) => s.setNetworkStatus);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      setNetworkStatus(connected);
    });
    return unsubscribe;
  }, [setNetworkStatus]);

  return { isConnected };
}

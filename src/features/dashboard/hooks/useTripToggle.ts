import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/errors/errorHandler";
import { dashboardApi } from "../api/dashboardApi";
import type { TripActionResponse } from "../types/dashboard.types";

type TripToggleVars = {
  domainName: string;
  token: string;
  action: "start" | "stop";
};

export function useTripToggle() {
  const { show } = useToast();

  return useMutation<TripActionResponse, Error, TripToggleVars>({
    mutationFn: async ({ domainName, token, action }) => {
      return action === "start"
        ? dashboardApi.startTrip(domainName, token)
        : dashboardApi.stopTrip(domainName, token);
    },

    onSuccess: () => {
      show({
        message: "Trip updated successfully",
        type: "success",
      });
    },

    onError: (error) => {
      show({
        message: getErrorMessage(error),
        type: "error",
      });
    },
  });
}
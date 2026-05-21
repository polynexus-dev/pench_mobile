import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/errors/errorHandler";
import { dashboardApi } from "../api/dashboardApi";
import type {
    StartDeliveryTrackingPayload,
    StartDeliveryTrackingResponse,
} from "../types/dashboard.types";

type StartDeliveryTrackingVars = {
    domainName: string;
    payload: StartDeliveryTrackingPayload;
};

export function useStartDeliveryTracking() {
    const { show } = useToast();

    return useMutation<
        StartDeliveryTrackingResponse,
        Error,
        StartDeliveryTrackingVars
    >({
        mutationFn: ({ domainName, payload }) =>
            dashboardApi.startDeliveryTracking(domainName, payload),

        onSuccess: (res) => {
            show({
                message: res.message ?? "Delivery tracking started",
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/errors/errorHandler";
import { useAuthStore } from "@/store/authStore";
import { deliveryApi } from "../api/deliveryApi";
import type { SubmitUndeliveredResponse } from "../types/delivery.types";

type SubmitUndeliveredVars = {
    lastOrderId: string;
    payload: FormData;
};

export function useSubmitUndelivered() {
    const { show } = useToast();
    // const queryClient = useQueryClient();
    const domainName = useAuthStore((s) => s.domain_name);

    return useMutation<SubmitUndeliveredResponse, Error, SubmitUndeliveredVars>({
        mutationFn: ({ lastOrderId, payload }) => {
            if (!domainName) throw new Error("domain_name not set");
            return deliveryApi.submitUndelivered(domainName, lastOrderId, payload);
        },

        onSuccess: () => {
            // for redundancy, we can invalidate my-route query here as well, but it should ideally be handled in trackingStore's startTrip and stopTrip functions where route_id is set and unset respectively.
            // if (domainName) {
            //     queryClient.invalidateQueries({ queryKey: ["my-route", domainName] });
            // }

            show({
                message: "Undelivered status submitted successfully",
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
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/errors/errorHandler";
import { deliveryApi } from "../api/deliveryApi";
import type {
    SubmitDeliveryPayload,
    SubmitDeliveryResponse,
} from "../types/delivery.types";

type SubmitDeliveryVars = {
    domainName: string;
    orderId: string;
    payload: SubmitDeliveryPayload;
};

export function useSubmitDelivery() {
    const { show } = useToast();

    return useMutation<SubmitDeliveryResponse, Error, SubmitDeliveryVars>({
        mutationFn: ({ domainName, orderId, payload }) => {
            if (!domainName) throw new Error("domain_name not set");
            return deliveryApi.submitDelivery(domainName, orderId, payload);
        },

        onSuccess: (res) => {
            // for redundancy, we can invalidate my-route query here as well, but it should ideally be handled in trackingStore's startTrip and stopTrip functions where route_id is set and unset respectively.
            // if (domainName) {
            //     queryClient.invalidateQueries({ queryKey: ["my-route", domainName] });
            // }

            show({
                message: `Delivery submitted for ${res.customer_name}`,
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

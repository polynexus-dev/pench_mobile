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
        mutationFn: ({ domainName, orderId, payload }) =>
            deliveryApi.submitDelivery(domainName, orderId, payload),

        onSuccess: (res) => {
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

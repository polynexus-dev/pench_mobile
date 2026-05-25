// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { useToast } from "@/hooks/useToast";
// import { getErrorMessage } from "@/errors/errorHandler";
// import { useAuthStore } from "@/store/authStore";
// import type { SubmitUndeliveredResponse } from "../types/delivery.types";

// type SubmitUndeliveredVars = {
//     lastOrderId: string;
//     payload: FormData;
// };

// export function useSubmitUndelivered() {
//     const { show } = useToast();
//     const queryClient = useQueryClient();
//     const domainName = useAuthStore((s) => s.domain_name);
//     const token = useAuthStore((s) => s.accessToken);

//     return useMutation<SubmitUndeliveredResponse, Error, SubmitUndeliveredVars>({
//         mutationFn: async ({ lastOrderId, payload }) => {
//             if (!domainName) throw new Error("domain_name not set");
//             if (!token) throw new Error("accessToken not set");

//             console.log("Submitting undelivered", lastOrderId);

//             const res = await fetch(
//                 `https://${domainName}/api/erp/orders/driver/${lastOrderId}/submit-undelivered/`,
//                 {
//                     method: "POST",
//                     headers: {
//                         Authorization: `Bearer ${token}`,
//                     },
//                     body: payload,
//                 }
//             );
//             console.log("Response status", res.status);

//             const text = await res.text();
//             console.log("Response body", text);

//             if (!res.ok) {
//                 throw new Error(text || `Submit undelivered failed: ${res.status}`);
//             }

//             return JSON.parse(text);
//         },

//         onSuccess: (_res) => {
//             if (domainName) {
//                 queryClient.invalidateQueries({ queryKey: ["my-route", domainName] });
//             }

//             show({
//                 message: "Undelivered status submitted successfully",
//                 type: "success",
//             });
//         },

//         onError: (error) => {
//             show({
//                 message: getErrorMessage(error),
//                 type: "error",
//             });
//         },
//     });
// }

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
    const queryClient = useQueryClient();
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
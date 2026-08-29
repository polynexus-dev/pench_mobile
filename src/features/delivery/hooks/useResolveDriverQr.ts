import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { deliveryApi } from "../api/deliveryApi";
import type { ResolveQrResponse } from "../types/delivery.types";

type ResolveParams = {
    qrId: string;
};

export function useResolveDriverQr() {
    const mutation = useMutation({
        mutationFn: async ({ qrId }: ResolveParams) => {
            const { domain_name } = useAuthStore.getState();

            if (!domain_name) {
                throw new Error("Missing domain configuration.");
            }

            return deliveryApi.resolveDriverQr(domain_name, qrId);
        },
    });

    return {
        resolveQr: mutation.mutateAsync,
        isResolving: mutation.isPending,
        resetResolveQr: mutation.reset,
    };
}
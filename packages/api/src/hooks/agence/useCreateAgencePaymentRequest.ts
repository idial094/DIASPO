import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAgencePaymentRequest,
  type CreateAgencePaymentRequestPayload
} from "../../client";

export function useCreateAgencePaymentRequest() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateAgencePaymentRequestPayload) =>
      createAgencePaymentRequest(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["agence-payment-requests"] });
    }
  });

  return {
    createRequest: mutation.mutateAsync,
    isPending: mutation.isPending
  };
}

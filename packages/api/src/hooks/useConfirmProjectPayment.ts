import { useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmProjectPayment } from "../client";

export function useConfirmProjectPayment(projectId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (paymentId: string) => confirmProjectPayment(projectId, paymentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-payments", projectId]
      });
    }
  });

  return {
    confirmPayment: mutation.mutateAsync,
    isPending: mutation.isPending
  };
}

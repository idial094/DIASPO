import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAgenceColisStatus } from "../../client";

export function useUpdateAgenceColisStatus() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { id: string; status: string }) =>
      updateAgenceColisStatus(payload.id, payload.status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["agence-colis"] });
    }
  });

  return {
    updateStatus: mutation.mutateAsync,
    isPending: mutation.isPending
  };
}

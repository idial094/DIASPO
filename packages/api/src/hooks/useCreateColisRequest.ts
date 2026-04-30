import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createColisRequest, type CreateColisPayload } from "../client";

export function useCreateColisRequest() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateColisPayload) => createColisRequest(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["colis"] });
    }
  });

  return {
    createRequest: mutation.mutateAsync,
    isPending: mutation.isPending
  };
}

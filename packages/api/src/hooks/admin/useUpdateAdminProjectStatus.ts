import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAdminProjectStatus } from "../../client";

export function useUpdateAdminProjectStatus() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { id: string; status: string }) =>
      updateAdminProjectStatus(payload.id, payload.status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    }
  });

  return {
    updateStatus: mutation.mutateAsync,
    isPending: mutation.isPending
  };
}

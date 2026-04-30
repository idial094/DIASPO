import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAdminUserStatus } from "../../client";

export function useUpdateAdminUserStatus() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { id: string; status: "active" | "inactive" }) =>
      updateAdminUserStatus(payload.id, payload.status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });

  return {
    updateStatus: mutation.mutateAsync,
    isPending: mutation.isPending
  };
}

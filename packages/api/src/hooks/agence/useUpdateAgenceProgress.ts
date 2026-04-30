import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAgenceProjectProgress } from "../../client";

export function useUpdateAgenceProgress() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { projectId: string; progress: number; stage?: string }) =>
      updateAgenceProjectProgress(payload.projectId, {
        progress: payload.progress,
        stage: payload.stage
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["agence-projects"] });
    }
  });

  return {
    updateProgress: mutation.mutateAsync,
    isPending: mutation.isPending
  };
}

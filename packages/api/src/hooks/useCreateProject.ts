import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject, type CreateProjectPayload } from "../client";

export function useCreateProject() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-projects"] });
    },
  });

  return {
    createProject: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}

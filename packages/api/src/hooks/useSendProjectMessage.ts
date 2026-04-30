import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendProjectMessage } from "../client";

export function useSendProjectMessage(projectId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (text: string) => sendProjectMessage(projectId, text),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-messages", projectId]
      });
    }
  });

  return {
    sendMessage: mutation.mutateAsync,
    isPending: mutation.isPending
  };
}

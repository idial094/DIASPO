import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendAgenceMessage } from "../../client";

export function useSendAgenceMessage(conversationId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (text: string) => sendAgenceMessage(conversationId, text),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["agence-messages", conversationId]
      });
      await queryClient.invalidateQueries({
        queryKey: ["agence-conversations"]
      });
    }
  });

  return {
    sendMessage: mutation.mutateAsync,
    isPending: mutation.isPending
  };
}

import { useQuery } from "@tanstack/react-query";
import { getAgenceMessages, type AgenceMessageItem } from "../../client";

export function useAgenceMessages(conversationId: string) {
  const query = useQuery<AgenceMessageItem[]>({
    queryKey: ["agence-messages", conversationId],
    queryFn: () => getAgenceMessages(conversationId),
    enabled: Boolean(conversationId)
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger les messages agence." : null
  };
}

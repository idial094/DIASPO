import { useQuery } from "@tanstack/react-query";
import { getAgenceConversations, type AgenceConversation } from "../../client";

export function useAgenceConversations() {
  const query = useQuery<AgenceConversation[]>({
    queryKey: ["agence-conversations"],
    queryFn: getAgenceConversations
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger les conversations agence." : null
  };
}

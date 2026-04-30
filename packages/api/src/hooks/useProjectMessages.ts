import { useQuery } from "@tanstack/react-query";
import { getProjectMessages, type MessageItem } from "../client";

export function useProjectMessages(projectId: string) {
  const query = useQuery<MessageItem[]>({
    queryKey: ["project-messages", projectId],
    queryFn: () => getProjectMessages(projectId)
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger les messages." : null
  };
}

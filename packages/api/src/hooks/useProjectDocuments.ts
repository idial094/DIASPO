import { useQuery } from "@tanstack/react-query";
import { getProjectDocuments, type DocumentItem } from "../client";

export function useProjectDocuments(projectId: string) {
  const query = useQuery<DocumentItem[]>({
    queryKey: ["project-documents", projectId],
    queryFn: () => getProjectDocuments(projectId)
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger les documents." : null
  };
}

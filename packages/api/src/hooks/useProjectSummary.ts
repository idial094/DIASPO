import { useQuery } from "@tanstack/react-query";
import { getProjectSummary, type ProjectSummary } from "../client";

export function useProjectSummary(projectId: string) {
  const query = useQuery<ProjectSummary>({
    queryKey: ["project-summary", projectId],
    queryFn: () => getProjectSummary(projectId)
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger les donnees du projet." : null
  };
}

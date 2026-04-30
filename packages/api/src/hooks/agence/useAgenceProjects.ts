import { useQuery } from "@tanstack/react-query";
import { getAgenceProjects, type AgenceProjectItem } from "../../client";

export function useAgenceProjects() {
  const query = useQuery<AgenceProjectItem[]>({
    queryKey: ["agence-projects"],
    queryFn: getAgenceProjects
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger les projets agence." : null
  };
}

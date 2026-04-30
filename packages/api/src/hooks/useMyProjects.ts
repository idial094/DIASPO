import { useQuery } from "@tanstack/react-query";
import { getMyProjects, type ProjectListItem } from "../client";

export function useMyProjects() {
  const query = useQuery<ProjectListItem[]>({
    queryKey: ["my-projects"],
    queryFn: () => getMyProjects(),
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger vos projets." : null,
    refetch: query.refetch,
  };
}

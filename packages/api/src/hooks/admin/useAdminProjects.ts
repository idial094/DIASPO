import { useQuery } from "@tanstack/react-query";
import { getAdminProjects, type AdminProjectItem } from "../../client";

export function useAdminProjects() {
  const query = useQuery<AdminProjectItem[]>({
    queryKey: ["admin-projects"],
    queryFn: getAdminProjects
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger les projets admin." : null
  };
}

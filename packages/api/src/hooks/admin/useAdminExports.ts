import { useQuery } from "@tanstack/react-query";
import { getAdminExports, type AdminExportItem } from "../../client";

export function useAdminExports() {
  const query = useQuery<AdminExportItem[]>({
    queryKey: ["admin-exports"],
    queryFn: getAdminExports
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger les exports admin." : null
  };
}

import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard, type AdminDashboardData } from "../../client";

export function useAdminDashboard() {
  const query = useQuery<AdminDashboardData>({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger le dashboard admin." : null
  };
}

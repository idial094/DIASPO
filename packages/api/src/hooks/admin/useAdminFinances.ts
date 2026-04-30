import { useQuery } from "@tanstack/react-query";
import { getAdminFinances, type AdminFinancesData } from "../../client";

export function useAdminFinances() {
  const query = useQuery<AdminFinancesData>({
    queryKey: ["admin-finances"],
    queryFn: getAdminFinances
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger les finances admin." : null
  };
}

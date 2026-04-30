import { useQuery } from "@tanstack/react-query";
import { getAgenceColis, type AgenceColisItem } from "../../client";

export function useAgenceColis() {
  const query = useQuery<AgenceColisItem[]>({
    queryKey: ["agence-colis"],
    queryFn: getAgenceColis
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger les colis agence." : null
  };
}

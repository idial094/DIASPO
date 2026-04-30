import { useQuery } from "@tanstack/react-query";
import { getColis, type ColisItem } from "../client";

export function useColis() {
  const query = useQuery<ColisItem[]>({
    queryKey: ["colis"],
    queryFn: getColis
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger les colis." : null
  };
}

import { useQuery } from "@tanstack/react-query";
import { getProjectPayments, type PaymentItem } from "../client";

export function useProjectPayments(projectId: string) {
  const query = useQuery<PaymentItem[]>({
    queryKey: ["project-payments", projectId],
    queryFn: () => getProjectPayments(projectId)
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger les paiements." : null
  };
}

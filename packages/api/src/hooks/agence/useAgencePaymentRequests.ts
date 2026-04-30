import { useQuery } from "@tanstack/react-query";
import {
  getAgencePaymentRequests,
  type AgencePaymentRequestItem
} from "../../client";

export function useAgencePaymentRequests() {
  const query = useQuery<AgencePaymentRequestItem[]>({
    queryKey: ["agence-payment-requests"],
    queryFn: getAgencePaymentRequests
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger les demandes de paiement agence." : null
  };
}

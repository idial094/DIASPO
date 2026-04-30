import { useMutation } from "@tanstack/react-query";
import {
  createStripePaymentIntent,
  type CreateStripePaymentIntentPayload,
  type StripePaymentIntentResult
} from "../client";

export function useCreateStripePaymentIntent() {
  const mutation = useMutation<StripePaymentIntentResult, Error, CreateStripePaymentIntentPayload>({
    mutationFn: (payload) => createStripePaymentIntent(payload)
  });

  return {
    createIntent: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error ? "Impossible d'initialiser le paiement Stripe." : null
  };
}

import { z } from "zod";

export const paymentSchema = z.object({
  method: z.enum(["card", "western_union"], "Choisissez une methode de paiement"),
  amount: z.number().positive(),
  stepId: z.string().uuid()
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

export const createStripePaymentIntentSchema = z.object({
  projectId: z.string().min(1),
  paymentId: z.string().min(1),
  amountGnf: z.number().positive(),
});

export const stripePaymentIntentResponseSchema = z.object({
  clientSecret: z.string().min(1),
  paymentIntentId: z.string().min(1),
});

export type CreateStripePaymentIntentInput = z.infer<typeof createStripePaymentIntentSchema>;
export type StripePaymentIntentResponse = z.infer<typeof stripePaymentIntentResponseSchema>;

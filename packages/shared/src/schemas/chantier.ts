import { z } from "zod";

export const chantierUpdateSchema = z.object({
  etape: z.string().min(1, "Etape requise"),
  avancement: z.number().min(0).max(100),
  commentaire: z.string().min(10, "Commentaire trop court")
});

export const paiementRequestSchema = z.object({
  etape: z.string().min(1),
  montantGNF: z.number().positive(),
  clientId: z.string().min(1)
});

export type ChantierUpdateData = z.infer<typeof chantierUpdateSchema>;
export type PaiementRequestData = z.infer<typeof paiementRequestSchema>;

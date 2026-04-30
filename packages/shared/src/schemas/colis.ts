import { z } from "zod";

export const colisSchema = z.object({
  type: z.enum(["electromenager", "materiaux", "effets_personnels"]),
  poids: z.number().positive("Poids requis").max(500),
  valeurDeclaree: z.number().positive("Valeur requise"),
  description: z.string().min(3, "Description requise"),
  adresseLivraison: z.string().min(10, "Adresse complete requise")
});

export type ColisFormData = z.infer<typeof colisSchema>;

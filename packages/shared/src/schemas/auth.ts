import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caracteres"),
  role: z.enum(["diaspora", "agence"])
});

export type LoginFormData = z.infer<typeof loginSchema>;

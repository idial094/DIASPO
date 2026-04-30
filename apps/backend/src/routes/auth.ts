import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { verify as totpVerify } from "otplib";
import { z } from "zod";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";

const publicLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["diaspora", "agence"]),
});

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  totp: z.string().length(6),
});

export async function authRoutes(app: FastifyInstance) {
  // ─── Public login (diaspora / agence) ───────────────────────────────────────
  app.post("/api/auth/login", async (request, reply) => {
    const payload = publicLoginSchema.parse(request.body);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, payload.email.toLowerCase()));

    if (!user) {
      return reply.code(401).send({ message: "Email ou mot de passe incorrect" });
    }

    if (user.role !== payload.role) {
      return reply.code(401).send({ message: "Rôle incorrect pour ce compte" });
    }

    if (!user.isActive) {
      return reply.code(403).send({ message: "Compte désactivé" });
    }

    const passwordOk = await bcrypt.compare(payload.password, user.passwordHash);
    if (!passwordOk) {
      return reply.code(401).send({ message: "Email ou mot de passe incorrect" });
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const token = app.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return reply.send({
      token,
      expiresIn: 60 * 60 * 8,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        location: user.location,
      },
    });
  });

  // ─── Admin login (TOTP required) ────────────────────────────────────────────
  app.post("/api/auth/admin/login", async (request, reply) => {
    const payload = adminLoginSchema.parse(request.body);

    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.email, payload.email.toLowerCase()));

    if (!admin || admin.role !== "admin") {
      return reply.code(401).send({ message: "Identifiants admin invalides" });
    }

    if (!admin.isActive) {
      return reply.code(403).send({ message: "Compte admin désactivé" });
    }

    const passwordOk = await bcrypt.compare(payload.password, admin.passwordHash);
    if (!passwordOk) {
      return reply.code(401).send({ message: "Identifiants admin invalides" });
    }

    // Verify TOTP
    if (!admin.totpSecret) {
      return reply.code(500).send({ message: "Configuration 2FA manquante" });
    }

    const totpValid = totpVerify({ token: payload.totp, secret: admin.totpSecret });

    if (!totpValid) {
      return reply.code(401).send({ message: "Code 2FA invalide" });
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, admin.id));

    const token = app.jwt.sign({
      sub: admin.id,
      email: admin.email,
      role: "admin",
    });

    return reply.send({
      token,
      expiresIn: 60 * 60 * 8,
      role: "admin",
    });
  });

  // ─── Get current user (authenticated) ───────────────────────────────────────
  app.get(
    "/api/auth/me",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, request.user.sub));

      if (!user) {
        return reply.code(404).send({ message: "Utilisateur introuvable" });
      }

      return reply.send({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        location: user.location,
      });
    }
  );

  // ─── Logout (stateless — client drops token) ────────────────────────────────
  app.post("/api/auth/logout", async (_request, reply) => {
    return reply.code(204).send();
  });
}

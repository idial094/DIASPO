import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { verify as totpVerify } from "otplib";
import { randomUUID } from "node:crypto";
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
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["diaspora", "agence"]),
  name: z.string().min(2),
  location: z.string().trim().optional(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/register", async (request, reply) => {
    const payload = registerSchema.parse(request.body);
    const normalizedEmail = payload.email.toLowerCase();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail));

    if (existing) {
      return reply.code(409).send({ message: "Cet email est deja utilise." });
    }

    const userId = `u-${payload.role}-${randomUUID().slice(0, 8)}`;
    const passwordHash = await bcrypt.hash(payload.password, 12);

    await db.insert(users).values({
      id: userId,
      email: normalizedEmail,
      passwordHash,
      name: payload.name.trim(),
      role: payload.role,
      location: payload.location?.trim() || null,
      isActive: true,
      totpEnabled: false,
      createdAt: new Date(),
    });

    const token = app.jwt.sign({
      sub: userId,
      email: normalizedEmail,
      role: payload.role,
    });

    return reply.code(201).send({
      token,
      expiresIn: 60 * 60 * 8,
      user: {
        id: userId,
        email: normalizedEmail,
        role: payload.role,
        name: payload.name.trim(),
        location: payload.location?.trim() || undefined,
      },
    });
  });

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

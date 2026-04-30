import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../db/client.js";
import {
  projects,
  payments,
  messages,
  documents,
  colis,
  users,
} from "../db/schema.js";

const createProjectSchema = z.object({
  title: z.string().min(2).max(100),
  location: z.string().min(2).max(100),
});
const createMessageSchema = z.object({ text: z.string().min(1) });
const createColisSchema = z.object({
  label: z.string().min(1),
  weightKg: z.number().positive(),
  description: z.string().optional(),
  adresseLivraison: z.string().optional(),
  valeurDeclaree: z.number().optional(),
});
const confirmPaymentSchema = z.object({
  method: z.enum(["card", "western_union"]),
});

export async function diasporaRoutes(app: FastifyInstance) {
  // All diaspora routes require auth
  const authHook = { preHandler: app.authenticate };

  // ─── List user's own projects ────────────────────────────────────────────────
  app.get("/api/projects", authHook, async (request) => {
    return db
      .select({
        id: projects.id,
        title: projects.title,
        location: projects.location,
        progress: projects.progress,
        status: projects.status,
        stage: projects.stage,
        estimatedCompletionDate: projects.estimatedCompletionDate,
      })
      .from(projects)
      .where(eq(projects.diasporaUserId, request.user.sub));
  });

  // ─── Create project (diaspora only) ─────────────────────────────────────────
  app.post("/api/projects", authHook, async (request, reply) => {
    if (request.user.role !== "diaspora") {
      return reply.code(403).send({ message: "Seuls les utilisateurs diaspora peuvent créer un projet." });
    }

    const { title, location } = createProjectSchema.parse(request.body);
    const id = `p-${randomUUID().slice(0, 8)}`;

    await db.insert(projects).values({
      id,
      diasporaUserId: request.user.sub,
      title: title.trim(),
      location: location.trim(),
      progress: 0,
      stage: "Initialisation",
      status: "en_cours",
    });

    return reply.code(201).send({ id });
  });

  // ─── Project summary ────────────────────────────────────────────────────────
  app.get("/api/projects/:id", authHook, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title,
        progress: projects.progress,
        status: projects.status,
        stage: projects.stage,
        estimatedCompletionDate: projects.estimatedCompletionDate,
        client: users.name,
      })
      .from(projects)
      .innerJoin(users, eq(users.id, projects.diasporaUserId))
      .where(eq(projects.id, id));

    if (!project) {
      return reply.code(404).send({ message: "Projet introuvable" });
    }

    return reply.send(project);
  });

  // ─── Payments ───────────────────────────────────────────────────────────────
  app.get("/api/projects/:id/payments", authHook, async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    return db.select().from(payments).where(eq(payments.projectId, id));
  });

  app.post(
    "/api/projects/:id/payments/:paymentId/confirm",
    authHook,
    async (request, reply) => {
      const { id, paymentId } = z
        .object({ id: z.string(), paymentId: z.string() })
        .parse(request.params);
      confirmPaymentSchema.parse(request.body);

      const [payment] = await db
        .select()
        .from(payments)
        .where(and(eq(payments.projectId, id), eq(payments.id, paymentId)));

      if (!payment) {
        return reply.code(404).send({ message: "Paiement introuvable" });
      }

      await db
        .update(payments)
        .set({ status: "paid", confirmedAt: new Date() })
        .where(eq(payments.id, paymentId));

      // Notify agence that payment was confirmed
      void app.notifications.sendToProjectRole(id, "agence", {
        title: "Paiement confirmé",
        body: `Un paiement de ${payment.amountGnf.toLocaleString("fr-FR")} GNF a été validé.`,
        data: { type: "payment_confirmed", projectId: id, paymentId },
      });

      return reply.code(204).send();
    }
  );

  // ─── Documents ──────────────────────────────────────────────────────────────
  app.get("/api/projects/:id/documents", authHook, async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const rows = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, id));

    return rows.map((doc) => ({
      id: doc.id,
      name: doc.name,
      date: doc.uploadedAt.toISOString().split("T")[0],
      size: doc.fileSize ?? "—",
      type: doc.fileType,
    }));
  });

  // ─── Messages ───────────────────────────────────────────────────────────────
  app.get("/api/messages/:projectId", authHook, async (request) => {
    const { projectId } = z.object({ projectId: z.string() }).parse(request.params);

    const rows = await db
      .select({
        id: messages.id,
        text: messages.text,
        authorRole: messages.authorRole,
        authorId: messages.authorId,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.projectId, projectId));

    return rows.map((msg) => ({
      id: String(msg.id),
      projectId,
      author: msg.authorId === request.user.sub ? "me" : "agency",
      text: msg.text,
      timestamp: new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(msg.createdAt),
    }));
  });

  app.post("/api/messages/:projectId", authHook, async (request, reply) => {
    const { projectId } = z.object({ projectId: z.string() }).parse(request.params);
    const { text } = createMessageSchema.parse(request.body);

    await db.insert(messages).values({
      projectId,
      authorId: request.user.sub,
      authorRole: request.user.role as "diaspora" | "agence",
      text: text.trim(),
    });

    return reply.code(201).send();
  });

  // ─── Colis ──────────────────────────────────────────────────────────────────
  app.get("/api/colis", authHook, async (request) => {
    return db
      .select()
      .from(colis)
      .where(eq(colis.senderId, request.user.sub));
  });

  app.post("/api/colis", authHook, async (request, reply) => {
    const payload = createColisSchema.parse(request.body);
    const id = `bl-${Date.now()}`;

    await db.insert(colis).values({
      id,
      senderId: request.user.sub,
      label: payload.label.trim(),
      weightKg: payload.weightKg,
      description: payload.description,
      deliveryAddress: payload.adresseLivraison,
      declaredValue: payload.valeurDeclaree,
      status: "paris",
      currentStep: "Paris",
    });

    return reply.code(201).send({ id });
  });
}

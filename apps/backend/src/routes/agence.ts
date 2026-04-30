import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import {
  projects,
  payments,
  messages,
  colis,
  users,
  chantierUpdates,
  paymentRequests,
} from "../db/schema.js";

const progressSchema = z.object({
  progress: z.number().min(0).max(100),
  stage: z.string().optional(),
  comment: z.string().optional(),
});

const createPaymentRequestSchema = z.object({
  projectId: z.string().min(1),
  stage: z.string().min(1),
  amountGnf: z.number().positive(),
});

const sendMessageSchema = z.object({ text: z.string().min(1) });

const updateColisStatusSchema = z.object({
  status: z.enum(["paris", "cdg", "en_vol", "conakry", "chantier", "livre", "douane"]),
});

export async function agenceRoutes(app: FastifyInstance) {
  const authHook = { preHandler: app.authenticate };

  // ─── Projects ───────────────────────────────────────────────────────────────
  app.get("/api/agence/projects", authHook, async () => {
    const rows = await db
      .select({
        id: projects.id,
        title: projects.title,
        location: projects.location,
        progress: projects.progress,
        stage: projects.stage,
        status: projects.status,
        clientName: users.name,
        clientLocation: users.location,
      })
      .from(projects)
      .innerJoin(users, eq(users.id, projects.diasporaUserId));

    return rows.map((row) => ({
      ...row,
      clientName: row.clientName,
    }));
  });

  app.patch("/api/agence/projects/:id/progress", authHook, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const payload = progressSchema.parse(request.body);

    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) {
      return reply.code(404).send({ message: "Projet introuvable" });
    }

    await db
      .update(projects)
      .set({
        progress: payload.progress,
        stage: payload.stage ?? project.stage,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id));

    // Log chantier update
    await db.insert(chantierUpdates).values({
      projectId: id,
      agenceUserId: request.user.sub,
      stage: payload.stage ?? project.stage,
      progress: payload.progress,
      comment: payload.comment,
    });

    // Notify diaspora client of progress update
    void app.notifications.sendToProjectRole(id, "diaspora", {
      title: "Mise à jour chantier",
      body: `Avancement: ${payload.progress}% — ${payload.stage ?? project.stage}`,
      data: { type: "chantier_update", projectId: id, progress: payload.progress },
    });

    return reply.code(204).send();
  });

  // ─── Payment requests ────────────────────────────────────────────────────────
  app.get("/api/agence/payments/requests", authHook, async (request) => {
    return db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.agenceUserId, request.user.sub));
  });

  app.post("/api/agence/payments/request", authHook, async (request, reply) => {
    const payload = createPaymentRequestSchema.parse(request.body);
    const id = `apr-${Date.now()}`;

    await db.insert(paymentRequests).values({
      id,
      projectId: payload.projectId,
      agenceUserId: request.user.sub,
      stage: payload.stage,
      amountGnf: payload.amountGnf,
      status: "pending",
    });

    // Also create a payment entry linked to the project
    await db.insert(payments).values({
      id: `pay-${Date.now()}`,
      projectId: payload.projectId,
      amountGnf: payload.amountGnf,
      stage: payload.stage,
      status: "pending",
    });

    // Notify diaspora client of new payment request
    void app.notifications.sendToProjectRole(payload.projectId, "diaspora", {
      title: "Demande de paiement",
      body: `${payload.stage} — ${payload.amountGnf.toLocaleString("fr-FR")} GNF`,
      data: { type: "payment_request", projectId: payload.projectId, requestId: id },
    });

    return reply.code(201).send({ id });
  });

  // ─── Messages (project-based, shared with diaspora) ─────────────────────────
  app.get("/api/agence/messages/projects", authHook, async () => {
    // Return list of projects the agence can message about
    const rows = await db
      .select({
        projectId: projects.id,
        projectTitle: projects.title,
        clientName: users.name,
      })
      .from(projects)
      .innerJoin(users, eq(users.id, projects.diasporaUserId));

    return rows;
  });

  app.get("/api/agence/messages/:projectId", authHook, async (request) => {
    const { projectId } = z.object({ projectId: z.string() }).parse(request.params);

    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.projectId, projectId));

    return rows.map((msg) => ({
      id: String(msg.id),
      projectId,
      author: msg.authorRole === "agence" ? "agency" : "client",
      text: msg.text,
      timestamp: new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(msg.createdAt),
    }));
  });

  app.post("/api/agence/messages/:projectId", authHook, async (request, reply) => {
    const { projectId } = z.object({ projectId: z.string() }).parse(request.params);
    const { text } = sendMessageSchema.parse(request.body);

    await db.insert(messages).values({
      projectId,
      authorId: request.user.sub,
      authorRole: "agence",
      text: text.trim(),
    });

    return reply.code(201).send();
  });

  // ─── Colis ──────────────────────────────────────────────────────────────────
  app.get("/api/agence/colis", authHook, async () => {
    const rows = await db
      .select({
        id: colis.id,
        label: colis.label,
        status: colis.status,
        currentStep: colis.currentStep,
        weightKg: colis.weightKg,
        hasCustomsIssue: colis.hasCustomsIssue,
        customsNote: colis.customsNote,
        updatedAt: colis.updatedAt,
        clientName: users.name,
      })
      .from(colis)
      .innerJoin(users, eq(users.id, colis.senderId));

    return rows;
  });

  app.patch("/api/agence/colis/:id/status", authHook, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const payload = updateColisStatusSchema.parse(request.body);

    const [colisItem] = await db.select().from(colis).where(eq(colis.id, id));
    if (!colisItem) {
      return reply.code(404).send({ message: "Colis introuvable" });
    }

    const stepLabels: Record<string, string> = {
      paris: "Paris",
      cdg: "CDG",
      en_vol: "Vol",
      conakry: "Conakry",
      chantier: "Chantier",
      livre: "Chantier",
      douane: "Conakry",
    };

    await db
      .update(colis)
      .set({
        status: payload.status,
        currentStep: stepLabels[payload.status] ?? payload.status,
        updatedAt: new Date(),
      })
      .where(eq(colis.id, id));

    return reply.code(204).send();
  });
}

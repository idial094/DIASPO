import type { FastifyInstance } from "fastify";
import { eq, count, sum } from "drizzle-orm";
import { z } from "zod";
import PDFDocument from "pdfkit";
import { createObjectCsvStringifier } from "csv-writer";
import { db } from "../db/client.js";
import { projects, payments, users, colis } from "../db/schema.js";

const updateStatusSchema = z.object({ status: z.string().min(1) });

export async function adminRoutes(app: FastifyInstance) {
  const authHook = { preHandler: app.requireAdmin };

  // ─── Dashboard KPIs ──────────────────────────────────────────────────────────
  app.get("/api/admin/dashboard", authHook, async () => {
    const activeRows = await db.select({ count: count() }).from(projects).where(eq(projects.status, "en_cours"));
    const clientRows = await db.select({ count: count() }).from(users).where(eq(users.role, "diaspora"));
    const retardRows = await db.select({ count: count() }).from(projects).where(eq(projects.status, "retard"));

    const activeProjects = activeRows[0]?.count ?? 0;
    const clients = clientRows[0]?.count ?? 0;
    const retard = retardRows[0]?.count ?? 0;

    return {
      kpis: { activeProjects, clients, satisfaction: 89, alerts: retard },
      monthlyPaymentsM: [4.2, 5.1, 6.8, 7.4, 8.3, 9.1],
      alerts: retard > 0 ? [`${retard} projet(s) en retard`] : [],
    };
  });

  // ─── Projects ────────────────────────────────────────────────────────────────
  app.get("/api/admin/projects", authHook, async () => {
    const rows = await db
      .select({
        id: projects.id,
        title: projects.title,
        location: projects.location,
        progress: projects.progress,
        status: projects.status,
        clientName: users.name,
      })
      .from(projects)
      .innerJoin(users, eq(users.id, projects.diasporaUserId));

    return rows.map((r) => ({ ...r, owner: r.clientName }));
  });

  app.patch("/api/admin/projects/:id/status", authHook, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const { status } = updateStatusSchema.parse(request.body);

    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) return reply.code(404).send({ message: "Projet introuvable" });

    await db
      .update(projects)
      .set({ status: status as typeof project.status, updatedAt: new Date() })
      .where(eq(projects.id, id));

    return reply.code(204).send();
  });

  // ─── Finances ────────────────────────────────────────────────────────────────
  app.get("/api/admin/finances", authHook, async () => {
    const paidRows = await db.select({ total: sum(payments.amountGnf) }).from(payments).where(eq(payments.status, "paid"));
    const pendingRows = await db.select({ total: sum(payments.amountGnf) }).from(payments).where(eq(payments.status, "pending"));

    const receivedGnf = Number(paidRows[0]?.total ?? 0);
    const pendingGnf = Number(pendingRows[0]?.total ?? 0);
    const eurEquivalent = Math.round(receivedGnf / 10000);

    const projectRows = await db
      .select({
        id: projects.id,
        title: projects.title,
        progress: projects.progress,
      })
      .from(projects);

    return {
      receivedGnf,
      pendingGnf,
      eurEquivalent,
      commissionPct: 7.2,
      byProject: projectRows.map((p) => ({
        projectId: p.id,
        label: p.title,
        consumedPct: p.progress,
      })),
    };
  });

  // ─── Users ───────────────────────────────────────────────────────────────────
  app.get("/api/admin/users", authHook, async () => {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        location: users.location,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users);

    return rows.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      location: u.location ?? "",
      status: u.isActive ? "active" : "inactive",
      lastLogin: u.lastLoginAt?.toISOString() ?? null,
    }));
  });

  app.patch("/api/admin/users/:id/status", authHook, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const { status } = z.object({ status: z.enum(["active", "inactive"]) }).parse(request.body);

    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return reply.code(404).send({ message: "Utilisateur introuvable" });

    await db
      .update(users)
      .set({ isActive: status === "active" })
      .where(eq(users.id, id));

    return reply.code(204).send();
  });

  // ─── Notifications (static for now) ──────────────────────────────────────────
  const adminNotifications = [
    { id: "an-001", level: "warning", title: "Retard chantier", description: "Vérifier les projets en retard.", unread: true },
    { id: "an-002", level: "info", title: "Paiement reçu", description: "Un versement a été validé.", unread: true },
  ];

  app.get("/api/admin/notifications", authHook, async () => adminNotifications);

  app.post("/api/admin/notifications/:id/read", authHook, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const n = adminNotifications.find((item) => item.id === id);
    if (!n) return reply.code(404).send({ message: "Notification introuvable" });
    n.unread = false;
    return reply.code(204).send();
  });

  app.post("/api/admin/notifications/read-all", authHook, async (_request, reply) => {
    for (const n of adminNotifications) n.unread = false;
    return reply.code(204).send();
  });

  // ─── Exports list ─────────────────────────────────────────────────────────────
  const exportCatalog = [
    { id: "monthly-report", name: "Rapport mensuel", format: "PDF" },
    { id: "accounting", name: "Comptabilité", format: "CSV" },
    { id: "clients", name: "Liste clients", format: "CSV" },
    { id: "projects", name: "Suivi projets", format: "PDF" },
    { id: "colis", name: "Colis", format: "CSV" },
    { id: "investors", name: "Rapport investisseurs", format: "PDF" },
  ];

  app.get("/api/admin/exports", authHook, async () => exportCatalog);

  app.post("/api/admin/exports/:id", authHook, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const catalog = exportCatalog.find((e) => e.id === id);
    if (!catalog) return reply.code(404).send({ message: "Export introuvable" });

    // ── CSV exports ─────────────────────────────────────────────────────────────
    if (catalog.format === "CSV") {
      let csvContent: string;

      if (id === "clients") {
        const rows = await db
          .select({ id: users.id, name: users.name, role: users.role, location: users.location, isActive: users.isActive })
          .from(users)
          .where(eq(users.role, "diaspora"));

        const stringifier = createObjectCsvStringifier({
          header: [
            { id: "id", title: "ID" },
            { id: "name", title: "Nom" },
            { id: "location", title: "Localisation" },
            { id: "status", title: "Statut" },
          ],
        });
        csvContent =
          stringifier.getHeaderString() +
          stringifier.stringifyRecords(
            rows.map((r) => ({ ...r, status: r.isActive ? "Actif" : "Inactif" }))
          );
      } else if (id === "accounting") {
        const rows = await db
          .select({
            id: payments.id,
            projectId: payments.projectId,
            amountGnf: payments.amountGnf,
            status: payments.status,
            stage: payments.stage,
            createdAt: payments.createdAt,
          })
          .from(payments);

        const stringifier = createObjectCsvStringifier({
          header: [
            { id: "id", title: "ID Paiement" },
            { id: "projectId", title: "Projet" },
            { id: "amountGnf", title: "Montant GNF" },
            { id: "status", title: "Statut" },
            { id: "stage", title: "Étape" },
            { id: "createdAt", title: "Date" },
          ],
        });
        csvContent =
          stringifier.getHeaderString() +
          stringifier.stringifyRecords(
            rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString().split("T")[0] }))
          );
      } else {
        // colis
        const rows = await db
          .select({
            id: colis.id,
            label: colis.label,
            weightKg: colis.weightKg,
            status: colis.status,
            currentStep: colis.currentStep,
            updatedAt: colis.updatedAt,
          })
          .from(colis);

        const stringifier = createObjectCsvStringifier({
          header: [
            { id: "id", title: "Bon de Livraison" },
            { id: "label", title: "Description" },
            { id: "weightKg", title: "Poids (kg)" },
            { id: "status", title: "Statut" },
            { id: "currentStep", title: "Étape actuelle" },
            { id: "updatedAt", title: "Mis à jour" },
          ],
        });
        csvContent =
          stringifier.getHeaderString() +
          stringifier.stringifyRecords(
            rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString().split("T")[0] }))
          );
      }

      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", `attachment; filename="${id}.csv"`);
      return reply.send(csvContent);
    }

    // ── PDF exports ──────────────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const finish = new Promise<Buffer>((resolve) =>
      doc.on("end", () => resolve(Buffer.concat(chunks)))
    );

    // Header
    doc
      .fontSize(20)
      .fillColor("#1A6FC4")
      .text("DIASPO", 50, 50)
      .fillColor("#333333")
      .fontSize(14)
      .text(catalog.name, 50, 78)
      .fontSize(10)
      .fillColor("#888888")
      .text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 50, 98)
      .moveTo(50, 118)
      .lineTo(545, 118)
      .strokeColor("#1A6FC4")
      .stroke();

    let y = 140;

    if (id === "monthly-report" || id === "investors") {
      const pdfPaidRows = await db.select({ total: sum(payments.amountGnf) }).from(payments).where(eq(payments.status, "paid"));
      const pdfPendingRows = await db.select({ total: sum(payments.amountGnf) }).from(payments).where(eq(payments.status, "pending"));
      const projectRows = await db.select({ id: projects.id, title: projects.title, progress: projects.progress, status: projects.status }).from(projects);

      const receivedGnf = Number(pdfPaidRows[0]?.total ?? 0);
      const pendingGnf = Number(pdfPendingRows[0]?.total ?? 0);

      doc
        .fontSize(12)
        .fillColor("#333333")
        .text("Résumé financier", 50, y, { underline: true });
      y += 22;
      doc.fontSize(10).fillColor("#555555");
      doc.text(`Paiements reçus : ${receivedGnf.toLocaleString("fr-FR")} GNF`, 50, y); y += 16;
      doc.text(`Équivalent EUR : ${Math.round(receivedGnf / 10000).toLocaleString("fr-FR")} €`, 50, y); y += 16;
      doc.text(`En attente : ${pendingGnf.toLocaleString("fr-FR")} GNF`, 50, y); y += 30;

      doc.fontSize(12).fillColor("#333333").text("Projets actifs", 50, y, { underline: true });
      y += 22;

      for (const p of projectRows) {
        if (y > 720) { doc.addPage(); y = 50; }
        doc
          .fontSize(10)
          .fillColor("#333333")
          .text(`${p.title}`, 50, y)
          .fillColor("#888888")
          .text(`${p.progress}% — ${p.status}`, 300, y);
        y += 18;
      }
    } else {
      // projects PDF
      const projectRows = await db
        .select({
          id: projects.id,
          title: projects.title,
          location: projects.location,
          progress: projects.progress,
          status: projects.status,
          clientName: users.name,
        })
        .from(projects)
        .innerJoin(users, eq(users.id, projects.diasporaUserId));

      doc.fontSize(12).fillColor("#333333").text("Liste des projets", 50, y, { underline: true });
      y += 22;

      for (const p of projectRows) {
        if (y > 720) { doc.addPage(); y = 50; }
        doc
          .fontSize(10)
          .fillColor("#333333")
          .text(`${p.title} — ${p.location}`, 50, y)
          .fillColor("#888888")
          .text(`Client: ${p.clientName}  |  ${p.progress}%  |  ${p.status}`, 50, y + 14);
        y += 34;
      }
    }

    doc.end();
    const pdfBuffer = await finish;

    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `attachment; filename="${id}.pdf"`);
    return reply.send(pdfBuffer);
  });
}

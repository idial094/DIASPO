import { http, HttpResponse } from "msw";
import { payments } from "./data/payments";
import { projects } from "./data/projects";
import { colis } from "./data/colis";
import { messages } from "./data/messages";
import { documents } from "./data/documents";
import { agenceProjects } from "./data/agence/projects";
import { agencePaymentRequests } from "./data/agence/paymentRequests";
import { agenceConversations, agenceMessages } from "./data/agence/messages";
import { agenceColis } from "./data/agence/colis";
import { adminDashboard } from "./data/admin/dashboard";
import { adminProjects } from "./data/admin/projects";
import { adminFinances } from "./data/admin/finances";
import { adminUsers } from "./data/admin/users";
import { adminNotifications } from "./data/admin/notifications";
import { adminExports } from "./data/admin/exports";

export const handlers = [
  http.post("/api/auth/login", async () => {
    return HttpResponse.json({
      token: "mock-auth-token",
      role: "diaspora"
    });
  }),
  http.post("/api/auth/admin/login", async () => {
    return HttpResponse.json({
      token: "mock-admin-token",
      role: "admin"
    });
  }),
  http.get("/api/projects/:id", ({ params }) => {
    const project = projects.find((item) => item.id === params.id) ?? projects[0];
    return HttpResponse.json(project);
  }),
  http.get("/api/projects/:id/payments", () => {
    return HttpResponse.json(payments);
  }),
  http.post("/api/projects/:id/payments/:paymentId/confirm", ({ params }) => {
    const payment = payments.find(
      (item) => item.projectId === params.id && item.id === params.paymentId
    );
    if (payment) {
      payment.status = "paid";
    }
    return HttpResponse.json({ ok: true });
  }),
  http.get("/api/projects/:id/documents", ({ params }) => {
    const list = documents.filter((item) => item.projectId === params.id);
    return HttpResponse.json(list);
  }),
  http.get("/api/messages/:projectId", ({ params }) => {
    const list = messages.filter((item) => item.projectId === params.projectId);
    return HttpResponse.json(list);
  }),
  http.post("/api/messages/:projectId", async ({ params, request }) => {
    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim();
    if (text) {
      messages.push({
        id: `msg-${Date.now()}`,
        projectId: String(params.projectId),
        author: "me",
        text,
        timestamp: "A l'instant"
      });
    }
    return HttpResponse.json({ ok: true });
  }),
  http.get("/api/colis", () => {
    return HttpResponse.json(colis);
  }),
  http.post("/api/colis", async ({ request }) => {
    const body = (await request.json()) as {
      label?: string;
      weightKg?: number;
    };
    colis.unshift({
      id: `bl-${Date.now()}`,
      label: body.label?.trim() || "Colis",
      status: "en_vol",
      currentStep: "Paris",
      weightKg: body.weightKg && Number.isFinite(body.weightKg) ? body.weightKg : 0,
      lastUpdate: new Date().toISOString()
    });
    return HttpResponse.json({ ok: true });
  }),
  http.get("/api/agence/projects", () => {
    return HttpResponse.json(agenceProjects);
  }),
  http.patch("/api/agence/projects/:id/progress", async ({ params, request }) => {
    const body = (await request.json()) as { progress?: number; stage?: string };
    const project = agenceProjects.find((item) => item.id === params.id);
    if (project) {
      if (typeof body.progress === "number") {
        project.progress = Math.max(0, Math.min(100, body.progress));
      }
      if (body.stage) {
        project.stage = body.stage;
      }
    }
    return HttpResponse.json({ ok: true });
  }),
  http.get("/api/agence/payments/requests", () => {
    return HttpResponse.json(agencePaymentRequests);
  }),
  http.post("/api/agence/payments/request", async ({ request }) => {
    const body = (await request.json()) as {
      projectId?: string;
      clientName?: string;
      stage?: string;
      amountGnf?: number;
    };
    agencePaymentRequests.unshift({
      id: `apr-${Date.now()}`,
      projectId: body.projectId || "p-001",
      clientName: body.clientName || "Client",
      stage: body.stage || "Etape",
      amountGnf: body.amountGnf && Number.isFinite(body.amountGnf) ? body.amountGnf : 0,
      status: "pending",
      createdAt: new Date().toISOString()
    });
    return HttpResponse.json({ ok: true });
  }),
  http.get("/api/agence/messages/projects", () => {
    return HttpResponse.json(agenceConversations);
  }),
  http.get("/api/agence/messages/:projectId", ({ params }) => {
    return HttpResponse.json(
      agenceMessages.filter((item) => item.projectId === params.projectId)
    );
  }),
  http.post("/api/agence/messages/:projectId", async ({ params, request }) => {
    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim();
    if (text) {
      agenceMessages.push({
        id: `agmsg-${Date.now()}`,
        projectId: String(params.projectId),
        author: "agency",
        text,
        timestamp: "À l'instant",
      });
    }
    return HttpResponse.json({ ok: true });
  }),
  http.get("/api/agence/colis", () => {
    return HttpResponse.json(agenceColis);
  }),
  http.patch("/api/agence/colis/:id/status", async ({ params, request }) => {
    const body = (await request.json()) as { status?: string };
    const item = agenceColis.find((colisItem) => colisItem.id === params.id);
    if (item && body.status) {
      item.status = body.status;
      item.updatedAt = new Date().toISOString();
    }
    return HttpResponse.json({ ok: true });
  }),
  http.get("/api/admin/dashboard", () => {
    return HttpResponse.json(adminDashboard);
  }),
  http.get("/api/admin/projects", () => {
    return HttpResponse.json(adminProjects);
  }),
  http.patch("/api/admin/projects/:id/status", async ({ params, request }) => {
    const body = (await request.json()) as { status?: string };
    const project = adminProjects.find((item) => item.id === params.id);
    if (project && body.status) {
      project.status = body.status;
    }
    return HttpResponse.json({ ok: true });
  }),
  http.get("/api/admin/finances", () => {
    return HttpResponse.json(adminFinances);
  }),
  http.get("/api/admin/users", () => {
    return HttpResponse.json(adminUsers);
  }),
  http.patch("/api/admin/users/:id/status", async ({ params, request }) => {
    const body = (await request.json()) as { status?: string };
    const user = adminUsers.find((item) => item.id === params.id);
    if (user && body.status) {
      user.status = body.status;
    }
    return HttpResponse.json({ ok: true });
  }),
  http.get("/api/admin/notifications", () => {
    return HttpResponse.json(adminNotifications);
  }),
  http.post("/api/admin/notifications/:id/read", ({ params }) => {
    const notif = adminNotifications.find((item) => item.id === params.id);
    if (notif) {
      notif.unread = false;
    }
    return HttpResponse.json({ ok: true });
  }),
  http.post("/api/admin/notifications/read-all", () => {
    adminNotifications.forEach((item) => {
      item.unread = false;
    });
    return HttpResponse.json({ ok: true });
  }),
  http.get("/api/admin/exports", () => {
    return HttpResponse.json(adminExports);
  }),
  http.post("/api/admin/exports/:id", () => {
    return HttpResponse.json({ ok: true });
  })
];

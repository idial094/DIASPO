import { endpoints } from "./endpoints";
import { projects } from "./mocks/data/projects";
import { payments } from "./mocks/data/payments";
import { messages } from "./mocks/data/messages";
import { documents } from "./mocks/data/documents";
import { colis } from "./mocks/data/colis";
import { agenceProjects } from "./mocks/data/agence/projects";
import { agencePaymentRequests } from "./mocks/data/agence/paymentRequests";
import { agenceConversations, agenceMessages } from "./mocks/data/agence/messages";
import { agenceColis } from "./mocks/data/agence/colis";
import { adminDashboard } from "./mocks/data/admin/dashboard";
import { adminProjects } from "./mocks/data/admin/projects";
import { adminFinances } from "./mocks/data/admin/finances";
import { adminUsers } from "./mocks/data/admin/users";
import { adminNotifications } from "./mocks/data/admin/notifications";
import { adminExports } from "./mocks/data/admin/exports";

declare const process: {
  env: Record<string, string | undefined>;
};

const useRealApi =
  process.env.NEXT_PUBLIC_USE_REAL_API === "true" ||
  process.env.EXPO_PUBLIC_USE_REAL_API === "true";
const allowApiMockFallback =
  (process.env.NEXT_PUBLIC_ALLOW_API_MOCK_FALLBACK ??
    process.env.EXPO_PUBLIC_ALLOW_API_MOCK_FALLBACK ??
    "true") === "true";
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "http://localhost:4000";

// Pluggable token provider — set by the host app after authentication.
// Returns null when the user is not logged in.
let _tokenProvider: (() => string | null) | null = null;

export function setTokenProvider(fn: () => string | null) {
  _tokenProvider = fn;
}

class ApiHttpError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? `API error: ${status}`);
    this.status = status;
  }
}

function extractHttpStatus(error: unknown): number | null {
  if (error instanceof ApiHttpError) return error.status;
  if (error instanceof Error) {
    const match = error.message.match(/API error:\s*(\d{3})/i);
    if (match) return Number(match[1]);
  }
  return null;
}

function shouldUseMockFallback(error: unknown): boolean {
  if (!useRealApi) return true;
  if (!allowApiMockFallback) return false;
  const status = extractHttpStatus(error);
  // In frontend-first mode, auth is not always wired yet.
  // Keep UI usable when protected API returns 401/403.
  return status === 401 || status === 403;
}

function authHeaders(): Record<string, string> {
  const token = _tokenProvider?.();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function resolveApiInput(input: Parameters<typeof fetch>[0]): Parameters<typeof fetch>[0] {
  if (!useRealApi) return input;
  if (typeof input !== "string") return input;
  if (!input.startsWith("/")) return input;
  return `${apiBaseUrl}${input}`;
}

const apiFetch = ((input: Parameters<typeof globalThis.fetch>[0], init?: Parameters<typeof globalThis.fetch>[1]) => {
  const headers = {
    ...authHeaders(),
    ...(init?.headers as Record<string, string> | undefined),
  };
  const hasAuthorization = typeof headers.Authorization === "string" && headers.Authorization.length > 0;
  if (useRealApi && typeof input === "string" && input.startsWith("/api/admin/") && !hasAuthorization) {
    throw new ApiHttpError(403, "API error: 403");
  }
  return globalThis.fetch(resolveApiInput(input), { ...init, headers });
}) as typeof globalThis.fetch;

export interface ProjectListItem {
  id: string;
  title: string;
  location: string;
  progress: number;
  status: string;
  stage: string;
  estimatedCompletionDate: string | null;
}

export interface CreateProjectPayload {
  title: string;
  location: string;
}

export async function getMyProjects(): Promise<ProjectListItem[]> {
  try {
    const response = await apiFetch(endpoints.diaspora.projects);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return (await response.json()) as ProjectListItem[];
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return projects.map((p) => ({
      id: p.id,
      title: p.title,
      location: "Conakry, Guinée",
      progress: p.progress,
      status: p.status,
      stage: p.status,
      estimatedCompletionDate: null,
    }));
  }
}

export async function createProject(payload: CreateProjectPayload): Promise<{ id: string }> {
  const response = await apiFetch(endpoints.diaspora.projects, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `Erreur lors de la création du projet (${response.status})`);
  }
  return (await response.json()) as { id: string };
}

export interface ProjectSummary {
  id: string;
  client: string;
  title: string;
  progress: number;
  status: string;
  stage: string;
}

export async function getProjectSummary(projectId: string): Promise<ProjectSummary> {
  try {
    const response = await apiFetch(endpoints.diaspora.project(projectId), {
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return (await response.json()) as ProjectSummary;
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    const fallback = projects.find((item) => item.id === projectId);
    if (fallback) {
      return { ...fallback, stage: fallback.status };
    }

    return {
      id: "fallback-project",
      client: "Client inconnu",
      title: "Projet",
      progress: 0,
      status: "inconnu",
      stage: "inconnu",
    };
  }
}

export interface PaymentItem {
  id: string;
  projectId: string;
  amountGnf: number;
  amountEur?: number | null;
  status: string;
  stage?: string | null;
  createdAt: string;
}

export interface CreateStripePaymentIntentPayload {
  projectId: string;
  paymentId: string;
  amountGnf: number;
}

export interface StripePaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export async function createStripePaymentIntent(
  payload: CreateStripePaymentIntentPayload
): Promise<StripePaymentIntentResult> {
  try {
    const response = await apiFetch(endpoints.payments.createIntent, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return (await response.json()) as StripePaymentIntentResult;
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return {
      clientSecret: `mock_client_secret_${Date.now()}`,
      paymentIntentId: `pi_mock_${Date.now()}`
    };
  }
}

export async function getProjectPayments(projectId: string): Promise<PaymentItem[]> {
  try {
    const response = await apiFetch(endpoints.diaspora.payments(projectId));
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return (await response.json()) as PaymentItem[];
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return payments.filter((item) => item.projectId === projectId);
  }
}

export async function confirmProjectPayment(
  projectId: string,
  paymentId: string
): Promise<void> {
  try {
    const response = await apiFetch(endpoints.diaspora.paymentConfirm(projectId, paymentId), {
      method: "POST"
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    const payment = payments.find(
      (item) => item.projectId === projectId && item.id === paymentId
    );
    if (payment) {
      payment.status = "paid";
    }
  }
}

export interface MessageItem {
  id: string;
  projectId: string;
  author: "me" | "agency";
  text: string;
  timestamp: string;
}

export async function getProjectMessages(projectId: string): Promise<MessageItem[]> {
  try {
    const response = await apiFetch(endpoints.diaspora.messages(projectId));
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return (await response.json()) as MessageItem[];
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return messages
      .filter((item) => item.projectId === projectId)
      .map((item) => ({ ...item, author: item.author as "me" | "agency" }));
  }
}

export async function sendProjectMessage(
  projectId: string,
  text: string
): Promise<void> {
  try {
    const response = await apiFetch(endpoints.diaspora.messages(projectId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    messages.push({
      id: `msg-${Date.now()}`,
      projectId,
      author: "me",
      text: text.trim(),
      timestamp: "A l'instant"
    });
  }
}

export interface DocumentItem {
  id: string;
  projectId: string;
  name: string;
  date: string;
  size: string;
  type: string;
}

export async function getProjectDocuments(projectId: string): Promise<DocumentItem[]> {
  try {
    const response = await apiFetch(endpoints.diaspora.documents(projectId));
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return (await response.json()) as DocumentItem[];
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return documents.filter((item) => item.projectId === projectId);
  }
}

export interface ColisItem {
  id: string;
  label: string;
  status: string;
  currentStep: string;
  weightKg: number;
  lastUpdate: string;
}

export async function getColis(): Promise<ColisItem[]> {
  try {
    const response = await apiFetch(endpoints.diaspora.colis);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return (await response.json()) as ColisItem[];
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return colis;
  }
}

export interface CreateColisPayload {
  label: string;
  weightKg: number;
}

export async function createColisRequest(payload: CreateColisPayload): Promise<void> {
  try {
    const response = await apiFetch(endpoints.diaspora.colis, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    colis.unshift({
      id: `bl-${Date.now()}`,
      label: payload.label.trim() || "Colis",
      status: "en_vol",
      currentStep: "Paris",
      weightKg: Number.isFinite(payload.weightKg) ? payload.weightKg : 0,
      lastUpdate: new Date().toISOString()
    });
  }
}

export interface AgenceProjectItem {
  id: string;
  clientName: string;
  location: string;
  title: string;
  stage: string;
  progress: number;
  status: string;
}

export async function getAgenceProjects(): Promise<AgenceProjectItem[]> {
  try {
    const response = await apiFetch(endpoints.agence.projects);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return (await response.json()) as AgenceProjectItem[];
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return agenceProjects;
  }
}

export async function updateAgenceProjectProgress(
  projectId: string,
  payload: { progress: number; stage?: string }
): Promise<void> {
  try {
    const response = await apiFetch(endpoints.agence.updateProgress(projectId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    const project = agenceProjects.find((item) => item.id === projectId);
    if (project) {
      project.progress = Math.max(0, Math.min(100, payload.progress));
      if (payload.stage) project.stage = payload.stage;
    }
  }
}

export interface AgencePaymentRequestItem {
  id: string;
  projectId: string;
  clientName: string;
  stage: string;
  amountGnf: number;
  status: string;
  createdAt: string;
}

export async function getAgencePaymentRequests(): Promise<AgencePaymentRequestItem[]> {
  try {
    const response = await apiFetch(endpoints.agence.paymentRequests);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return (await response.json()) as AgencePaymentRequestItem[];
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return agencePaymentRequests;
  }
}

export interface CreateAgencePaymentRequestPayload {
  projectId: string;
  clientName: string;
  stage: string;
  amountGnf: number;
}

export async function createAgencePaymentRequest(
  payload: CreateAgencePaymentRequestPayload
): Promise<void> {
  try {
    const response = await apiFetch(endpoints.agence.createPaymentRequest, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    agencePaymentRequests.unshift({
      id: `apr-${Date.now()}`,
      projectId: payload.projectId,
      clientName: payload.clientName,
      stage: payload.stage,
      amountGnf: payload.amountGnf,
      status: "pending",
      createdAt: new Date().toISOString()
    });
  }
}

export interface AgenceConversation {
  projectId: string;
  projectTitle: string;
  clientName: string;
}

export async function getAgenceConversations(): Promise<AgenceConversation[]> {
  try {
    const response = await apiFetch(endpoints.agence.conversations);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return (await response.json()) as AgenceConversation[];
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return agenceConversations;
  }
}

export interface AgenceMessageItem {
  id: string;
  projectId: string;
  author: "agency" | "client";
  text: string;
  timestamp: string;
}

export async function getAgenceMessages(
  projectId: string
): Promise<AgenceMessageItem[]> {
  try {
    const response = await apiFetch(endpoints.agence.messages(projectId));
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return (await response.json()) as AgenceMessageItem[];
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return agenceMessages
      .filter((item) => item.projectId === projectId)
      .map((item) => ({ ...item, author: item.author as "agency" | "client" }));
  }
}

export async function sendAgenceMessage(
  projectId: string,
  text: string
): Promise<void> {
  try {
    const response = await apiFetch(endpoints.agence.messages(projectId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    agenceMessages.push({
      id: `agmsg-${Date.now()}`,
      projectId,
      author: "agency",
      text: text.trim(),
      timestamp: "À l'instant",
    });
  }
}

export interface AgenceColisItem {
  id: string;
  clientName: string;
  label: string;
  status: string;
  issue: string | null;
  weightKg: number;
  updatedAt: string;
}

export async function getAgenceColis(): Promise<AgenceColisItem[]> {
  try {
    const response = await apiFetch(endpoints.agence.colis);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return (await response.json()) as AgenceColisItem[];
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return agenceColis;
  }
}

export async function updateAgenceColisStatus(
  id: string,
  status: string
): Promise<void> {
  try {
    const response = await apiFetch(endpoints.agence.updateColisStatus(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    const item = agenceColis.find((colisItem) => colisItem.id === id);
    if (item) {
      item.status = status;
      item.updatedAt = new Date().toISOString();
    }
  }
}

export interface AdminDashboardData {
  kpis: {
    activeProjects: number;
    clients: number;
    satisfaction: number;
    alerts: number;
  };
  monthlyPaymentsM: number[];
  alerts: string[];
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  try {
    const response = await apiFetch(endpoints.admin.dashboard);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return (await response.json()) as AdminDashboardData;
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return adminDashboard;
  }
}

export type AdminProjectItem = (typeof adminProjects)[number];
export async function getAdminProjects(): Promise<AdminProjectItem[]> {
  try {
    const response = await apiFetch(endpoints.admin.projects);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return (await response.json()) as AdminProjectItem[];
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return adminProjects;
  }
}

export async function updateAdminProjectStatus(
  id: string,
  status: string
): Promise<void> {
  try {
    const response = await apiFetch(endpoints.admin.updateProjectStatus(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    const project = adminProjects.find((item) => item.id === id);
    if (project) {
      project.status = status;
    }
  }
}

export interface AdminFinancesData {
  receivedGnf: number;
  pendingGnf: number;
  eurEquivalent: number;
  commissionPct: number;
  byProject: Array<{ projectId: string; label: string; consumedPct: number }>;
}
export async function getAdminFinances(): Promise<AdminFinancesData> {
  try {
    const response = await apiFetch(endpoints.admin.finances);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return (await response.json()) as AdminFinancesData;
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return adminFinances;
  }
}

export type AdminUserItem = (typeof adminUsers)[number];
export async function getAdminUsers(): Promise<AdminUserItem[]> {
  try {
    const response = await apiFetch(endpoints.admin.users);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return (await response.json()) as AdminUserItem[];
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return adminUsers;
  }
}

export async function updateAdminUserStatus(
  id: string,
  status: "active" | "inactive"
): Promise<void> {
  try {
    const response = await apiFetch(endpoints.admin.updateUserStatus(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    const user = adminUsers.find((item) => item.id === id);
    if (user) user.status = status;
  }
}

export type AdminNotificationItem = (typeof adminNotifications)[number];
export async function getAdminNotifications(): Promise<AdminNotificationItem[]> {
  try {
    const response = await apiFetch(endpoints.admin.notifications);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return (await response.json()) as AdminNotificationItem[];
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return adminNotifications;
  }
}

export async function markAdminNotificationRead(id: string): Promise<void> {
  try {
    const response = await apiFetch(endpoints.admin.markNotificationRead(id), {
      method: "POST"
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    const notif = adminNotifications.find((item) => item.id === id);
    if (notif) notif.unread = false;
  }
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  try {
    const response = await apiFetch(endpoints.admin.markAllNotificationsRead, {
      method: "POST"
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    adminNotifications.forEach((item) => {
      item.unread = false;
    });
  }
}

export type AdminExportItem = (typeof adminExports)[number];
export async function getAdminExports(): Promise<AdminExportItem[]> {
  try {
    const response = await apiFetch(endpoints.admin.exports);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return (await response.json()) as AdminExportItem[];
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return adminExports;
  }
}

export async function runAdminExport(id: string): Promise<void> {
  try {
    const response = await apiFetch(endpoints.admin.runExport(id), { method: "POST" });
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    // Trigger browser download
    const contentDisposition = response.headers.get("Content-Disposition") ?? "";
    const filename = contentDisposition.match(/filename="?([^"]+)"?/)?.[1] ?? `${id}.download`;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
  }
}

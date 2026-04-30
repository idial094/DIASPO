/**
 * Run with: npx tsx src/db/seed.ts
 * Seeds the database with initial development data.
 * Safe to run multiple times (upserts, not duplicates).
 */

import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateSecret, generateURI } from "otplib";
import {
  users,
  projects,
  payments,
  messages,
  documents,
  colis,
  paymentRequests,
} from "./schema.js";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

const sql = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(sql);

console.log("Seeding database...");

// ─── Users ────────────────────────────────────────────────────────────────────

const passwordHash = await bcrypt.hash("motdepasse123", 12);
const adminPasswordHash = await bcrypt.hash(
  process.env.ADMIN_PASSWORD ?? "Admin123!",
  12
);
const totpSecret = generateSecret();

const seedUsers = [
  {
    id: "u-diaspora-001",
    email: "mariam@example.com",
    passwordHash,
    name: "Mariam Kouyaté",
    role: "diaspora" as const,
    location: "Paris, France",
  },
  {
    id: "u-diaspora-002",
    email: "ibrahima@example.com",
    passwordHash,
    name: "Ibrahima Diallo",
    role: "diaspora" as const,
    location: "Lyon, France",
  },
  {
    id: "u-diaspora-003",
    email: "aissatou@example.com",
    passwordHash,
    name: "Aissatou Barry",
    role: "diaspora" as const,
    location: "Montréal, Canada",
  },
  {
    id: "u-agence-001",
    email: "agence@diaspo.app",
    passwordHash,
    name: "Agence Conakry",
    role: "agence" as const,
    location: "Conakry, Guinée",
  },
  {
    id: "u-admin-001",
    email: process.env.ADMIN_EMAIL ?? "admin@diaspo.app",
    passwordHash: adminPasswordHash,
    name: "Administrateur",
    role: "admin" as const,
    totpSecret,
    totpEnabled: true,
  },
];

for (const user of seedUsers) {
  const existing = await db.select().from(users).where(eq(users.id, user.id));
  if (existing.length === 0) {
    await db.insert(users).values(user);
    console.log(`  ✓ User: ${user.email}`);
  } else {
    console.log(`  → User already exists: ${user.email}`);
  }
}

// Print TOTP secret for the admin so it can be scanned into an authenticator app
const adminUser = await db.select().from(users).where(eq(users.id, "u-admin-001"));
if (adminUser[0]?.totpSecret) {
  const otpUri = generateURI({
    secret: adminUser[0].totpSecret,
    label: process.env.ADMIN_EMAIL ?? "admin@diaspo.app",
    issuer: "Diaspo App",
  });
  console.log("\n  📲 Admin TOTP secret:", adminUser[0].totpSecret);
  console.log("  🔗 OTP Auth URI (scan with Google Authenticator):");
  console.log(" ", otpUri, "\n");
}

// ─── Projects ─────────────────────────────────────────────────────────────────

const seedProjects = [
  {
    id: "p-001",
    diasporaUserId: "u-diaspora-001",
    agenceUserId: "u-agence-001",
    title: "Villa Ratoma",
    location: "Ratoma, Conakry",
    progress: 47,
    stage: "Élévation des murs (Étape 3)",
    status: "en_cours" as const,
    estimatedCompletionDate: "Juillet 2025",
  },
  {
    id: "p-002",
    diasporaUserId: "u-diaspora-002",
    agenceUserId: "u-agence-001",
    title: "Maison Dixinn",
    location: "Dixinn, Conakry",
    progress: 90,
    stage: "Finitions",
    status: "livraison_proche" as const,
    estimatedCompletionDate: "Avril 2025",
  },
  {
    id: "p-003",
    diasporaUserId: "u-diaspora-003",
    agenceUserId: "u-agence-001",
    title: "Duplex Kaloum",
    location: "Kaloum, Conakry",
    progress: 15,
    stage: "Fondations",
    status: "retard" as const,
    estimatedCompletionDate: "Octobre 2025",
  },
];

for (const project of seedProjects) {
  const existing = await db.select().from(projects).where(eq(projects.id, project.id));
  if (existing.length === 0) {
    await db.insert(projects).values(project);
    console.log(`  ✓ Project: ${project.title}`);
  } else {
    console.log(`  → Project already exists: ${project.title}`);
  }
}

// ─── Payments ─────────────────────────────────────────────────────────────────

const seedPayments = [
  { id: "pay-001", projectId: "p-001", amountGnf: 4200000, amountEur: 450, status: "pending" as const, stage: "Élévation des murs" },
  { id: "pay-002", projectId: "p-001", amountGnf: 3900000, amountEur: 418, status: "paid" as const, stage: "Fondations" },
  { id: "pay-003", projectId: "p-001", amountGnf: 4500000, amountEur: 482, status: "paid" as const, stage: "Préparation terrain" },
  { id: "pay-004", projectId: "p-002", amountGnf: 8200000, amountEur: 879, status: "paid" as const, stage: "Finitions" },
  { id: "pay-005", projectId: "p-003", amountGnf: 2100000, amountEur: 225, status: "paid" as const, stage: "Fondations" },
];

for (const payment of seedPayments) {
  const existing = await db.select().from(payments).where(eq(payments.id, payment.id));
  if (existing.length === 0) {
    await db.insert(payments).values(payment);
    console.log(`  ✓ Payment: ${payment.id}`);
  }
}

// ─── Messages ─────────────────────────────────────────────────────────────────

const existingMessages = await db.select().from(messages);
if (existingMessages.length === 0) {
  await db.insert(messages).values([
    { projectId: "p-001", authorId: "u-agence-001", authorRole: "agence", text: "Bonjour Mariam, les photos des murs sont disponibles dans votre galerie." },
    { projectId: "p-001", authorId: "u-diaspora-001", authorRole: "diaspora", text: "Merci, je vais vérifier le dossier documents." },
    { projectId: "p-001", authorId: "u-agence-001", authorRole: "agence", text: "Parfait. Le paiement pour l'étape murs est en attente de votre validation." },
  ]);
  console.log("  ✓ Messages seeded");
}

// ─── Documents ────────────────────────────────────────────────────────────────

const seedDocuments = [
  { id: "doc-001", projectId: "p-001", name: "Permis de construire.pdf", fileSize: "1.2 MB", fileType: "pdf" },
  { id: "doc-002", projectId: "p-001", name: "Contrat agence.pdf", fileSize: "860 KB", fileType: "pdf" },
  { id: "doc-003", projectId: "p-001", name: "Devis initial.pdf", fileSize: "540 KB", fileType: "pdf" },
  { id: "doc-004", projectId: "p-001", name: "Rapport hebdomadaire #08.pdf", fileSize: "2.4 MB", fileType: "pdf" },
  { id: "doc-005", projectId: "p-001", name: "Reçu paiement fondations.pdf", fileSize: "310 KB", fileType: "pdf" },
];

for (const doc of seedDocuments) {
  const existing = await db.select().from(documents).where(eq(documents.id, doc.id));
  if (existing.length === 0) {
    await db.insert(documents).values(doc);
    console.log(`  ✓ Document: ${doc.name}`);
  }
}

// ─── Colis ────────────────────────────────────────────────────────────────────

const seedColis = [
  { id: "bl-2025-0047", senderId: "u-diaspora-001", projectId: "p-001", label: "Électroménager", weightKg: 30, status: "en_vol" as const, currentStep: "Vol" },
  { id: "bl-2025-0031", senderId: "u-diaspora-001", projectId: "p-001", label: "Carrelage", weightKg: 45, status: "chantier" as const, currentStep: "Chantier" },
  { id: "bl-2025-0046", senderId: "u-diaspora-003", projectId: "p-003", label: "Quincaillerie", weightKg: 22, status: "douane" as const, currentStep: "Conakry", hasCustomsIssue: true, customsNote: "Documents manquants" },
];

for (const colisItem of seedColis) {
  const existing = await db.select().from(colis).where(eq(colis.id, colisItem.id));
  if (existing.length === 0) {
    await db.insert(colis).values(colisItem);
    console.log(`  ✓ Colis: ${colisItem.id}`);
  }
}

// ─── Payment Requests ─────────────────────────────────────────────────────────

const seedPayReqs = [
  { id: "apr-001", projectId: "p-001", agenceUserId: "u-agence-001", stage: "Étape 4 - Murs", amountGnf: 4200000, status: "pending" as const },
];

for (const req of seedPayReqs) {
  const existing = await db.select().from(paymentRequests).where(eq(paymentRequests.id, req.id));
  if (existing.length === 0) {
    await db.insert(paymentRequests).values(req);
    console.log(`  ✓ PaymentRequest: ${req.id}`);
  }
}

console.log("\nSeed complete.");
await sql.end();

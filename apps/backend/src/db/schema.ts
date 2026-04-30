import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  pgEnum,
  real,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["diaspora", "agence", "admin"]);
export const projectStatusEnum = pgEnum("project_status", [
  "en_cours",
  "livraison_proche",
  "retard",
  "paiement_attendu",
  "termine",
]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed"]);
export const colisStatusEnum = pgEnum("colis_status", [
  "paris",
  "cdg",
  "en_vol",
  "conakry",
  "chantier",
  "livre",
  "douane",
]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull(),
  location: text("location"),
  isActive: boolean("is_active").notNull().default(true),
  totpSecret: text("totp_secret"),       // Only for admin
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  diasporaUserId: text("diaspora_user_id")
    .notNull()
    .references(() => users.id),
  agenceUserId: text("agence_user_id").references(() => users.id),
  title: text("title").notNull(),
  location: text("location").notNull(),
  progress: integer("progress").notNull().default(0),
  stage: text("stage").notNull().default("Preparation"),
  status: projectStatusEnum("status").notNull().default("en_cours"),
  estimatedCompletionDate: text("estimated_completion_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  amountGnf: integer("amount_gnf").notNull(),
  amountEur: real("amount_eur"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  stage: text("stage"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  authorRole: userRoleEnum("author_role").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Documents ────────────────────────────────────────────────────────────────

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  name: text("name").notNull(),
  fileUrl: text("file_url"),
  fileSize: text("file_size"),
  fileType: text("file_type").notNull().default("pdf"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

// ─── Colis ────────────────────────────────────────────────────────────────────

export const colis = pgTable("colis", {
  id: text("id").primaryKey(),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id),
  projectId: text("project_id").references(() => projects.id),
  label: text("label").notNull(),
  weightKg: real("weight_kg").notNull(),
  declaredValue: real("declared_value"),
  description: text("description"),
  deliveryAddress: text("delivery_address"),
  status: colisStatusEnum("status").notNull().default("paris"),
  currentStep: text("current_step").notNull().default("Paris"),
  hasCustomsIssue: boolean("has_customs_issue").notNull().default(false),
  customsNote: text("customs_note"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Chantier Updates ─────────────────────────────────────────────────────────

export const chantierUpdates = pgTable("chantier_updates", {
  id: serial("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  agenceUserId: text("agence_user_id")
    .notNull()
    .references(() => users.id),
  stage: text("stage").notNull(),
  progress: integer("progress").notNull(),
  comment: text("comment"),
  photoUrls: text("photo_urls").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Payment Requests (Agence) ────────────────────────────────────────────────

export const paymentRequests = pgTable("payment_requests", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  agenceUserId: text("agence_user_id")
    .notNull()
    .references(() => users.id),
  stage: text("stage").notNull(),
  amountGnf: integer("amount_gnf").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Push Tokens ──────────────────────────────────────────────────────────────

export const pushTokens = pgTable("push_tokens", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  token: text("token").notNull().unique(),
  platform: text("platform").notNull().default("expo"), // expo | apns | fcm
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Type exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Colis = typeof colis.$inferSelect;
export type ChantierUpdate = typeof chantierUpdates.$inferSelect;
export type PaymentRequest = typeof paymentRequests.$inferSelect;

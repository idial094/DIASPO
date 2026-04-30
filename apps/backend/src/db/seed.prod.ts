/**
 * Production seed — admin account only.
 * Run with: npx tsx src/db/seed.prod.ts
 * Safe to run multiple times (no-op if admin already exists).
 */

import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateSecret, generateURI } from "otplib";
import { users } from "./schema.js";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

const sql = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(sql);

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@diaspo.app";
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword) throw new Error("ADMIN_PASSWORD is required");

const existing = await db.select().from(users).where(eq(users.id, "u-admin-001"));

if (existing.length > 0) {
  console.log("Admin account already exists — nothing to do.");
} else {
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const totpSecret = generateSecret();

  await db.insert(users).values({
    id: "u-admin-001",
    email: adminEmail,
    passwordHash,
    name: "Administrateur",
    role: "admin",
    totpSecret,
    totpEnabled: true,
  });

  console.log(`\n  Admin account created: ${adminEmail}`);
  console.log("  ─────────────────────────────────────────────");
  console.log("  TOTP secret (save this):", totpSecret);
  console.log("\n  OTP Auth URI (scan with Google Authenticator):");
  console.log(
    " ",
    generateURI({ secret: totpSecret, label: adminEmail, issuer: "Diaspo App" }),
    "\n"
  );
  console.log("  IMPORTANT: Save the TOTP secret above before closing this terminal.");
  console.log("  You will need it to log in to the admin panel.\n");
}

await sql.end();

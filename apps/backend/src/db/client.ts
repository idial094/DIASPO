import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
});

export const db = drizzle(sql, { schema });

export type DB = typeof db;

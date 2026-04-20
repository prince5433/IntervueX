/*
 * File Overview:
 * Use Case: Prisma client singleton initialize karta hai with pg adapter and dev cache reuse.
 * Project Role: DB connection lifecycle control karta hai taaki hot-reload me extra clients na bane.
 * Typical Trigger: Kisi bhi server action/lib code me DB operation se pehle import hota hai.
 * File Path: lib/prisma.js
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/prisma/client";

// Note: globalThis pe cached client rakhne se dev hot-reload me multiple clients create nahi honge.
const globalForPrisma = globalThis;

function createPrismaClient() {
  // Note: Postgres pool env connection string se initialize hota hai.
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  // Note: Prisma ko pg adapter attach kar rahe hain.
  const adapter = new PrismaPg(pool);
  // Note: final Prisma client adapter ke saath return.
  return new PrismaClient({ adapter });
}

// Note: production me fresh instance, dev me cached instance reuse.
export const db = globalForPrisma.prisma ?? createPrismaClient();

// Note: sirf non-production me global cache set karte hain.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

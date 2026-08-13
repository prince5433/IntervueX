/*
 * ─────────────────────────────────────────────────────────────────────────────
 * FILE: lib/prisma.js
 * ROLE: Prisma Client Singleton — Database connection ka single entry point.
 *
 * WHY SINGLETON PATTERN?
 *   Next.js dev server "Hot Module Replacement (HMR)" use karta hai — file save
 *   karte hi module re-execute hota hai. Agar har execution me naya PrismaClient
 *   banta, to dev me 100s of DB connections pool overflow kar dete.
 *   Singleton pattern se sirf EK client banta hai aur globalThis pe cache hota hai.
 *
 * PRODUCTION:
 *   Production me HMR nahi hoti, isliye fresh client banana safe hai.
 *   globalThis cache production me set nahi karte — no memory leak risk.
 *
 * TRIGGER: Koi bhi server action ya lib file jab DB operation karna chahti hai,
 *          woh `import { db } from "@/lib/prisma"` karta hai.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// PrismaPg: Prisma ka PostgreSQL adapter — native pg driver use karta hai
// (@prisma/adapter-pg package provides this)
import { PrismaPg } from "@prisma/adapter-pg";

// Pool: node-postgres (pg) library ka connection pool manager
// Pool automatically connections reuse karta hai — overhead reduce hota hai
import { Pool } from "pg";

// PrismaClient: generated type-safe DB client
// Note: yeh import generated folder se aata hai (lib/generated/prisma/)
// "npx prisma generate" se regenerate hota hai schema changes ke baad
import { PrismaClient } from "./generated/prisma/client";

// ── SINGLETON SETUP ───────────────────────────────────────────────────────────

// globalThis: Node.js ka global object — module boundaries ke across persist karta hai
// Hum isme prisma client cache karenge taaki HMR pe re-create na ho
const globalForPrisma = globalThis;

// createPrismaClient: fresh Prisma client factory function
// Yeh sirf tab call hogi jab cache miss ho (first run ya production)
function createPrismaClient() {
  // Pool: PostgreSQL connection pool banao
  // connectionString: env variable se liya — format: postgresql://user:pass@host:port/db
  // Pool automatically max connections manage karta hai (default 10)
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // PrismaPg adapter: Prisma ko bolta hai "native pg driver use karo"
  // Yeh Prisma ke default query engine se alag hai — better for serverless/edge
  const adapter = new PrismaPg(pool);

  // PrismaClient: adapter ke saath instantiate karo
  // Ab sab Prisma queries is pool ke through jayengi
  return new PrismaClient({ adapter });
}

// ── EXPORT ────────────────────────────────────────────────────────────────────

// db: application-wide DB client
// ?? (nullish coalescing): agar globalThis.prisma exist karta hai (cached) to use karo
//                          warna createPrismaClient() call karo (fresh instance)
// Result: dev me HMR pe same client reuse hota hai
export const db = globalForPrisma.prisma ?? createPrismaClient();

// Development cache set karna:
// Sirf non-production environments me globalThis pe store karo
// Yeh ensure karta hai ki next HMR cycle me naya client create na ho
// Production me yeh line skip hoti hai (process.env.NODE_ENV === "production")
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

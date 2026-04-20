/*
 * File Overview:
 * Use Case: Development/test ke liye manual feedback seed script run karta hai specific booking par.
 * Project Role: Demo/testing scenarios me realistic feedback data inject karke flows verify karne me help karta hai.
 * Typical Trigger: Developer manual seed command run kare tab execute hota hai.
 * File Path: prisma/seed.js
 */
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Replicate the same adapter pattern as lib/prisma.ts
// Can't use @/ alias — seed runs outside Next.js
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
// Note: seed script ke liye standalone Prisma client banaya gaya hai (Next runtime ke bahar).
const db = new PrismaClient({ adapter });

// ── CHANGE THIS ───────────────────────────────────────────────────────────────
const BOOKING_ID = "472ec62c-2ba1-4ff0-8eaa-3a5ad91f03d8";
// ─────────────────────────────────────────────────────────────────────────────

const feedback = {
  // Note: neeche ka payload exactly Feedback model ke fields se align karta hai.
  summary:
    "Piyush demonstrated a solid understanding of React fundamentals and component architecture. He approached problems methodically and showed good instincts around state management. With some refinement in system design and async patterns, he's well on track for a mid-level frontend role.",
  technical:
    "Strong grasp of React hooks, component lifecycle, and basic TypeScript. Handled the closure question confidently. Struggled slightly with the event loop explanation and needed hints on optimising a recursive tree traversal — but recovered well once guided.",
  communication:
    "Articulate and structured in most answers. Thinks out loud effectively, which made it easy to follow his reasoning. Occasionally jumped to implementation before fully exploring the problem space.",
  problemSolving:
    "Good instinct for breaking problems down. Chose sensible data structures for most questions. The dynamic programming problem was a stretch — he identified the overlapping subproblems but didn't arrive at a memoised solution independently.",
  recommendation:
    "Recommended for mid-level frontend roles at growth-stage startups. Not yet ready for senior FAANG interviews without deepening system design knowledge. Suggest focusing on: async JavaScript internals, large-scale component architecture, and DP patterns.",
  strengths: [
    "Strong React & hooks knowledge",
    "Clear verbal communication",
    "Systematic debugging approach",
    "Good CSS & browser fundamentals",
  ],
  improvements: [
    "System design depth",
    "Async/event loop internals",
    "Dynamic programming patterns",
    "Ask clarifying questions upfront",
  ],
  overallRating: "GOOD", // POOR | AVERAGE | GOOD | EXCELLENT
  sessionRating: 4,
  sessionComment:
    "Great session — Piyush was engaged and receptive to feedback. Would be happy to interview him again after he's done more system design prep.",
};

async function main() {
  // Note: pehle booking existence check, warna orphan feedback create nahi karna.
  const booking = await db.booking.findUnique({
    where: { id: BOOKING_ID },
    select: { id: true, status: true },
  });

  if (!booking) {
    console.error(`❌  No booking found with ID: ${BOOKING_ID}`);
    process.exit(1);
  }

  // Note: duplicate seed run se same booking par multiple feedback entries avoid karte hain.
  const existing = await db.feedback.findUnique({
    where: { bookingId: BOOKING_ID },
  });

  if (existing) {
    console.error(`❌  Feedback already exists for booking: ${BOOKING_ID}`);
    process.exit(1);
  }

  // Note: feedback create + booking status update ek hi transaction me,
  // taaki partial write ka risk na rahe.
  await db.$transaction([
    db.feedback.create({
      data: { bookingId: BOOKING_ID, ...feedback },
    }),
    db.booking.update({
      where: { id: BOOKING_ID },
      data: { status: "COMPLETED" },
    }),
  ]);

  console.log(`✅  Feedback seeded for booking: ${BOOKING_ID}`);
  console.log(`✅  Booking status → COMPLETED`);
}

main()
  .catch((e) => {
    // Note: error aane par non-zero exit, CI/dev scripts detect kar sake.
    console.error(e);
    process.exit(1);
  })
  // Note: finally block me DB connection close karna mandatory hai.
  .finally(() => db.$disconnect());

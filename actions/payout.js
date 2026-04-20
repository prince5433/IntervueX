/*
 * File Overview:
 * Use Case: Admin payout approval ko secure password check ke saath process karta hai.
 * Project Role: Financial workflow me unauthorized payout approvals ko rokta hai aur audit fields set karta hai.
 * Typical Trigger: Admin payout review page se approve action hit hone par.
 * File Path: actions/payout.js
 */
// Assignment

"use server";

import { db } from "@/lib/prisma";

export const approvePayout = async ({ payoutId, adminPassword }) => {
  // Note: password missing hua to turant reject.
  if (!adminPassword) throw new Error("Password required");

  // Note: simple admin gate - UI side trust nahi, server-side password check mandatory.
  if (adminPassword !== process.env.ADMIN_PAYOUT_PASSWORD) {
    throw new Error("Incorrect password");
  }

  // Note: payout row ko DB se fetch.
  const payout = await db.payout.findUnique({ where: { id: payoutId } });

  if (!payout) throw new Error("Payout not found");
  // Note: idempotency guard - processed payout ko dobara process nahi karna.
  if (payout.status === "PROCESSED") throw new Error("Already processed");

  // Note: final approval update (status + audit timestamps/actor).
  await db.payout.update({
    where: { id: payoutId },
    data: {
      status: "PROCESSED",
      processedAt: new Date(),
      processedBy: "admin",
    },
  });

  return { success: true };
};

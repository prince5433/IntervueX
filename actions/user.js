"use server";

/*
 * File Overview:
 * Use Case: Current logged-in user ka lightweight app-profile snapshot fetch karta hai.
 * Project Role: Header/dashboard greeting aur role-based UI decisions ke liye trusted DB source deta hai.
 * Typical Trigger: Server components jab user summary chahte hain tab call hota hai.
 * File Path: actions/user.js
 */
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const getCurrentUser = async () => {
  // Note: Clerk session se current auth user nikaalte hain.
  const user = await currentUser();
  // Note: agar login hi nahi hai to null return karke caller ko safe fallback dete hain.
  if (!user) return null;

  // Note: DB se minimal profile fields fetch kar rahe hain jo UI header/dashboard me chahiye.
  return db.user.findUnique({
    // Note: mapping key Clerk userId hai.
    where: { clerkUserId: user.id },
    select: {
      // Note: role se route/feature gating hoti hai.
      role: true,
      // Note: basic identity fields UI display ke liye.
      name: true,
      title: true,
      company: true,
      imageUrl: true,
    },
  });
};

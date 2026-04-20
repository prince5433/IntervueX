/*
 * File Overview:
 * Use Case: Clerk user ko DB user ke saath sync karta hai aur monthly plan credits allocate/rollover logic apply karta hai.
 * Project Role: Identity-sync + credit-wallet consistency ka single source hai.
 * Typical Trigger: Header/init flows me login user resolve karte waqt execute hota hai.
 * File Path: lib/checkUser.js
 */
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

const PLAN_CREDITS = {
  // Note: monthly credit grant mapping plan ke hisaab se.
  pro: 15,
  starter: 5,
  free: 1,
};

const getCurrentPlan = async () => {
  const { has } = await auth();
  // Note: Clerk plan check order important hai, pehle higher tier detect karte hain.
  if (has({ plan: "pro" })) return "pro";
  if (has({ plan: "starter" })) return "starter";
  return "free";
};

const shouldAllocateCredits = (dbUser, currentPlan) => {
  // Always allocate if plan changed
  if (dbUser.currentPlan !== currentPlan) return true;

  // Allocate if never allocated before
  if (!dbUser.creditsLastAllocatedAt) return true;

  // Allocate if it's a new calendar month since last allocation
  const now = new Date();
  const last = new Date(dbUser.creditsLastAllocatedAt);
  const isNewMonth =
    now.getFullYear() > last.getFullYear() || now.getMonth() > last.getMonth();

  return isNewMonth;
};

export const checkUser = async () => {
  try {
    // Use auth() first (cookie/session based), so we avoid Clerk user API calls
    // on every render and reduce failure surface.
    const { userId } = await auth();
    if (!userId) return null;

    const currentPlan = await getCurrentPlan();
    const credits = PLAN_CREDITS[currentPlan];

    const loggedInUser = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (loggedInUser) {
      // Interviewers don't have a credit subscription — skip allocation
      if (loggedInUser.role === "INTERVIEWER") return loggedInUser;

      if (shouldAllocateCredits(loggedInUser, currentPlan)) {
        // Note: rollover strategy use ho rahi hai,
        // matlab previous leftover credits + new monthly grant dono preserve hote hain.
        // Roll forward any remaining credits from the previous period
        const rolledCredits = credits + (loggedInUser.credits ?? 0);

        return await db.user.update({
          where: { clerkUserId: userId },
          data: {
            credits: rolledCredits,
            currentPlan,
            creditsLastAllocatedAt: new Date(),
          },
        });
      }

      return loggedInUser;
    }

    // New user path: fetch profile only when needed.
    // If Clerk user fetch fails, we fail soft (return null) instead of crashing SSR.
    const user = await currentUser();
    if (!user) return null;

    // Note: first login pe hi user DB row create + initial credits assign.
    const name = `${user.firstName} ${user.lastName}`;
    const primaryEmail = user.emailAddresses?.[0]?.emailAddress;
    if (!primaryEmail) return null;

    return await db.user.create({
      data: {
        clerkUserId: userId,
        name,
        imageUrl: user.imageUrl,
        email: primaryEmail,
        credits,
        currentPlan,
        creditsLastAllocatedAt: new Date(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("checkUser error:", message);
    return null;
  }
};

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * FILE: lib/checkUser.js
 * ROLE: Clerk ↔ Database User Sync + Monthly Credit Allocation
 *
 * YEH FILE KYA KARTI HAI?
 *   1. Clerk session se logged-in user ka ID nikalta hai
 *   2. Us ID se DB me existing user dhundhta hai
 *   3. Agar user naya hai → DB me row create karta hai + initial credits deta hai
 *   4. Agar user existing hai → credit plan change ya naye month pe credits allocate/rollover karta hai
 *   5. Interviewers ke liye credit allocation skip karta hai (unka wallet alag hai)
 *
 * CREDIT ROLLOVER LOGIC:
 *   - Naye month pe: previous credits + naye plan ke credits = rolled balance
 *   - Plan change pe: immediately reallocate (no waiting for month end)
 *   - Yeh ensure karta hai ki user ke unused credits waste na hon
 *
 * TRIGGER: Header component render hote waqt har request pe execute hota hai.
 *          Header async server component hai isliye yeh server-side chalti hai.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// auth: Clerk server utility — session cookie se userId extract karta hai
//       (fast, no API call needed)
// currentUser: Clerk API call — full user profile fetch karta hai
//              (Sirf new user creation pe use hota hai)
import { auth, currentUser } from "@clerk/nextjs/server";

// db: Prisma singleton — database operations ke liye
import { db } from "./prisma";

// ── PLAN → CREDITS MAPPING ────────────────────────────────────────────────────
// Yeh object define karta hai ki har subscription plan pe mahine me kitne credits milenge.
// pro: 15 credits/month → power users ke liye
// starter: 5 credits/month → basic users ke liye
// free: 1 credit/month → trial users ke liye
const PLAN_CREDITS = {
  pro: 15,      // most credits — heavy users
  starter: 5,   // mid-tier plan
  free: 1,      // minimal — just to try the platform
};

// ── HELPER: getCurrentPlan ────────────────────────────────────────────────────
// Clerk ke auth() object me .has() method hota hai jo plan/feature checks karta hai.
// Order important hai: pehle highest tier check karo — warna "pro" user bhi "free" dikhe.
const getCurrentPlan = async () => {
  const { has } = await auth(); // Clerk session se feature-check utility lo
  if (has({ plan: "pro" })) return "pro";         // highest tier first
  if (has({ plan: "starter" })) return "starter"; // mid tier
  return "free";                                   // default fallback
};

// ── HELPER: shouldAllocateCredits ─────────────────────────────────────────────
// Decides whether this user should receive a fresh credit allocation right now.
// Returns true in 3 cases:
//   1. Plan changed → immediate reallocation
//   2. Never allocated before → first time setup
//   3. New calendar month since last allocation → monthly grant
const shouldAllocateCredits = (dbUser, currentPlan) => {
  // Case 1: Plan changed (upgrade/downgrade) → allocate immediately
  if (dbUser.currentPlan !== currentPlan) return true;

  // Case 2: Never been allocated before (edge case — old users without timestamp)
  if (!dbUser.creditsLastAllocatedAt) return true;

  // Case 3: New calendar month has started since last allocation
  const now = new Date();
  const last = new Date(dbUser.creditsLastAllocatedAt); // last allocation date

  // Month comparison: year mismatch (new year) OR month mismatch (same year, new month)
  const isNewMonth =
    now.getFullYear() > last.getFullYear() || now.getMonth() > last.getMonth();

  return isNewMonth; // true = allocate, false = skip
};

// ── MAIN EXPORT: checkUser ────────────────────────────────────────────────────
// Yeh function pura auth + sync logic run karta hai.
// Returns: dbUser object (if logged in) | null (if not logged in or error)
export const checkUser = async () => {
  try {
    // Step 1: Clerk session se userId lo (cookie-based, fast — no API call)
    // Agar user logged out hai → userId = null → return null immediately
    const { userId } = await auth();
    if (!userId) return null; // not logged in — stop here

    // Step 2: Current Clerk plan determine karo
    const currentPlan = await getCurrentPlan();

    // Step 3: Plan ke hisaab se credit amount decide karo
    const credits = PLAN_CREDITS[currentPlan];

    // Step 4: DB me existing user dhundo (Clerk userId se match)
    const loggedInUser = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    // ── EXISTING USER PATH ────────────────────────────────────────────────────
    if (loggedInUser) {
      // Interviewers credit allocation nahi karte — unka wallet booking earnings se bharta hai
      // Isliye immediately return kar do bina credit check ke
      if (loggedInUser.role === "INTERVIEWER") return loggedInUser;

      // Check karo ki credits allocate karne chahiye ya nahi
      if (shouldAllocateCredits(loggedInUser, currentPlan)) {
        // ROLLOVER STRATEGY:
        // Naye credits = plan credits + jo pehle se bache hue hain
        // Matlab agar user ke paas 3 credits bache the aur pro plan hai (15 credits),
        // to rolled balance = 3 + 15 = 18 credits (credits waste nahi hote)
        const rolledCredits = credits + (loggedInUser.credits ?? 0);

        // DB me update karo: naye credits, updated plan, aur allocation timestamp
        return await db.user.update({
          where: { clerkUserId: userId },
          data: {
            credits: rolledCredits,                    // new rolled balance
            currentPlan,                               // updated plan name
            creditsLastAllocatedAt: new Date(),        // timestamp reset for next month check
          },
        });
      }

      // Agar allocation ki zaroorat nahi — existing user as-is return karo
      return loggedInUser;
    }

    // ── NEW USER PATH ─────────────────────────────────────────────────────────
    // DB me user nahi mila → pehli baar login kar raha hai
    // Clerk se full profile fetch karo (yeh API call hai — isliye sirf naye users ke liye karte hain)
    const user = await currentUser();

    // Agar Clerk profile bhi nahi mila (edge case — session expired mid-request), fail gracefully
    if (!user) return null;

    // User ka display name build karo
    const name = `${user.firstName} ${user.lastName}`;

    // Primary email — required field, agar nahi mili to create nahi karenge
    const primaryEmail = user.emailAddresses?.[0]?.emailAddress;
    if (!primaryEmail) return null; // email required — can't create user without it

    // Naya user DB me create karo with initial credits
    // role: UNASSIGNED — onboarding form complete hone ke baad set hogi
    return await db.user.create({
      data: {
        clerkUserId: userId,                         // Clerk ID — link between Clerk and our DB
        name,                                        // full name from Clerk profile
        imageUrl: user.imageUrl,                     // avatar URL from OAuth provider
        email: primaryEmail,                         // primary email
        credits,                                     // initial credits based on current plan
        currentPlan,                                 // "free" by default for new signups
        creditsLastAllocatedAt: new Date(),          // set now so monthly check works correctly
      },
    });

  } catch (error) {
    // Fail soft: error log karo lekin crash mat karo
    // Agar checkUser fail hoti hai to Header gracefully degrade ho sakta hai
    const message = error instanceof Error ? error.message : String(error);
    console.error("checkUser error:", message);
    return null; // null return = treat as not logged in
  }
};

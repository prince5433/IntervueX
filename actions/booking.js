"use server";
/*
 * ─────────────────────────────────────────────────────────────────────────────
 * FILE: actions/booking.js
 * ROLE: Booking ka complete backend — slot validation se leke DB transaction tak.
 *
 * YEH FILE KYA KARTA HAI?
 *   1. getInterviewerProfile() → interviewer ki profile + open slots + existing bookings fetch karta hai
 *   2. bookSlot()              → slot book karta hai with:
 *        a) Rate limiting (Arcjet) — abuse prevent karna
 *        b) Role + credit validation — sirf interviewees book kar sakte hain, enough credits chahiye
 *        c) Conflict detection — same slot double-booking prevent karna
 *        d) Stream call creation — video room pre-provision karna
 *        e) Atomic DB transaction — booking + credit deduction + earning ek saath ya kuch nahi
 *
 * ATOMICITY GUARANTEE:
 *   db.$transaction() ensure karta hai ki agar beech me koi step fail ho to
 *   koi bhi change DB me save nahi hoga — no partial state corruption.
 *
 * TRIGGER: Interviewer profile page par "Confirm Booking" button click hone par call hota hai.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// currentUser: Clerk server utility — request karne wala logged-in user identify karta hai
import { currentUser } from "@clerk/nextjs/server";

// db: Prisma DB client — database operations ke liye
import { db } from "@/lib/prisma";

// StreamClient: Stream.io Node.js SDK — server-side video call management ke liye
import { StreamClient } from "@stream-io/node-sdk";

// revalidatePath: Next.js cache invalidation — booking ke baad related pages ko refresh karta hai
import { revalidatePath } from "next/cache";

// request: Arcjet utility — current HTTP request object extract karta hai rate limiting ke liye
import { request } from "@arcjet/next";

// createRateLimiter, checkRateLimit: apni arcjet.js utility se rate limit helpers
import { createRateLimiter, checkRateLimit } from "@/lib/arcjet";

// ── RATE LIMITER SETUP ────────────────────────────────────────────────────────
// Token bucket algorithm:
//   - capacity: 5 = max 5 bookings can burst in short time
//   - refillRate: 2 = 2 tokens added per interval (1 hour)
//   - interval: "1h" = refill period
// This allows legitimate users (e.g. correcting a mistake) while blocking automated scripts
const bookingLimiter = createRateLimiter({
  refillRate: 2,    // 2 new tokens per hour
  interval: "1h",   // refill period
  capacity: 5,      // max burst = 5 booking attempts in quick succession
});

// ── ACTION 1: getInterviewerProfile ──────────────────────────────────────────
// Interviewer ki full profile fetch karta hai jisme:
//   - Basic info (name, bio, title, company, etc.)
//   - Current AVAILABLE time window (for slot generation)
//   - All SCHEDULED bookings (to mark which slots are taken)
// Frontend yeh data le kar generateSlots() call karta hai aur slot picker dikhata hai
export const getInterviewerProfile = async (interviewerId) => {
  try {
    const interviewer = await db.user.findUnique({
      where: { id: interviewerId, role: "INTERVIEWER" }, // sirf INTERVIEWER role users find karo
      select: {
        id: true,
        name: true,
        imageUrl: true,
        title: true,         // e.g. "Senior SDE @ Google"
        company: true,       // current employer
        yearsExp: true,      // years of experience
        bio: true,           // short description
        categories: true,    // interview expertise areas (FRONTEND, DSA, etc.)
        creditRate: true,    // credits charged per session

        // availabilities: interviewer ki set ki hui open time window
        // status: "AVAILABLE" → sirf open windows lo (BOOKED/BLOCKED ignore)
        // take: 1 → ek hi active availability window hoti hai design me
        availabilities: {
          where: { status: "AVAILABLE" },
          select: { startTime: true, endTime: true }, // sirf time info chahiye
          take: 1, // max 1 row — single active window per interviewer
        },

        // bookingsAsInterviewer: is interviewer ki already SCHEDULED bookings
        // Frontend yeh use karta hai overlap check ke liye (slot already booked hai ya nahi)
        bookingsAsInterviewer: {
          where: { status: "SCHEDULED" },                  // sirf upcoming booked slots
          select: { startTime: true, endTime: true },      // time range hi chahiye
        },
      },
    });

    return interviewer ?? null; // agar interviewer nahi mila to null return
  } catch (err) {
    console.error("getInterviewerProfile error:", err);
    throw new Error("Failed to fetch interviewer profile");
  }
};

// ── ACTION 2: bookSlot ────────────────────────────────────────────────────────
// Main booking action — ek slot confirm karta hai with full validation aur transaction.
export const bookSlot = async ({ interviewerId, startTime, endTime }) => {
  // Step 1: Auth check — kaun book kar raha hai
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized"); // logged out user → block

  // ── Step 2: Rate Limit Check ──────────────────────────────────────────────
  // request() → current HTTP request object Arcjet ke liye
  // checkRateLimit() → Arcjet decision: ALLOW ya DENY
  // Agar denied → error throw, booking nahi hogi
  const req = await request();
  const rateLimitError = await checkRateLimit(bookingLimiter, req, user.id);
  if (rateLimitError) throw new Error(rateLimitError); // "Too many requests..."

  // ── Step 3: Parallel DB fetch — interviewee + interviewer dono ek saath ──
  // Promise.all() → dono queries simultaneously chalti hain (faster than sequential)
  const [dbUser, interviewer] = await Promise.all([
    db.user.findUnique({ where: { clerkUserId: user.id } }),  // current user DB record
    db.user.findUnique({ where: { id: interviewerId } }),     // target interviewer
  ]);

  // Role validation:
  // - Sirf INTERVIEWEE role wale book kar sakte hain (not INTERVIEWER, not UNASSIGNED)
  if (!dbUser || dbUser.role !== "INTERVIEWEE")
    throw new Error("Only interviewees can book sessions");

  // - Interviewer exist karna chahiye aur INTERVIEWER role hona chahiye
  if (!interviewer || interviewer.role !== "INTERVIEWER")
    throw new Error("Interviewer not found");

  // ── Step 4: Credit Check ──────────────────────────────────────────────────
  // credits: interviewer ki per-session rate (creditRate field)
  // ?? 10: fallback agar creditRate null ho (shouldn't happen, but defensive coding)
  const credits = interviewer.creditRate ?? 10;

  // Interviewee ke paas enough credits hone chahiye, warna booking block
  if (dbUser.credits < credits)
    throw new Error("Insufficient credits. Please upgrade your plan.");

  // ── Step 5: Conflict Detection + DB Transaction ──────────────────────────
  // Both conflict check AND booking creation happen inside ONE transaction
  // to prevent race conditions where two users book the same slot simultaneously.
  // Stream call is created BEFORE the transaction (Step 6) because if Stream fails,
  // we don't want to start a DB transaction at all.

  // ── Step 6: Stream Video Call Creation ───────────────────────────────────
  // Booking confirm hone se PEHLE Stream call create karte hain
  // Reason: agar Stream fail ho, to DB transaction start hi nahi karenge → no orphan records
  let streamCallId;
  try {
    // StreamClient: server-side SDK (API key + secret) — never expose secret to client!
    const streamClient = new StreamClient(
      process.env.NEXT_PUBLIC_STREAM_API_KEY, // public API key
      process.env.STREAM_SECRET_KEY            // private secret (server-only)
    );

    // upsertUsers: Stream me dono users register karo (agar pehle se hain to update hoga)
    // Yeh ensure karta hai ki call me join hone pe proper name/avatar dikh sake
    await streamClient.upsertUsers([
      {
        id: dbUser.clerkUserId,                    // interviewee ka unique ID
        name: dbUser.name ?? "Interviewee",        // display name in call
        image: dbUser.imageUrl ?? undefined,        // avatar URL
        role: "user",                              // Stream user role
      },
      {
        id: interviewer.clerkUserId,               // interviewer ka unique ID
        name: interviewer.name ?? "Interviewer",   // display name in call
        image: interviewer.imageUrl ?? undefined,   // avatar URL
        role: "user",                              // Stream user role
      },
    ]);

    // Unique call ID generate karo:
    // Format: "mock_" + timestamp + 5-char random alphanumeric
    // Timestamp → time-based ordering, random → collision prevention
    // Math.random().toString(36).slice(2, 7) → e.g. "k3f9x"
    streamCallId = `mock_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    // Stream call object create karo
    const call = streamClient.video.call("default", streamCallId); // "default" = call type

    // getOrCreate: agar call already exist kare (retry case) to create nahi karega
    await call.getOrCreate({
      data: {
        created_by_id: dbUser.clerkUserId, // call creator = interviewee (who booked)
        members: [
          { user_id: dbUser.clerkUserId, role: "host" },       // interviewee = host
          { user_id: interviewer.clerkUserId, role: "host" },  // interviewer = host
        ],
        settings_override: {
          // Recording: auto-start when first participant joins
          // quality: "1080p" → HD recording for future playback/feedback
          recording: { mode: "auto-on", quality: "1080p" },

          // Screensharing: enabled for code sharing during technical interviews
          screensharing: {
            enabled: true,
          },

          // Transcription: auto-start when first user joins
          // Deepgram will transcribe this for AI feedback generation
          transcription: {
            mode: "auto-on", // starts when first user joins, stops when all leave
          },
        },
      },
    });
  } catch (err) {
    console.error("Stream call creation failed:", err);
    throw new Error("Failed to create video call. Please try again.");
  }

  // ── Step 7: Atomic DB Transaction ────────────────────────────────────────
  // db.$transaction() → sab operations ek unit ke taur par execute hoti hain.
  // Conflict check bhi INSIDE transaction hai → race condition prevented.
  // Agar koi bhi step fail ho → sab rollback → no partial state.
  try {
    const booking = await db.$transaction(async (tx) => {
      // 0. Conflict check INSIDE transaction to prevent race conditions
      //   existing.startTime < newEndTime   (existing booking ne naye slot ka end time cross kiya)
      //   AND existing.endTime > newStartTime (existing booking naye slot se pehle start nahi hui)
      // = any kind of overlap
      const conflict = await tx.booking.findFirst({
        where: {
          interviewerId,           // same interviewer
          status: "SCHEDULED",     // sirf active bookings
          startTime: { lt: new Date(endTime) },   // existing start < new end (overlap condition 1)
          endTime: { gt: new Date(startTime) },   // existing end > new start (overlap condition 2)
        },
      });
      if (conflict)
        throw new Error("This slot was just booked. Please pick another.");

      // 1. Booking row create karo
      const newBooking = await tx.booking.create({
        data: {
          intervieweeId: dbUser.id,           // who booked
          interviewerId,                       // who will conduct
          startTime: new Date(startTime),      // slot start (ISO string → Date object)
          endTime: new Date(endTime),          // slot end
          status: "SCHEDULED",                 // initial state
          creditsCharged: credits,             // snapshot of rate at booking time
          streamCallId,                        // pre-provisioned Stream call ID
        },
      });

      // 2. Credit ledger entry — immutable audit trail
      // amount: negative because deduction from interviewee
      // type: BOOKING_DEDUCTION → searchable transaction category
      // bookingId: linked to this specific booking for full audit trail
      await tx.creditTransaction.create({
        data: {
          userId: dbUser.id,
          amount: -credits,                    // negative = deduction
          type: "BOOKING_DEDUCTION",
          bookingId: newBooking.id,
        },
      });

      // 3. Deduct credits from interviewee's wallet
      // { decrement: credits } → Prisma atomic decrement (safe for concurrent requests)
      await tx.user.update({
        where: { id: dbUser.id },
        data: { credits: { decrement: credits } }, // interviewee ke credits ghata do
      });

      // 4. Add credits to interviewer's earning balance
      // creditBalance: separate field from "credits" — yeh earning hai, spending nahi
      await tx.user.update({
        where: { id: interviewerId },
        data: { creditBalance: { increment: credits } }, // interviewer ko credits mila
      });

      return newBooking; // transaction result return karo
    });

    // Cache invalidation: booking ke baad these pages ka data stale ho gaya hai
    revalidatePath(`/interviewers/${interviewerId}`); // profile page slot refresh
    revalidatePath("/dashboard");                     // interviewer dashboard refresh

    return { success: true, bookingId: booking.id, streamCallId };
  } catch (err) {
    console.error("bookSlot transaction failed:", err);
    throw new Error("Booking failed. Please try again.");
  }
};

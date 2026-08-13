"use server";
/*
 * ─────────────────────────────────────────────────────────────────────────────
 * FILE: actions/call.js
 * ROLE: Video Call Room ka Secure Bootstrap — Auth Guard + Stream Token Issuer
 *
 * YEH FILE KYA KARTA HAI?
 *   1. Call URL se callId leke DB me booking dhundhta hai
 *   2. Request karne wale user ko verify karta hai (sirf interviewer/interviewee allowed)
 *   3. Stream SDK se short-lived user token generate karta hai
 *   4. Client-side CallRoom component ko sab zaruri data return karta hai
 *
 * SECURITY MODEL:
 *   - Token server-side generate hota hai → private STREAM_SECRET_KEY never leaves server
 *   - Participant check DB se hota hai → URL guessing se unauthorized access block
 *   - Token validity: 1 hour → expired tokens se join nahi ho sakta
 *
 * TRIGGER: /call/[callId] page open hone par server-side me automatically call hota hai.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// currentUser: Clerk server utility — HTTP cookie se logged-in user identify karta hai
import { currentUser } from "@clerk/nextjs/server";

// db: Prisma client — booking + participant data DB se fetch karne ke liye
import { db } from "@/lib/prisma";

// StreamClient: Stream.io server-side SDK — token generation ke liye
import { StreamClient } from "@stream-io/node-sdk";

// ── MAIN EXPORT: getCallData ──────────────────────────────────────────────────
// callId: URL se aya hua unique Stream call identifier (e.g. "mock_1234567_k3f9x")
// Returns: call data object (success) | { error: "..." } (failure)
export const getCallData = async (callId) => {
  // Step 1: Logged-in user identify karo
  const user = await currentUser();
  // Agar session nahi hai (logged out) → error return (page redirect karega /)
  if (!user) return { error: "Unauthorized" };

  // Step 2: streamCallId se booking find karo
  // streamCallId @unique hai schema me → exactly ek booking match hogi
  // include: booking ke saath dono participants ka profile bhi load karo
  const booking = await db.booking.findUnique({
    where: { streamCallId: callId }, // match by Stream call ID
    include: {
      // interviewer: expert side ke details
      interviewer: {
        select: {
          id: true,           // DB primary key
          clerkUserId: true,  // Clerk user ID — Stream participant matching ke liye
          name: true,         // display name in UI
          imageUrl: true,     // avatar
          categories: true,   // interview categories — AI question generator ke liye
        },
      },
      // interviewee: candidate side ke details
      interviewee: {
        select: {
          id: true,           // DB primary key
          clerkUserId: true,  // Clerk user ID — participant authorization ke liye
          name: true,         // display name in UI
          imageUrl: true,     // avatar
        },
      },
    },
  });

  // Agar booking DB me nahi mili → invalid/expired call ID
  if (!booking) return { error: "Call not found" };

  // Step 3: Strict participant authorization
  // Request karne wale user ka Clerk ID dono participants se compare karo
  const isInterviewer = booking.interviewer.clerkUserId === user.id;  // interviewer hai?
  const isInterviewee = booking.interviewee.clerkUserId === user.id;  // interviewee hai?

  // Agar na interviewer hai na interviewee → unauthorized (third party trying to sneak in)
  if (!isInterviewer && !isInterviewee) return { error: "Forbidden" };

  // Step 4: Stream Client setup (server-side only)
  // NEXT_PUBLIC_STREAM_API_KEY: public key (safe to expose, already public)
  // STREAM_SECRET_KEY: private key — sirf server-side use hota hai, never sent to client
  const streamClient = new StreamClient(
    process.env.NEXT_PUBLIC_STREAM_API_KEY,
    process.env.STREAM_SECRET_KEY
  );

  // Step 5: Short-lived user token generate karo
  // Token: JWT signed with STREAM_SECRET_KEY — client Stream SDK me authenticate karta hai
  // validity_in_seconds: 3600 = 1 hour — interview session ke liye enough
  // Expired token se re-join nahi ho sakta (security feature)
  const token = streamClient.generateUserToken({
    user_id: user.id,            // Clerk user ID — Stream user se match karta hai
    validity_in_seconds: 60 * 60, // 60 minutes * 60 seconds = 1 hour validity
  });

  // Step 6: Client-side CallRoom component ke liye consolidated data return karo
  return {
    token,            // Stream auth token — client SDK connect ke liye
    isInterviewer,    // boolean — UI show/hide AI question generator, etc.

    // currentUser: call UI me apni identity dikhane ke liye
    currentUser: {
      id: user.id,                                          // Clerk user ID
      name: `${user.firstName} ${user.lastName}`.trim(),   // full display name
      imageUrl: user.imageUrl,                              // avatar for video tile
    },

    // booking: call context — who's in the call, when, and what categories
    booking: {
      id: booking.id,                                // booking DB id (for feedback later)
      interviewer: booking.interviewer,              // interviewer details
      interviewee: booking.interviewee,              // interviewee details
      categories: booking.interviewer.categories,   // for AI question generator sidebar
      startTime: booking.startTime.toISOString(),   // ISO string for consistent serialization
      endTime: booking.endTime.toISOString(),        // ISO string for consistent serialization
    },
  };
};

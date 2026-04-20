/*
 * File Overview:
 * Use Case: Purane past bookings jinke feedback missing hai (ngrok/webhook ke down hone ki wajah se)
 *           unke liye manually Deepgram + Gemini pipeline chalata hai.
 * Project Role: One-off backfill utility; webhook flow ka sibling hai.
 * Trigger: `npx tsx scripts/backfill-feedback.js` se run karo.
 * File Path: scripts/backfill-feedback.js
 */
import "dotenv/config";
import { db } from "../lib/prisma.js";
import {
  transcribeWithDeepgram,
  generateAndPersistFeedback,
  fetchStreamRecordingUrl,
} from "../lib/feedbackPipeline.js";

async function main() {
  // Eligibility: call khatam ho chuki ho AND feedback abhi tak na bani ho.
  // SCHEDULED status is bhi allowed kyunki webhook miss ki wajah se status stuck reh sakta hai.
  const now = new Date();
  const candidates = await db.booking.findMany({
    where: {
      endTime: { lt: now },
      feedback: null,
    },
    include: {
      interviewer: {
        select: { id: true, clerkUserId: true, name: true, categories: true },
      },
      interviewee: {
        select: { id: true, clerkUserId: true, name: true, currentPlan: true },
      },
      feedback: { select: { id: true } },
    },
    orderBy: { endTime: "asc" },
  });

  console.log(`[backfill] Found ${candidates.length} bookings without feedback.`);

  const summary = {
    persisted: 0,
    skippedNoRecording: 0,
    skippedNoTranscript: 0,
    failed: 0,
    alreadyDone: 0,
  };

  for (const booking of candidates) {
    const label = `${booking.streamCallId ?? booking.id}`;
    try {
      // Step 1: recording URL figure out — DB first, phir Stream API se.
      let recordingUrl = booking.recordingUrl;
      if (!recordingUrl || !/^https?:\/\//i.test(recordingUrl)) {
        recordingUrl = await fetchStreamRecordingUrl(booking.streamCallId);
        if (recordingUrl) {
          await db.booking.update({
            where: { id: booking.id },
            data: { recordingUrl },
          });
        }
      }

      if (!recordingUrl) {
        console.log(`[backfill] ${label}: no recording available, skipping`);
        summary.skippedNoRecording += 1;
        continue;
      }

      // Step 2: Deepgram transcription.
      const transcript = await transcribeWithDeepgram(recordingUrl);
      if (!transcript) {
        console.log(`[backfill] ${label}: Deepgram returned empty transcript`);
        summary.skippedNoTranscript += 1;
        continue;
      }

      // Step 3: Gemini + DB persist.
      const result = await generateAndPersistFeedback(booking, transcript, {
        speakersKnown: false,
      });

      if (result.status === "persisted") {
        console.log(`[backfill] ${label}: feedback persisted ✓`);
        summary.persisted += 1;
      } else if (result.status === "already-exists") {
        console.log(`[backfill] ${label}: feedback already existed`);
        summary.alreadyDone += 1;
      } else {
        summary.failed += 1;
      }
    } catch (err) {
      console.error(
        `[backfill] ${label}: failed ->`,
        err instanceof Error ? err.message : err
      );
      summary.failed += 1;
    }
  }

  console.log("\n[backfill] Done.", summary);
}

main()
  .catch((err) => {
    console.error("[backfill] Fatal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect?.();
  });

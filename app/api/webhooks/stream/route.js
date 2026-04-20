/*
 * File Overview:
 * Use Case: Stream webhook events process karta hai: recording URL save, Deepgram se transcript nikalo, Gemini feedback generate, booking complete mark.
 * Project Role: Post-call automation pipeline ka critical server endpoint hai.
 * Trigger: Stream service se `call.recording_ready` / `call.transcription_ready` webhook hit aane par execute hota hai.
 * File Path: app/api/webhooks/stream/route.js
 */
import { db } from "@/lib/prisma";
import {
  transcribeWithDeepgram,
  buildTranscriptFromStreamJsonl,
  generateAndPersistFeedback,
} from "@/lib/feedbackPipeline";

export async function POST(request) {
  const body = await request.json();
  const eventType = body.type;

  console.log(`\n[stream-webhook] <- Received event: ${eventType}`);

  // Sirf in do events par processing karni hai.
  if (
    eventType !== "call.transcription_ready" &&
    eventType !== "call.recording_ready"
  ) {
    console.log(`[stream-webhook] Ignoring event type: ${eventType}`);
    return Response.json({ ok: true });
  }

  // Stream kabhi namespace ke saath id bhejta hai (default:callId), DB me plain id store hai.
  const callCid = body.call_cid ?? "";
  const streamCallId = callCid.includes(":") ? callCid.split(":")[1] : callCid;

  if (!streamCallId) {
    console.log("[stream-webhook] Missing streamCallId, skipping");
    return Response.json({ ok: true });
  }

  try {
    const booking = await db.booking.findUnique({
      where: { streamCallId },
      include: {
        interviewer: {
          select: { id: true, clerkUserId: true, name: true, categories: true },
        },
        interviewee: {
          select: { id: true, clerkUserId: true, name: true, currentPlan: true },
        },
        feedback: { select: { id: true } },
      },
    });

    // Retry/out-of-order webhooks ke case me booking milna guaranteed nahi hota.
    if (!booking) {
      console.log(`[stream-webhook] No booking for ${streamCallId}`);
      return Response.json({ ok: true });
    }

    if (eventType === "call.recording_ready") {
      const recordingUrl = body.call_recording?.url;
      if (!recordingUrl) return Response.json({ ok: true });

      await db.booking.update({
        where: { id: booking.id },
        data: { recordingUrl },
      });

      // Deepgram faster hai — recording ready hote hi transcribe + feedback generate kar lete hain,
      // bajay Stream ke transcription_ready ka wait karne ke (jo often 5–15 min leta hai).
      if (booking.feedback) {
        console.log(
          `[stream-webhook] Feedback already exists for ${streamCallId}, skipping Deepgram`
        );
        return Response.json({ ok: true });
      }

      try {
        const transcript = await transcribeWithDeepgram(recordingUrl);
        if (transcript) {
          await generateAndPersistFeedback(booking, transcript, {
            speakersKnown: false,
          });
          console.log(
            `[stream-webhook] Deepgram+Gemini feedback persisted for ${streamCallId}`
          );
        } else {
          console.log(
            `[stream-webhook] Deepgram returned no transcript for ${streamCallId}; falling back to Stream transcription_ready`
          );
        }
      } catch (dgErr) {
        console.error(
          `[stream-webhook] Deepgram flow failed for ${streamCallId}:`,
          dgErr
        );
        // Intentionally swallow — agar Deepgram fail ho to Stream ka transcription_ready
        // webhook fallback ki tarah kaam karega.
      }

      return Response.json({ ok: true });
    }

    if (eventType === "call.transcription_ready") {
      // Duplicate webhook par ya Deepgram ke pehle hi complete kar dene par skip.
      if (booking.feedback) return Response.json({ ok: true });

      const transcriptUrl = body.call_transcription?.url;
      if (!transcriptUrl) return Response.json({ ok: true });

      const transcriptRes = await fetch(transcriptUrl);
      const transcriptText = await transcriptRes.text();
      const transcript = buildTranscriptFromStreamJsonl(transcriptText, booking);

      if (!transcript) return Response.json({ ok: true });

      await generateAndPersistFeedback(booking, transcript, {
        speakersKnown: true,
      });
      console.log(
        `[stream-webhook] Stream-transcript Gemini feedback persisted for ${streamCallId}`
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error(`[stream-webhook] Error on ${eventType}:`, err);
    // 200 return rakha hai taaki repeated retries se duplicate writes escalate na hon.
    return Response.json({ ok: true });
  }
}

/*
 * File Overview:
 * Use Case: Stream webhook events process karta hai: recording URL save, transcript parse, Gemini feedback generate, booking complete mark.
 * Project Role: Post-call automation pipeline ka critical server endpoint hai.
 * Trigger: Stream service se `call.recording_ready` / `call.transcription_ready` webhook hit aane par execute hota hai.
 * File Path: app/api/webhooks/stream/route.js
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/prisma";

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

      return Response.json({ ok: true });
    }

    if (eventType === "call.transcription_ready") {
      // Duplicate webhook par second feedback create na ho.
      if (booking.feedback) return Response.json({ ok: true });

      const transcriptUrl = body.call_transcription?.url;
      if (!transcriptUrl) return Response.json({ ok: true });

      const transcriptRes = await fetch(transcriptUrl);
      const transcriptText = await transcriptRes.text();

      const lines = transcriptText
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        // Non-speech events ignore, kyunki feedback ko conversational content chahiye.
        .filter((entry) => entry?.type === "speech");

      if (lines.length === 0) return Response.json({ ok: true });

      const speakerMap = {
        [booking.interviewer.clerkUserId]: booking.interviewer.name ?? "Interviewer",
        [booking.interviewee.clerkUserId]: booking.interviewee.name ?? "Interviewee",
      };

      const transcript = lines
        .map((l) => `${speakerMap[l.speaker_id] ?? l.speaker_id}: ${l.text}`)
        .join("\n");

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const categories = booking.interviewer.categories?.join(", ") ?? "General";

      const prompt = `You are an expert technical interviewer evaluating a mock interview.

Interview categories: ${categories}
Interviewer: ${booking.interviewer.name}
Candidate: ${booking.interviewee.name}

TRANSCRIPT:
${transcript}

Analyze the candidate's performance. Respond ONLY with a valid JSON object, no markdown, no backticks, no explanation:
{
  "summary": "2-3 sentence overall summary of the session",
  "technical": "Assessment of technical knowledge and accuracy",
  "communication": "Assessment of clarity, structure, and communication style",
  "problemSolving": "Assessment of problem-solving approach and thought process",
  "recommendation": "HIRE / CONSIDER / NO_HIRE with a one-sentence reason",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "overallRating": "POOR or AVERAGE or GOOD or EXCELLENT"
}`;

      const result = await model.generateContent(prompt);
      const raw = result.response
        .text()
        .trim()
        .replace(/^```json|^```|```$/gm, "")
        .trim();

      const feedbackData = JSON.parse(raw);

      await db.$transaction([
        // Upsert race-safe hai: duplicate retries par unique conflict avoid hota hai.
        db.feedback.upsert({
          where: { bookingId: booking.id },
          create: {
            bookingId: booking.id,
            summary: feedbackData.summary,
            technical: feedbackData.technical,
            communication: feedbackData.communication,
            problemSolving: feedbackData.problemSolving,
            recommendation: feedbackData.recommendation,
            strengths: feedbackData.strengths,
            improvements: feedbackData.improvements,
            overallRating: feedbackData.overallRating,
          },
          update: {},
        }),
        db.booking.update({
          where: { id: booking.id },
          data: { status: "COMPLETED" },
        }),
      ]);

      const earnExists = await db.creditTransaction.findFirst({
        where: { bookingId: booking.id, type: "BOOKING_EARNING" },
      });

      if (!earnExists) {
        await db.creditTransaction.create({
          data: {
            userId: booking.interviewer.id,
            amount: booking.creditsCharged,
            type: "BOOKING_EARNING",
            bookingId: booking.id,
          },
        });
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error(`[stream-webhook] Error on ${eventType}:`, err);
    // 200 return rakha hai taaki repeated retries se duplicate writes escalate na hon.
    return Response.json({ ok: true });
  }
}

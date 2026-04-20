/*
 * File Overview:
 * Use Case: Recording URL → Deepgram transcript → Gemini feedback → DB persist pipeline.
 * Project Role: Post-call feedback generation ko webhook aur backfill script dono reuse karte hain.
 * Trigger: Stream webhook call.recording_ready pe, ya manual backfill script chalne par.
 * File Path: lib/feedbackPipeline.js
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DeepgramClient } from "@deepgram/sdk";
import { StreamClient } from "@stream-io/node-sdk";
import { db } from "./prisma.js";

// Deepgram prerecorded API ko recording URL pass karke diarized utterances nikalte hain.
// Return: speaker-labeled transcript string, ya null agar kuch usable nahi mila.
export async function transcribeWithDeepgram(recordingUrl) {
  if (!process.env.DEEPGRAM_API_KEY) {
    console.log("[feedback] DEEPGRAM_API_KEY missing, skipping Deepgram");
    return null;
  }

  const client = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY });
  const response = await client.listen.v1.media.transcribeUrl({
    url: recordingUrl,
    model: "nova-3",
    diarize: true,
    smart_format: true,
    punctuate: true,
    utterances: true,
  });

  const utterances = response?.results?.utterances ?? [];
  if (utterances.length === 0) return null;

  return utterances
    .map((u) => {
      const idx = typeof u.speaker === "number" ? u.speaker : 0;
      const label = String.fromCharCode(65 + idx); // 0 -> A, 1 -> B, 2 -> C
      return `Speaker ${label}: ${(u.transcript ?? "").trim()}`;
    })
    .filter((line) => line.length > "Speaker X: ".length)
    .join("\n");
}

// Stream ke JSONL transcript format ko "Name: text" string me flatten karte hain.
// Stream me speaker_id = clerkUserId hota hai, isliye accurate name mapping possible hai.
export function buildTranscriptFromStreamJsonl(text, booking) {
  const lines = text
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
    .filter((entry) => entry?.type === "speech");

  if (lines.length === 0) return null;

  const speakerMap = {
    [booking.interviewer.clerkUserId]:
      booking.interviewer.name ?? "Interviewer",
    [booking.interviewee.clerkUserId]:
      booking.interviewee.name ?? "Candidate",
  };

  return lines
    .map((l) => `${speakerMap[l.speaker_id] ?? l.speaker_id}: ${l.text}`)
    .join("\n");
}

// Gemini ko transcript + context dekar structured feedback generate karte hain,
// phir feedback + COMPLETED status + interviewer earning ek go me DB me likhte hain.
export async function generateAndPersistFeedback(
  booking,
  transcript,
  { speakersKnown }
) {
  if (!transcript) return { status: "no-transcript" };
  if (booking.feedback) return { status: "already-exists" };

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const categories = booking.interviewer.categories?.join(", ") ?? "General";

  // Deepgram transcript me speakers generic hote hain — Gemini ko context me bata dete hain.
  const speakerNote = speakersKnown
    ? ""
    : `\nNOTE: The transcript labels speakers generically (Speaker A, Speaker B). Infer from context which speaker is the interviewer (asks probing questions) and which is the candidate (answers them).`;

  const prompt = `You are an expert technical interviewer evaluating a mock interview.

Interview categories: ${categories}
Interviewer: ${booking.interviewer.name}
Candidate: ${booking.interviewee.name}${speakerNote}

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

  // Interviewer earning sirf ek baar credit karna hai — dedupe on (bookingId, type).
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

  return { status: "persisted" };
}

// Stream se live recording URL fetch karo — jab DB me recordingUrl null ho.
// Useful backfill case me jab webhook miss ho gaya tha.
export async function fetchStreamRecordingUrl(streamCallId) {
  if (!streamCallId) return null;

  const streamClient = new StreamClient(
    process.env.NEXT_PUBLIC_STREAM_API_KEY,
    process.env.STREAM_SECRET_KEY
  );

  try {
    const call = streamClient.video.call("default", streamCallId);
    const resp = await call.listRecordings();
    const first = resp?.recordings?.[0];
    const url = first?.url;
    if (typeof url === "string" && /^https?:\/\//i.test(url)) {
      return url;
    }
  } catch (err) {
    console.error(
      `[feedback] listRecordings failed for ${streamCallId}:`,
      err instanceof Error ? err.message : err
    );
  }
  return null;
}

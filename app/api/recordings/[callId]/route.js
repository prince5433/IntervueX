import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";
import { db } from "@/lib/prisma";

const pickFirstUrl = (obj) => {
  if (!obj || typeof obj !== "object") return null;

  // Stream payloads can vary by SDK/API version, so check common URL fields.
  const directCandidates = [
    obj.url,
    obj.location,
    obj.recording_url,
    obj.playback_url,
    obj.viewer_url,
    obj.browser_url,
    obj.dashboard_url,
    obj.share_url,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && /^https?:\/\//i.test(candidate)) {
      return candidate;
    }
  }

  // Nested structures seen in some responses.
  const nestedCandidates = [
    obj.links,
    obj.playback,
    obj.viewer,
    obj.media,
    obj.file,
    obj.asset,
    obj.assets,
  ];

  for (const nested of nestedCandidates) {
    const nestedUrl = pickFirstUrl(nested);
    if (nestedUrl) return nestedUrl;
  }

  return null;
};

export async function GET(request, { params }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const redirectToAppointments = (reason) =>
    NextResponse.redirect(`${appUrl}/appointments?recording=${reason}`);

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.redirect(`${appUrl}/`);

    const { callId } = await params;
    if (!callId) {
      return redirectToAppointments("missing-call-id");
    }

    const dbUser = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!dbUser) return NextResponse.redirect(`${appUrl}/`);

    const booking = await db.booking.findUnique({
      where: { streamCallId: callId },
      include: {
        interviewee: { select: { id: true } },
        interviewer: { select: { id: true } },
      },
    });

    if (!booking) return redirectToAppointments("booking-not-found");

    const isParticipant =
      booking.intervieweeId === dbUser.id || booking.interviewerId === dbUser.id;
    if (!isParticipant) return NextResponse.redirect(`${appUrl}/`);

    // Interviewee recordings are a paid feature.
    const isInterviewer = booking.interviewerId === dbUser.id;
    const hasPro = (dbUser.currentPlan || "").toLowerCase() === "pro";
    if (!isInterviewer && !hasPro) {
      return redirectToAppointments("upgrade-required");
    }

    // Fast path: if webhook already saved a playable URL, use it directly.
    // This avoids unnecessary Stream API failures and makes redirects reliable.
    if (booking.recordingUrl && /^https?:\/\//i.test(booking.recordingUrl)) {
      return NextResponse.redirect(booking.recordingUrl);
    }

    try {
      const streamClient = new StreamClient(
        process.env.NEXT_PUBLIC_STREAM_API_KEY,
        process.env.STREAM_SECRET_KEY
      );

      const call = streamClient.video.call("default", callId);
      const recordingsResp = await call.listRecordings();
      console.log(
        `[recordings] callId=${callId} queryRecordings response:`,
        JSON.stringify(recordingsResp, null, 2)
      );
      const latestRecording = recordingsResp?.recordings?.[0];
      const freshUrl =
        pickFirstUrl(latestRecording) ||
        pickFirstUrl(recordingsResp) ||
        pickFirstUrl(recordingsResp?.recordings?.[1]);

      if (freshUrl) {
        console.log(`[recordings] callId=${callId} resolved url=${freshUrl}`);
        await db.booking.update({
          where: { id: booking.id },
          data: { recordingUrl: freshUrl },
        });
        return NextResponse.redirect(freshUrl);
      }
      console.log(
        `[recordings] callId=${callId} no playable URL extracted from response`
      );
    } catch (streamErr) {
      const streamMessage =
        streamErr instanceof Error ? streamErr.message : String(streamErr);
      console.error(`[recordings] callId=${callId} stream query error:`, streamMessage);
    }
    return redirectToAppointments("processing");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("recordings route error:", message);
    return redirectToAppointments("processing");
  }
}
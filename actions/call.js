"use server";

/*
 * File Overview:
 * Use Case: Call join se pehle participant authorization verify karta hai aur Stream token issue karta hai.
 * Project Role: Secure call access ensure karta hai taaki sirf valid interviewer/interviewee hi room join kare.
 * Typical Trigger: `/call/[callId]` page open hone par server side bootstrap me call hota hai.
 * File Path: actions/call.js
 */
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { StreamClient } from "@stream-io/node-sdk";

export const getCallData = async (callId) => {
  // Note: request karne wale logged-in user ko identify karo.
  const user = await currentUser();
  // Note: unauthorized users ko early error response.
  if (!user) return { error: "Unauthorized" };

  // Note: stream call id ke through booking + dono participants ka profile load.
  const booking = await db.booking.findUnique({
    where: { streamCallId: callId },
    include: {
      interviewer: {
        select: {
          id: true,
          clerkUserId: true,
          name: true,
          imageUrl: true,
          categories: true,
        },
      },
      interviewee: {
        select: {
          id: true,
          clerkUserId: true,
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!booking) return { error: "Call not found" };

  // Note: strict participant check - sirf interviewer ya interviewee hi call access kar sakta hai.
  const isInterviewer = booking.interviewer.clerkUserId === user.id;
  const isInterviewee = booking.interviewee.clerkUserId === user.id;
  if (!isInterviewer && !isInterviewee) return { error: "Forbidden" };

  // Note: server credentials se Stream client banta hai.
  const streamClient = new StreamClient(
    process.env.NEXT_PUBLIC_STREAM_API_KEY,
    process.env.STREAM_SECRET_KEY
  );

  // Note: client-side Stream SDK connect ke liye short-lived user token generate karte hain.
  const token = streamClient.generateUserToken({
    user_id: user.id,
    // Note: token limited validity ke saath issue hota hai security ke liye.
    validity_in_seconds: 60 * 60,
  });

  // Note: client room ko bootstrap karne ke liye consolidated payload return.
  return {
    token,
    isInterviewer,
    currentUser: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      imageUrl: user.imageUrl,
    },
    booking: {
      id: booking.id,
      interviewer: booking.interviewer,
      interviewee: booking.interviewee,
      categories: booking.interviewer.categories,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
    },
  };
};

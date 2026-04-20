"use server";

/*
 * File Overview:
 * Use Case: Interviewee ke appointments fetch karta hai aur plan ke hisaab se recording access control karta hai.
 * Project Role: Appointments page ko clean data deta hai aur premium feature gating centralize karta hai.
 * Typical Trigger: `/appointments` page server render ke time call hota hai.
 * File Path: actions/appointments.js
 */
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const getIntervieweeAppointments = async () => {
  try {
    const { userId, has } = await auth();
    if (!userId) return [];

    // Note: Clerk userId se app DB user map.
    const dbUser = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!dbUser) return [];

    // Note: recordings ko plan feature ke hisaab se expose karna hai.
    const normalizedPlan = (dbUser.currentPlan || "").toLowerCase();
    const canAccessRecordings =
      normalizedPlan === "pro" || Boolean(has?.({ plan: "pro" }));

    // Note: is user ki saari bookings latest-first load karte hain.
    const bookings = await db.booking.findMany({
      where: { intervieweeId: dbUser.id },
      include: {
        interviewer: {
          select: {
            name: true,
            imageUrl: true,
            email: true,
            title: true,
            company: true,
            categories: true,
          },
        },
        feedback: true,
      },
      orderBy: { startTime: "desc" },
    });

    if (canAccessRecordings) return bookings;

    // Note: non-pro users ke liye booking list same rahegi,
    // bas recordingUrl null karke playback hide kar diya जाता है.
    return bookings.map((booking) => ({
      ...booking,
      recordingUrl: null,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getIntervieweeAppointments error:", message);
    return [];
  }
};

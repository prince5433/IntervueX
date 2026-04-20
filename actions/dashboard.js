"use server";

/*
 * File Overview:
 * Use Case: Interviewer dashboard ke availability, appointments, earnings stats aur withdrawal workflow handle karta hai.
 * Project Role: Interviewer business operations ka backend backbone hai (calendar + earning + payout requests).
 * Typical Trigger: Dashboard tabs load hone par aur actions (save availability / withdraw) ke time invoke hota hai.
 * File Path: actions/dashboard.js
 */
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { request } from "@arcjet/next";
import { createRateLimiter, checkRateLimit } from "@/lib/arcjet";
import { Resend } from "resend";
import { WithdrawalRequestEmail } from "@/emails/WithdrawalRequestEmail";
import { render } from "@react-email/render";

const resend = new Resend(process.env.RESEND_API_KEY);

const withdrawalLimiter = createRateLimiter({
  // Note: practical cap to avoid blocking legitimate retries.
  refillRate: 2,
  interval: "1h",
  capacity: 6,
});

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

export const setAvailability = async ({ startTime, endTime }) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
  if (!dbUser || dbUser.role !== "INTERVIEWER") throw new Error("Forbidden");

  if (!startTime || !endTime) throw new Error("Start and end time required");
  // Note: invalid window guard - start end se pehle hi hona chahiye.
  if (new Date(startTime) >= new Date(endTime))
    throw new Error("Start time must be before end time");

  try {
    // Note: design decision - interviewer ke liye currently single active availability window maintain hoti hai.
    // isliye create naya tabhi, jab pehle AVAILABLE row exist na kare.
    const existing = await db.availability.findFirst({
      where: { interviewerId: dbUser.id, status: "AVAILABLE" },
    });

    if (existing) {
      await db.availability.update({
        where: { id: existing.id },
        data: { startTime: new Date(startTime), endTime: new Date(endTime) },
      });
    } else {
      await db.availability.create({
        data: {
          interviewerId: dbUser.id,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          status: "AVAILABLE",
        },
      });
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error(err);
    throw new Error("Failed to save availability");
  }
};

export const getAvailability = async () => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
  if (!dbUser) throw new Error("User not found");

  return db.availability.findFirst({
    where: { interviewerId: dbUser.id, status: "AVAILABLE" },
  });
};

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────

export const getInterviewerAppointments = async () => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
  if (!dbUser) throw new Error("User not found");

  return db.booking.findMany({
    where: { interviewerId: dbUser.id },
    include: {
      interviewee: { select: { name: true, imageUrl: true, email: true } },
      feedback: true,
    },
    orderBy: { startTime: "desc" },
  });
};

// ─── EARNINGS / WITHDRAWAL ────────────────────────────────────────────────────

export const getInterviewerStats = async () => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
    select: {
      creditBalance: true,
      creditRate: true,
      bookingsAsInterviewer: {
        where: { status: "COMPLETED" },
        select: { creditsCharged: true },
      },
    },
  });
  if (!dbUser) throw new Error("User not found");

  // Note: earned credits ko completed bookings se derive karte hain,
  // taaki dashboard DB ke source-of-truth se accurate rahe.
  const totalEarned = dbUser.bookingsAsInterviewer.reduce(
    (sum, b) => sum + b.creditsCharged,
    0
  );

  return {
    creditBalance: dbUser.creditBalance,
    creditRate: dbUser.creditRate,
    totalEarned,
    completedSessions: dbUser.bookingsAsInterviewer.length,
  };
};

// Assignment
export const requestWithdrawal = async ({
  credits,
  paymentMethod,
  paymentDetail,
}) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
  if (!dbUser || dbUser.role !== "INTERVIEWER") throw new Error("Forbidden");
  const clerkPrimaryEmail = user.emailAddresses?.[0]?.emailAddress;

  if (!credits || credits <= 0) throw new Error("Invalid credit amount");
  if (credits > dbUser.creditBalance)
    throw new Error("Insufficient credit balance");
  if (!paymentMethod || !paymentDetail)
    throw new Error("Payment details required");

  // Run rate-limit only after payload passes validation,
  // so bad inputs don't consume tokens.
  const req = await request();
  const rateLimitError = await checkRateLimit(withdrawalLimiter, req, user.id);
  if (rateLimitError) throw new Error(rateLimitError);

  // payout math:
  // 1 credit = $5 (project rule), platform 20% cut leta hai.
  const PLATFORM_FEE = 0.2;
  const netAmount = credits * (1 - PLATFORM_FEE) * 5;
  const platformFee = credits * PLATFORM_FEE * 5;

  try {
    // Note: payout create + credit decrement ek hi transaction me,
    // warna race/failure se balance mismatch ho sakta hai.
    const [payout] = await db.$transaction([
      db.payout.create({
        data: {
          interviewerId: dbUser.id,
          credits,
          platformFee,
          netAmount,
          paymentMethod,
          paymentDetail,
          status: "PROCESSING",
        },
      }),
      db.user.update({
        where: { id: dbUser.id },
        data: { creditBalance: { decrement: credits } },
      }),
    ]);

    let emailSent = false;
    let emailError = null;

    // Fire notification email (Resend only)
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is missing");
      }

      const recipients = Array.from(
        new Set([clerkPrimaryEmail, dbUser.email].filter(Boolean))
      );

      if (recipients.length === 0) {
        throw new Error("No recipient email found for withdrawal notification");
      }

      // Note: admin review URL dynamic payout id ke saath ban raha hai.
      const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payout/${payout.id}`;
      const html = await render(
        WithdrawalRequestEmail({
          interviewerName: dbUser.name ?? "Unknown",
          interviewerEmail: dbUser.email,
          credits,
          platformFee,
          netAmount,
          paymentMethod,
          paymentDetail,
          reviewUrl,
        })
      );
      const fromAddress =
        process.env.RESEND_FROM || "IntervueX <onboarding@resend.dev>";
      let sendResult = await resend.emails.send({
        from: fromAddress,
        to: recipients,
        subject: `Withdrawal Request — ${dbUser.name} · ${credits} credits`,
        html,
      });

      if (sendResult?.error) {
        const resendMessage = sendResult.error.message || "Resend send failed";
        const sandboxRestriction = /only send testing emails/i.test(resendMessage);

        if (!sandboxRestriction) {
          throw new Error(resendMessage);
        }

        const testRecipient =
          process.env.RESEND_TEST_RECIPIENT ||
          "prince11mayminote7pro@gmail.com";

        sendResult = await resend.emails.send({
          from: fromAddress,
          to: [testRecipient],
          subject: `Withdrawal Request — ${dbUser.name} · ${credits} credits`,
          html,
        });

        if (sendResult?.error) {
          throw new Error(sendResult.error.message || "Resend sandbox fallback failed");
        }

        emailError = `Resend sandbox mode active: sent to test recipient ${testRecipient}`;
      }

      emailSent = true;

      console.log("Withdrawal email sent:", {
        payoutId: payout.id,
        emailId: sendResult?.data?.id,
        recipients,
      });
    } catch (emailErr) {
      const emailMessage =
        emailErr instanceof Error ? emailErr.message : String(emailErr);
      emailError = emailMessage;
      console.error("Withdrawal email failed:", {
        payoutId: payout.id,
        clerkPrimaryEmail,
        dbEmail: dbUser.email,
        message: emailMessage,
      });
    }

    revalidatePath("/dashboard");
    return { success: true, netAmount, emailSent, emailError };
  } catch (err) {
    console.error(err);
    throw new Error("Withdrawal request failed");
  }
};

export const getWithdrawalHistory = async () => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
  if (!dbUser) throw new Error("User not found");

  return db.payout.findMany({
    where: { interviewerId: dbUser.id },
    orderBy: { createdAt: "desc" },
  });
};

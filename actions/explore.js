"use server";

/*
 * File Overview:
 * Use Case: Explore screen ke liye interviewer listing optimized payload ke saath fetch karta hai.
 * Project Role: Candidate discovery experience ka primary data source hai.
 * Typical Trigger: `/explore` page render hone par execute hota hai.
 * File Path: actions/explore.js
 */
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const getInterviewers = async () => {
  // Note: logged-in user optional hai; self-exclusion logic me use hoga.
  const user = await currentUser();

  try {
    // Note: listing payload intentionally selective hai,
    // taaki card rendering ke liye sirf required fields aaye aur query light रहे.
    const interviewers = await db.user.findMany({
      where: {
        // Note: explore me sirf interviewer role wale users chahiye.
        role: "INTERVIEWER",
        // Exclude the logged-in user so an interviewer
        // browsing explore doesn't see themselves
        ...(user && { clerkUserId: { not: user.id } }),
      },
      // Note: card render ke liye optimized select payload.
      select: {
        id: true,
        name: true,
        imageUrl: true,
        title: true,
        company: true,
        yearsExp: true,
        bio: true,
        categories: true,
        creditRate: true,
        availabilities: {
          where: { status: "AVAILABLE" },
          select: { startTime: true, endTime: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return interviewers;
  } catch (err) {
    console.error("getInterviewers error:", err);
    return [];
  }
};

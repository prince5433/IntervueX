"use server";

/*
 * File Overview:
 * Use Case: User onboarding payload validate karke role/profile DB me persist karta hai.
 * Project Role: Role-based flow ka foundation set karta hai, jisse baad ki routing/features decide hoti hain.
 * Typical Trigger: Onboarding form submit hone par client hook ke through call hota hai.
 * File Path: actions/onboarding.js
 */
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const completeOnboarding = async (data) => {
  // Note: server side se current auth user fetch.
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Note: request payload ko destructure karke field-wise validate karenge.
  const { role, title, company, yearsExp, bio, categories } = data;

  // Note: role allowlist se hard-validate karte hain taaki invalid payload DB me na जाए.
  if (!role || !["INTERVIEWEE", "INTERVIEWER"].includes(role)) {
    throw new Error("Invalid role");
  }

  if (role === "INTERVIEWER") {
    // Note: interviewer profile complete hona mandatory hai,
    // warna explore page pe low-quality profiles aayengi.
    if (!title || !company || !yearsExp || !bio || !categories?.length) {
      throw new Error("Please fill in all required fields");
    }
  }

  try {
    // Ensure user exists in database first
    let dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
    if (!dbUser) {
      const primaryEmail = user.emailAddresses?.[0]?.emailAddress ?? "";
      const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User";
      dbUser = await db.user.create({
        data: {
          clerkUserId: user.id,
          name,
          email: primaryEmail,
          imageUrl: user.imageUrl,
          credits: 1,
          currentPlan: "free",
          creditsLastAllocatedAt: new Date(),
        },
      });
    }

    // Role save karte hain, interviewer ho to extra profile fields bhi persist.
    await db.user.update({
      where: { clerkUserId: user.id },
      data: {
        role,
        ...(role === "INTERVIEWER" && {
          title,
          company,
          yearsExp: Number(yearsExp),
          bio,
          categories,
        }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Onboarding error:", error);
    throw new Error("Something went wrong. Please try again.");
  }
};

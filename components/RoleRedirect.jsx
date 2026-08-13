"use client";

/*
 * File Overview:
 * Use Case: Role-based client redirects enforce karta hai invalid route access par.
 * Project Role: Post-login navigation correctness maintain karta hai.
 * Trigger: Signed-in state + pathname changes ke saath effect run.
 * File Path: components/RoleRedirect.jsx
 */
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Routes that INTERVIEWER should NOT visit (these are interviewee-only)
const FORBIDDEN_FOR_INTERVIEWER = ["/appointments"];
// Routes that INTERVIEWEE should NOT visit (these are interviewer-only)
const FORBIDDEN_FOR_INTERVIEWEE = ["/dashboard"];

export default function RoleRedirect({ role }) {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (role === "UNASSIGNED" && pathname !== "/onboarding")
      router.replace("/onboarding");
    // Already onboarded users shouldn't be on /onboarding
    if (role === "INTERVIEWER" && pathname.startsWith("/onboarding"))
      router.replace("/dashboard");
    if (role === "INTERVIEWEE" && pathname.startsWith("/onboarding"))
      router.replace("/explore");
    if (
      role === "INTERVIEWER" &&
      FORBIDDEN_FOR_INTERVIEWER.some((p) => pathname.startsWith(p))
    )
      router.replace("/dashboard");
    if (
      role === "INTERVIEWEE" &&
      FORBIDDEN_FOR_INTERVIEWEE.some((p) => pathname.startsWith(p))
    )
      router.replace("/appointments");
  }, [role, pathname, router]);

  return null;
}

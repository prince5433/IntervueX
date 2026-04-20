/*
 * File Overview:
 * Use Case: Sign-up route me Clerk registration widget mount karta hai.
 * Project Role: New user onboarding into auth layer yahan se start hota hai.
 * Trigger: Sign-up path open hone par.
 * File Path: app/(auth)/sign-up/[[...sign-up]]/page.jsx
 */
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return <SignUp />;
}

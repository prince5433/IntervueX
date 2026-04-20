/*
 * File Overview:
 * Use Case: Sign-in route me Clerk auth widget mount karta hai.
 * Project Role: Login flow ka entry point provide karta hai.
 * Trigger: Unauth user sign-in path open kare tab.
 * File Path: app/(auth)/sign-in/[[...sign-in]]/page.jsx
 */
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return <SignIn />;
}

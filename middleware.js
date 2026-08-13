/*
 * File Overview:
 * Use Case: App-level request gatekeeper — auth-protected routes ko secure karta hai.
 * Project Role: Unauthorized access block karta hai, protected routes par login enforce karta hai.
 * Note: Arcjet (shield + bot detection) yahan se hata diya gaya hai kyunki yeh Edge Function
 *       bundle ko 1.1MB tak bada deta tha (Vercel free plan limit = 1MB).
 *       Per-action rate limiting already booking.js aur dashboard.js me hai via lib/arcjet.js,
 *       jo Node.js serverless functions me run hota hai (no size limit).
 * Typical Trigger: Next.js middleware pipeline me route hit hote hi execute hota hai.
 * File Path: middleware.js
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Note: in routes par login required hai.
const isProtectedRoute = createRouteMatcher([
  "/appointments(.*)",
  "/explore(.*)",
  "/dashboard(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Note: Clerk auth context se userId nikaalte hain.
  const { userId, redirectToSignIn } = await auth();

  // Note: protected route par unauthenticated user ko Clerk sign-in flow me redirect.
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn();
  }

  return NextResponse.next();
});

// Note: middleware matcher static assets ko skip karke app/api routes par apply hota hai.
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};


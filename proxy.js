/*
 * File Overview:
 * Use Case: App-level request gatekeeper: auth-protected routes secure karta hai aur bot/abuse traffic block karta hai.
 * Project Role: Ye middleware har incoming request par security + access policy enforce karta hai, isliye unauthorized access aur automated abuse dono control me rehte hain.
 * Typical Trigger: Next.js middleware pipeline me route hit hote hi execute hota hai.
 * File Path: proxy.js
 */
import arcjet, { detectBot, shield } from "@arcjet/next";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Note: in routes par login required hai.
const isProtectedRoute = createRouteMatcher([
  "/appointments(.*)",
  "/explore(.*)",
  "/dashboard(.*)",
  "/onboarding(.*)",
]);

// Trusted external webhooks — skip Arcjet entirely
const isWebhookRoute = createRouteMatcher(["/api/webhooks/stream(.*)"]);

// Note: Arcjet security instance (shield + bot detection) initialize.
const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    // Note: generic abuse protection layer.
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      // Note: search engine/crawler previews ko allow list me rakhte hain.
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
    }),
  ],
});

export default clerkMiddleware(async (auth, req) => {
  // Skip Arcjet for trusted webhook routes
  if (!isWebhookRoute(req)) {
    // Note: webhook ke alawa sab requests pe Arcjet shield/bot rules enforce hote hain.
    const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Note: Clerk auth context se userId nikaalte hain.
  const { userId } = await auth();

  // Note: protected route par unauthenticated user ko Clerk sign-in flow me redirect.
  if (!userId && isProtectedRoute(req)) {
    const { redirectToSignIn } = await auth();
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

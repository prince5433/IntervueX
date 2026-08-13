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
  //webhooks basically kya hote hain? Webhooks ek tarah ke HTTP callbacks hote hain jo ek application ko dusre application ko real-time me data push karne ki suvidha dete hain. Jab bhi koi specific event hota hai (jaise ki user registration, payment success, etc.), toh webhook URL par ek HTTP request bheji jati hai jisme event ke details hoti hain. Isse receiving application turant action le sakta hai bina baar-baar API ko poll kiye.
  if (!isWebhookRoute(req)) {
    if (process.env.ARCJET_KEY) {
      const decision = await aj.protect(req);
      if (decision.isDenied()) {
        console.log("Arcjet request denied:", decision.reason);
        const isVercelPreview = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production";
        if (isVercelPreview && decision.reason.isBot()) {
          console.log("Bypassing bot block in preview/development environment");
        } else {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    } else {
      console.log("Arcjet key is missing, skipping protection check");
    }
  }

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

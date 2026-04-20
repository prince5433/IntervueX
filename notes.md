# IntervueX Architecture Notes

## Natural-Language Quick Samajh (Fast Track)

Yeh app basically 2 type users ke liye hai:
- Interviewee: credits use karke session book karta hai.
- Interviewer: session leta hai, credits earn karta hai, payout request karta hai.

Ultra-short end-to-end flow:
1. Clerk se login hota hai.
2. User DB me sync hota hai (aur monthly credits allocate hote hain, role ke hisaab se).
3. Onboarding me role decide hota hai.
4. Interviewee explore page pe interviewer choose karta hai.
5. Slot book hote hi booking + credits transaction + Stream call create hota hai.
6. Call ke baad Stream webhook transcript/recording bhejta hai.
7. Gemini transcript analyze karke feedback generate karta hai.
8. Interviewer dashboard se withdrawal request bhejta hai.
9. Admin payout approval page se request process karta hai.

Padne ka asaan formula:
- Route samajhna ho: app/
- Backend business logic samajhna ho: actions/
- Shared logic samajhna ho: lib/
- Reusable UI samajhna ho: components/
- DB samajhna ho: prisma/schema.prisma

## 1) What this project is
IntervueX is a full-stack Next.js App Router application for mock interviews.

Main personas:
- Interviewee: discovers interviewers, books sessions with credits, joins call, receives AI feedback.
- Interviewer: sets availability, conducts calls, earns credits, requests withdrawals.

Core platform services:
- Auth + plans: Clerk
- Data: PostgreSQL + Prisma
- Calls/chat/transcription/recording: Stream
- AI generation: Gemini
- Security/rate limits: Arcjet
- Transactional email: Resend + React Email

## 2) Tech stack used

### Frontend
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- shadcn/ui-style component primitives under components/ui
- motion + custom animate-ui demo components

### Backend / Full-stack
- Next.js Server Components + Server Actions
- Route Handlers (webhook endpoint)
- Clerk server SDK and middleware
- Arcjet middleware + token bucket rate limiters

### Data layer
- Prisma 7 client generated into lib/generated/prisma
- PostgreSQL driver pg via Prisma adapter @prisma/adapter-pg
- Prisma migrations and schema under prisma

### External APIs
- Stream Video/Chat (call creation, client join token, recordings, transcription)
- Google Gemini (AI interview questions + AI feedback from transcript)
- Resend (withdrawal request emails to admin)

### Tooling
- ESLint + eslint-config-next
- Prisma postinstall generate

## 3) High-level runtime flow

### A) Auth + user bootstrap + monthly credits
1. User signs in with Clerk.
2. Header server component calls lib/checkUser.js.
3. checkUser:
   - creates DB user if missing,
   - detects current Clerk plan (free/starter/pro),
   - allocates monthly credits for interviewees,
   - preserves interviewer behavior (no monthly credit allocation).
4. RoleRedirect client component sends users to the right area by role.

### B) Onboarding flow
1. Unassigned user is redirected to /onboarding.
2. Interviewee onboarding stores role only.
3. Interviewer onboarding stores profile fields (title, company, years, bio, categories).
4. Then user is sent to /explore (interviewee) or /dashboard (interviewer).

### C) Explore and booking flow
1. Interviewee opens /explore.
2. Server fetches interviewers (actions/explore.js).
3. On interviewer profile page (/interviewers/[id]), SlotPicker renders 7-day slots from interviewer availability.
4. Booking action (actions/booking.js):
   - validates user role and credits,
   - applies Arcjet per-user rate limit,
   - checks slot conflict,
   - creates Stream call and members,
   - runs DB transaction:
     - create booking,
     - create credit transaction,
     - decrement interviewee credits,
     - increment interviewer credit balance.

### D) Call session flow
1. User opens /call/[callId].
2. Server action actions/call.js validates participant and creates Stream user token.
3. Client CallRoom joins Stream call.
4. CallUI provides:
   - video/speaker layout + call controls,
   - chat channel,
   - AI questions panel for interviewer only.

### E) Post-call AI feedback + recording flow
1. Stream sends webhook events to app/api/webhooks/stream/route.js.
2. call.recording_ready:
   - stores recording URL only for pro interviewees.
3. call.transcription_ready:
   - downloads transcript JSONL,
   - normalizes speaker names,
   - sends prompt to Gemini,
   - parses strict JSON,
   - writes Feedback record,
   - marks booking completed.

### F) Dashboard and payouts
1. Interviewer dashboard page loads availability, appointments, stats, withdrawal history.
2. requestWithdrawal action:
   - rate limits request,
   - validates credits/payment details,
   - creates payout and decrements credit balance in transaction,
   - sends admin review email with secure review URL.
3. Admin visits /payout/[id], enters admin password, approves via actions/payout.js.

## 4) Server vs Client boundary

## Server Components (default, no use client)
- app/layout.js
- app/page.jsx
- app/(auth)/layout.js
- app/(auth)/sign-in/[[...sign-in]]/page.jsx
- app/(auth)/sign-up/[[...sign-up]]/page.jsx
- app/(main)/layout.jsx
- app/(main)/appointments/page.jsx
- app/(main)/call/[callId]/page.jsx
- app/(main)/dashboard/page.jsx
- app/(main)/explore/page.jsx
- app/(main)/interviewers/[id]/page.jsx
- app/(main)/payout/[id]/page.jsx
- components/header.jsx
- app/api/webhooks/stream/route.js (route handler, server-only)

## Client Components (explicit use client)
- app/(main)/onboarding/page.jsx
- app/(main)/call/[callId]/_components/CallRoom.jsx
- app/(main)/call/[callId]/_components/CallUI.jsx
- app/(main)/call/[callId]/_components/AIQuestions.jsx
- app/(main)/dashboard/components/AvailabilitySection.jsx
- app/(main)/dashboard/components/AppointmentsSection.jsx
- app/(main)/dashboard/components/EarningsSection.jsx
- app/(main)/explore/components/ExploreGrid.jsx
- app/(main)/interviewers/[id]/_components/SlotPicker.jsx
- app/(main)/payout/[id]/_components/PayoutReviewClient.jsx
- components/AppointmentCard.jsx
- components/CreditButton.jsx
- components/FeedbackModal.jsx
- components/PricingSection.jsx
- components/RoleRedirect.jsx
- components/UpgradeModal.jsx
- components/demo-components-animate-code.jsx
- components/demo-components-backgrounds-stars.jsx
- components/theme-provider.jsx
- components/ui/avatar.jsx
- components/ui/dialog.jsx
- components/ui/label.jsx
- components/ui/separator.jsx
- components/ui/sonner.jsx
- components/ui/tabs.jsx
- components/animate-ui/components/animate/code.jsx
- components/animate-ui/components/backgrounds/stars.jsx
- components/animate-ui/components/buttons/copy.jsx
- components/animate-ui/primitives/animate/code-block.jsx
- components/animate-ui/primitives/animate/slot.jsx
- components/animate-ui/primitives/buttons/button.jsx

## Server Action modules (use server)
- actions/aiQuestions.jsx
- actions/appointments.js
- actions/booking.js
- actions/call.js
- actions/dashboard.js
- actions/explore.js
- actions/onboarding.js
- actions/payout.js
- actions/user.js

## 5) Folder-by-folder and file-by-file comments

This section is an annotated map so you can quickly understand each part.

### Root files
- package.json: scripts and dependencies (Next 16, React 19, Prisma, Clerk, Stream, Arcjet, Gemini, Resend).
- README.md: product overview + setup guide + env vars.
- next.config.mjs: Next.js runtime config.
- eslint.config.mjs: lint rules.
- jsconfig.json: alias/config for JS tooling.
- postcss.config.mjs: PostCSS/Tailwind processing.
- prisma.config.ts: Prisma config for migration connection.
- proxy.js: middleware logic (Clerk + Arcjet protection and route gating).
- components.json: shadcn-related UI config.

### app/
- app/layout.js: root providers (ClerkProvider, theme provider), global header/footer and fonts.
- app/page.jsx: marketing landing page and pricing entry point.
- app/globals.css: global styles and utility layers.
- app/favicon.ico: browser icon.

#### app/(auth)/
- app/(auth)/layout.js: auth page wrapper layout.
- app/(auth)/sign-in/[[...sign-in]]/page.jsx: Clerk SignIn screen.
- app/(auth)/sign-up/[[...sign-up]]/page.jsx: Clerk SignUp screen.

#### app/(main)/
- app/(main)/layout.jsx: main app route wrapper.

##### app/(main)/appointments/
- app/(main)/appointments/page.jsx: interviewee appointment timeline (upcoming/past).

##### app/(main)/call/[callId]/
- app/(main)/call/[callId]/page.jsx: validates participant and returns call bootstrap props.
- app/(main)/call/[callId]/_components/CallRoom.jsx: joins Stream call and mounts provider contexts.
- app/(main)/call/[callId]/_components/CallUI.jsx: in-call UX (video, controls, chat, AI tab).
- app/(main)/call/[callId]/_components/AIQuestions.jsx: interviewer AI question generator panel.

##### app/(main)/dashboard/
- app/(main)/dashboard/page.jsx: interviewer dashboard shell with tabs and server data fetch.
- app/(main)/dashboard/components/AvailabilitySection.jsx: set/update daily availability window.
- app/(main)/dashboard/components/AppointmentsSection.jsx: interviewer appointments listing.
- app/(main)/dashboard/components/EarningsSection.jsx: stats, withdrawal requests, and history.

##### app/(main)/explore/
- app/(main)/explore/page.jsx: server page fetching interviewer list.
- app/(main)/explore/components/ExploreGrid.jsx: client filtering/search by category and text.
- app/(main)/explore/components/InterviewerCard.jsx: interviewer summary card and profile CTA.

##### app/(main)/interviewers/[id]/
- app/(main)/interviewers/[id]/page.jsx: full interviewer profile page and booking section.
- app/(main)/interviewers/[id]/_components/SlotPicker.jsx: date/slot generation + booking confirmation UI.

##### app/(main)/onboarding/
- app/(main)/onboarding/page.jsx: role selection and interviewer details form.

##### app/(main)/payout/[id]/
- app/(main)/payout/[id]/page.jsx: admin review page server fetch.
- app/(main)/payout/[id]/_components/PayoutReviewClient.jsx: admin password submit and payout approval.

#### app/api/webhooks/stream/
- app/api/webhooks/stream/route.js: Stream webhook processor for recordings/transcripts and feedback generation.

### actions/
- actions/aiQuestions.jsx: Gemini-based interview question generation by category.
- actions/appointments.js: interviewee appointments fetch with recording access gating by plan.
- actions/booking.js: booking transaction + Stream call creation + credit transfers.
- actions/call.js: validates booking participant and generates Stream user token.
- actions/dashboard.js: interviewer availability, appointments, stats, and withdrawal requests.
- actions/explore.js: list interviewers for explore page.
- actions/onboarding.js: completes user role/profile onboarding.
- actions/payout.js: secure admin payout approval by password.
- actions/user.js: current DB user summary fetch.

### components/
- components/header.jsx: top navigation, auth state actions, role-aware links and credit button.
- components/RoleRedirect.jsx: client-side role-based route guard.
- components/CreditButton.jsx: opens upgrade modal for interviewees; dashboard shortcut for interviewers.
- components/UpgradeModal.jsx: pricing modal for plan upgrade paths.
- components/PricingSection.jsx: free/starter/pro rendering and Clerk checkout button integration.
- components/AppointmentCard.jsx: shared appointment card for both roles, feedback/recording/call controls.
- components/FeedbackModal.jsx: detailed AI feedback display.
- components/reusables.jsx: shared visual text components/page heading pieces.
- components/theme-provider.jsx: next-themes wrapper.
- components/demo-components-animate-code.jsx: landing demo code animation.
- components/demo-components-backgrounds-stars.jsx: animated star background wrapper.

#### components/ui/
- components/ui/avatar.jsx: avatar primitive.
- components/ui/badge.jsx: badge primitive.
- components/ui/button.jsx: button primitive and variants.
- components/ui/card.jsx: card primitive.
- components/ui/dialog.jsx: modal dialog primitive.
- components/ui/input.jsx: input primitive.
- components/ui/label.jsx: label primitive.
- components/ui/separator.jsx: separator primitive.
- components/ui/sonner.jsx: toast primitive.
- components/ui/tabs.jsx: tab primitive.
- components/ui/textarea.jsx: textarea primitive.

#### components/animate-ui/
- components/animate-ui/components/animate/code.jsx: animated code renderer.
- components/animate-ui/components/backgrounds/stars.jsx: animated star background component.
- components/animate-ui/components/buttons/copy.jsx: animated copy button.
- components/animate-ui/primitives/animate/code-block.jsx: code-block animation primitive.
- components/animate-ui/primitives/animate/slot.jsx: slot animation primitive.
- components/animate-ui/primitives/buttons/button.jsx: animated button primitive.

### emails/
- emails/WithdrawalRequestEmail.jsx: email template for payout request review.

### hooks/
- hooks/use-fetch.js: generic async wrapper with loading/error/data + toast.
- hooks/use-controlled-state.jsx: controlled/uncontrolled state helper hook.
- hooks/use-is-in-view.jsx: in-view detection hook.

### lib/
- lib/prisma.js: singleton Prisma client using pg adapter.
- lib/checkUser.js: Clerk user sync + monthly credit allocation logic.
- lib/arcjet.js: reusable Arcjet token-bucket limiter helpers.
- lib/data.js: constants (plans, categories, labels, styles, static UI data).
- lib/helpers.js: date/time formatting and slot generation logic.
- lib/utils.js: shared utility helpers.
- lib/get-strict-context.jsx: strict React context helper.
- lib/generated/prisma/*: auto-generated Prisma client files (do not edit manually).

### prisma/
- prisma/schema.prisma: full data model for users, bookings, feedback, payouts, transactions.
- prisma/seed.js: manual helper seed script for feedback/testing.
- prisma/migrations/*: schema migration history SQL.

### public/
- static images and brand assets (logos, hero/media, icons) used by landing and cards.

## 6) Data model summary
- User: auth-linked profile, role, credits, plan, interviewer metadata.
- Availability: interviewer open time ranges.
- Booking: scheduled call between interviewee and interviewer with Stream call ID.
- Feedback: AI + optional session feedback tied 1:1 with booking.
- CreditTransaction: credit ledger entries.
- Payout: interviewer withdrawal request/processing records.

## 7) Security and safeguards
- Middleware (proxy.js): protected route gating + Arcjet shield and bot detection.
- Rate limits:
  - Booking attempts token bucket in actions/booking.js.
  - Withdrawal requests token bucket in actions/dashboard.js.
- Admin payout approval requires ADMIN_PAYOUT_PASSWORD.
- Webhook route trusted/handled server-side only.

## 8) Environment variables used (functional groups)
- Database: DATABASE_URL, DIRECT_URL
- Clerk auth: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, sign-in/up URLs
- Clerk billing: NEXT_PUBLIC_CLERK_BILLING_ENABLED, NEXT_PUBLIC_CLERK_STARTER_PLAN_ID, NEXT_PUBLIC_CLERK_PRO_PLAN_ID
- Stream: NEXT_PUBLIC_STREAM_API_KEY, STREAM_SECRET_KEY
- Gemini: GEMINI_API_KEY
- Arcjet: ARCJET_KEY
- Resend: RESEND_API_KEY
- App: NEXT_PUBLIC_APP_URL
- Admin: ADMIN_PAYOUT_PASSWORD

## 9) Suggested reading order for new contributors
1. app/layout.js
2. components/header.jsx
3. lib/checkUser.js
4. prisma/schema.prisma
5. actions/onboarding.js
6. actions/explore.js and app/(main)/explore/*
7. actions/booking.js and app/(main)/interviewers/[id]/_components/SlotPicker.jsx
8. actions/call.js and app/(main)/call/[callId]/_components/*
9. app/api/webhooks/stream/route.js
10. actions/dashboard.js and app/(main)/dashboard/components/*
11. actions/payout.js and app/(main)/payout/[id]/_components/PayoutReviewClient.jsx

## 10) Notes for maintenance
- lib/generated/prisma is generated output; regenerate via prisma generate instead of manual edits.
- If route protection changes, update both middleware matcher and RoleRedirect logic.
- Stream webhook relies on streamCallId consistency between booking creation and webhook payload parsing.
- Credit and payout logic should always remain transactional to prevent balance drift.

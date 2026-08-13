# 🎯 IntervueX — Ultimate Interview Guide (2-3 Hour Prep)

> **Bhai isko padh le — kal interview crack ho jayega! 💪**
> Saari important cheezein easy Hinglish me hain. Questions + Answers ready-made hain.

---

## ⏰ 2-Hour Study Plan

| Time | Kya Padho | Section |
|------|-----------|---------|
| **0:00 – 0:30** | Project Overview + Tech Stack + Architecture | Section 1-3 |
| **0:30 – 1:00** | Core Features + Code Walkthrough (Top 5 Files) | Section 4-5 |
| **1:00 – 1:30** | Database + Security + AI Pipeline | Section 6-8 |
| **1:30 – 2:00** | Interview Q&A Practice (Section 9) | Section 9 |
| **Last 15 min** | Cheat Sheet + Speaking Scripts | Section 10 |

---

# 📌 Section 1: Project ka Introduction (Ratta Maar Le)

## 30-Second Elevator Pitch
> "IntervueX ek **AI-powered mock interview platform** hai jahan candidates real senior engineers se 1:1 practice kar sakte hain. Har session ke baad **AI automatically transcript analyze karke detailed feedback** deta hai — technical depth, communication, problem solving sab cover hota hai. Interviewers apni expertise se earn karte hain. Built with **Next.js 16, Stream video, Google Gemini, and Prisma + PostgreSQL**."

## 1-Minute Explanation
> "Maine IntervueX banaya hai — yeh ek full-stack AI mock interview platform hai. Isme do types ke users hain: **interviewees** jo practice karna chahte hain, aur **interviewers** jo apni expertise se earn karna chahte hain.
>
> Candidate explore page pe interviewers browse karta hai, slot book karta hai using credits, aur **Stream-powered HD video call** join karta hai. Interview ke baad, recording automatically **Deepgram se transcribe** hoti hai, fir **Google Gemini** us transcript ko analyze karke ek detailed AI feedback report generate karta hai — covering technical knowledge, communication, problem solving, strengths aur improvements.
>
> Credit system subscription-based hai with rollover. Interviewers ke paas dashboard hai jahan wo availability set karte hain aur earnings withdraw kar sakte hain. Security ke liye **Arcjet rate limiting** hai, authentication **Clerk** handle karta hai, aur database **Supabase PostgreSQL with Prisma ORM** hai. Pura project Next.js 16 App Router pe built hai with Server Actions."

## Why did you build this?
> "Interview preparation ek huge pain point hai. Generic LeetCode practice enough nahi hoti — you need real human feedback on communication, thought process, technical depth. But quality mock interviewers dhundna hard aur expensive hai. IntervueX isko accessible banata hai through a **credit-based marketplace system**."

## Who is this for?
1. Software engineers preparing for FAANG/startup interviews
2. College students preparing for placements
3. Senior engineers wanting to earn by sharing expertise

---

# 📌 Section 2: Tech Stack (Har Ek Ka "Kyu" Yaad Kar)

## Complete Tech Stack Table

| Technology | Purpose | Kyu Choose Kiya? |
|-----------|---------|-------------------|
| **Next.js 16** | Full-stack framework | Ek hi codebase me frontend + backend. Server Components se performance, Server Actions se REST boilerplate khatam |
| **Supabase PostgreSQL** | Database | Relational data hai (User→Booking→Feedback). Financial transactions ke liye ACID compliance zaroori. Managed hosting = no DevOps |
| **Prisma 7** | ORM | Schema file = source of truth. Auto migrations, type-safe queries, relation handling |
| **Clerk** | Auth + Billing | Drop-in auth with subscription plans (Free/Starter/Pro). Pre-built UI, webhook support |
| **Stream SDK** | Video Calls | HD video, auto-recording, transcription, screen sharing. Custom WebRTC banana would take months |
| **Google Gemini** | AI Feedback + Questions | Fast (flash-lite model), cheap, good at structured JSON output |
| **Deepgram** | Speech-to-Text | Stream ka transcription 5-15 min leta tha. Deepgram seconds me kar deta hai |
| **Arcjet** | Security | Bot protection, token-bucket rate limiting per userId |
| **Resend** | Email | Withdrawal notification emails — React-based templates |
| **Tailwind CSS 4** | Styling | Rapid development, utility-first, shadcn/ui components |
| **Motion** | Animations | Smooth page transitions, micro-animations |

## "Why Not" Answers (Interview Me Zaroor Poochenge!)

| Question | Answer |
|----------|--------|
| Why not Express+React? | Separate backend = deployment complexity, CORS issues, duplicate code |
| Why not MongoDB? | Data relational hai (User→Booking→Feedback), financial transactions ko ACID chahiye |
| Why not NextAuth? | No built-in billing/subscriptions, more manual setup |
| Why not custom WebRTC? | Years of development, TURN servers, recording infrastructure — Stream ready-made deta hai |
| Why not GPT-4? | Gemini cheaper + faster for structured JSON output |
| Why not Firebase? | Need relational DB, Firebase document-based hai |

---

# 📌 Section 3: Architecture (Diagram Yaad Kar)

## High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                  USER (Browser)                  │
│  Landing │ Explore │ Booking │ Call │ Dashboard  │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────┐
│               NEXT.JS 16 (App Router)            │
│                                                   │
│  Middleware ──► Server Components ──► API Routes  │
│  (Clerk+Arcjet)  (+ Server Actions)  (/webhooks) │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │          Server Actions (actions/)           │ │
│  │  booking │ dashboard │ call │ explore │ etc  │ │
│  └────────────────────┬────────────────────────┘ │
│                       │                           │
│  ┌────────────────────┴────────────────────────┐ │
│  │         Library Layer (lib/)                 │ │
│  │  prisma │ checkUser │ arcjet │ feedbackPipe  │ │
│  └────────────────────┬────────────────────────┘ │
└───────────────────────┼─────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  ┌──────────┐   ┌───────────┐   ┌───────────┐
  │ Supabase │   │ Clerk     │   │ Stream    │
  │ PostgreSQL│   │ Arcjet    │   │ Gemini AI │
  │ (Prisma) │   │ Resend    │   │ Deepgram  │
  └──────────┘   └───────────┘   └───────────┘
```

## Key Architecture Decisions

| Decision | Why? |
|----------|------|
| **Monolith (not microservices)** | Faster development, simpler deployment, fine for current scale |
| **Server Actions (not REST)** | No fetch boilerplate, types flow end-to-end, built-in CSRF, no CORS |
| **Single User model (both roles)** | Simple, no complex joins. Role field decides behavior |
| **Webhook route excluded from Arcjet** | Webhooks come from trusted Stream servers, blocking them would break AI pipeline |

---

# 📌 Section 4: Core Features Deep Dive

## Feature 1: Booking Flow (MOST IMPORTANT — Ye Zaroor Samjho!)

```
User clicks "Book Slot" on /interviewers/[id]
        │
        ▼
  bookSlot() Server Action fires
        │
        ├── Step 1: Auth Check (Clerk currentUser())
        ├── Step 2: Rate Limit (Arcjet: 5 bookings/hour per user)
        ├── Step 3: Parallel DB Fetch (Promise.all — interviewee + interviewer)
        ├── Step 4: Validation (Role check + Credit check)
        ├── Step 5: Conflict Detection (Overlap query — same slot double booking check)
        ├── Step 6: Stream Video Call Creation (auto-record + auto-transcribe)
        └── Step 7: Atomic DB Transaction (4 operations):
            ├── 1. Create Booking record
            ├── 2. Create CreditTransaction (BOOKING_DEDUCTION)
            ├── 3. Decrement interviewee credits
            └── 4. Increment interviewer creditBalance
        │
        ▼
  revalidatePath() → Cache Invalidation
  Return { success, bookingId, streamCallId }
```

### Key Code Points to Remember:
- **Rate Limiting**: Token-bucket algorithm — 5 capacity, 2 refill per hour, **userId as fingerprint** (not IP — shared WiFi pe valid users block na hon)
- **Parallel Fetch**: `Promise.all()` se dono queries simultaneously chalti hain (faster than sequential)
- **Conflict Detection**: `existing.startTime < newEndTime AND existing.endTime > newStartTime` — standard interval overlap formula
- **DB Transaction**: `db.$transaction()` ensures all 4 ops succeed or all fail — **no partial states** (e.g., credits deducted but no booking created)
- **Stream Call Before Transaction**: Agar Stream fail ho, to DB transaction start hi nahi karenge → no orphan records

---

## Feature 2: AI Feedback Pipeline (WOW FACTOR — Interviewers Dig Deep Here!)

```
Call Ends
    │
    ▼
Stream fires webhook ──► POST /api/webhooks/stream
    │
    ├── Event: call.recording_ready (FAST PATH)
    │   ├── Save recording URL to DB
    │   ├── Deepgram: Transcribe recording (seconds!)
    │   └── Gemini: Generate structured JSON feedback
    │
    └── Event: call.transcription_ready (FALLBACK)
        ├── Download Stream JSONL transcript
        ├── Parse speaker-labeled text
        └── Gemini: Generate structured JSON feedback
    │
    ▼
DB Transaction:
    ├── Upsert Feedback record (7 fields)
    ├── Update Booking status → COMPLETED
    └── Create CreditTransaction (BOOKING_EARNING)
```

### Gemini Prompt (Ye Yaad Rakh):
Gemini ko bola: "Tu expert interviewer hai. Transcript analyze kar aur JSON me de:
- summary, technical assessment, communication, problem solving
- recommendation (HIRE/CONSIDER/NO_HIRE)
- strengths[] aur improvements[]
- overallRating (POOR/AVERAGE/GOOD/EXCELLENT)"

### Why Dual Transcription?
- **Deepgram**: Fast (seconds me transcribe), but speakers generic labels aate hain (Speaker A, B)
- **Stream**: Slow (5-15 min), but accurate speaker names aate hain (actual user names)
- **Strategy**: Deepgram first (fast path), Stream as fallback (accurate path)
- **Idempotency**: `booking.feedback` check before generating — duplicate webhook pe double feedback nahi banega

### Why Always Return 200 in Webhook?
Stream failed webhooks retry karta hai. Agar 500 return karein aur error transient tha, retry might create duplicate feedback. So **always 200** — prevents retry storms.

---

## Feature 3: Credit-Based Economy

```
Plans:
  Free    → 1 credit/month
  Starter → $29 → 5 credits/month
  Pro     → $69 → 15 credits/month

Booking:  Interviewee ke credits deduct → Interviewer ke creditBalance me add
Rollover: Unused credits next month me carry forward (waste nahi hote!)
Withdraw: 1 credit = $5, Platform takes 20% fee
```

### Credit Allocation Logic (checkUser.js):
```
shouldAllocateCredits() checks:
  1. Plan changed? → Immediate reallocation
  2. Never allocated before? → First time setup
  3. New calendar month? → Monthly grant

Rollover: newCredits = planCredits + existingBalance
```

### Why `creditsCharged` Snapshot in Booking?
Interviewer baad me creditRate change kar sakta hai. Booking should reflect **original price** at booking time, not current rate.

---

## Feature 4: Slot-Based Scheduling

### Slot Generation Algorithm:
```
Input: date, availability window (start/end), existing bookings, 45-min duration

1. Map availability hours onto target date
2. Cursor starts at window start
3. While cursor < window end:
   a. Calculate slot end (cursor + 45min)
   b. If slot overflows window → break
   c. Check overlap with booked slots
   d. If slot is in future → push to results
   e. Advance cursor by 45min

Output: Array of { startTime, endTime, isBooked, available }
```

- **Time Complexity**: O(n × m) where n = slots, m = bookings
- **Overlap Check**: `slotStart < bookedEnd && slotEnd > bookedStart`
- **Past slots filtered out** — only future slots shown to user

---

## Feature 5: AI Question Generator

- Interviewer call ke dauran "Generate Questions" button dabata hai
- Category-specific prompt → Gemini → 6 Q&A pairs return
- JSON parsing with markdown fence cleanup (`/^```json|^```|```$/gm`)

---

# 📌 Section 5: Top 5 Files Code Walkthrough

## File 1: [booking.js](file:///c:/Users/Prince/OneDrive/Desktop/IntervueX/ai-interview-platform/actions/booking.js)
**Sabse Important File! 289 Lines.**
- `getInterviewerProfile()` — Profile + available slots + existing bookings fetch
- `bookSlot()` — Full booking flow with 7 steps (auth → rate limit → validate → Stream → DB transaction)
- Key Pattern: `db.$transaction()` with 4 atomic operations

## File 2: [feedbackPipeline.js](file:///c:/Users/Prince/OneDrive/Desktop/IntervueX/ai-interview-platform/lib/feedbackPipeline.js)
**AI Pipeline — 190 Lines.**
- `transcribeWithDeepgram()` — Recording URL → speaker-diarized transcript
- `buildTranscriptFromStreamJsonl()` — Stream JSONL → named speaker transcript
- `generateAndPersistFeedback()` — Gemini analysis → DB transaction (feedback + status + earning)

## File 3: [schema.prisma](file:///c:/Users/Prince/OneDrive/Desktop/IntervueX/ai-interview-platform/prisma/schema.prisma)
**Database Blueprint — 232 Lines.**
- 6 Models: User, Availability, Booking, Feedback, CreditTransaction, Payout
- 6 Enums: UserRole, BookingStatus, AvailabilityStatus, PayoutStatus, InterviewCategory, FeedbackRating, TransactionType
- Key Indexes for fast queries

## File 4: [proxy.js](file:///c:/Users/Prince/OneDrive/Desktop/IntervueX/ai-interview-platform/proxy.js) (Middleware)
**Security Gatekeeper — 67 Lines.**
- Clerk auth middleware on protected routes
- Arcjet shield + bot detection on all non-webhook routes
- Webhook routes excluded (trusted Stream servers)

## File 5: [webhook route.js](file:///c:/Users/Prince/OneDrive/Desktop/IntervueX/ai-interview-platform/app/api/webhooks/stream/route.js)
**Post-Call Automation — 131 Lines.**
- Handles `call.recording_ready` and `call.transcription_ready`
- Dual transcription strategy (Deepgram fast + Stream fallback)
- Idempotency checks + always returns 200

---

# 📌 Section 6: Database Deep Dive

## ER Diagram (Ye Draw Karna Aana Chahiye)

```
┌─────────┐  1:N  ┌──────────────┐
│  User   │◄──────│ Availability │
│         │       └──────────────┘
│  (Both  │
│  Roles) │  1:N  ┌──────────────┐  1:1  ┌──────────┐
│         │◄──────│   Booking    │──────►│ Feedback │
│         │       └──────┬───────┘       └──────────┘
│         │              │
│         │  1:N  ┌──────┴───────────┐
│         │◄──────│CreditTransaction │
│         │       └──────────────────┘
│         │
│         │  1:N  ┌──────────────┐
│         │◄──────│    Payout    │
└─────────┘       └──────────────┘
```

## 6 Models Summary

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | Both roles in one table | role (ENUM), credits, creditBalance, categories[], creditRate |
| **Availability** | Interviewer's daily time window | startTime, endTime, status |
| **Booking** | A booked session | streamCallId (unique), creditsCharged (snapshot), status, recordingUrl |
| **Feedback** | AI-generated post-call analysis | summary, technical, communication, problemSolving, strengths[], improvements[], overallRating |
| **CreditTransaction** | Immutable audit log | amount (+/-), type (ENUM), bookingId |
| **Payout** | Withdrawal request | credits, platformFee (20%), netAmount, paymentMethod, status |

## 6 Enums

| Enum | Values |
|------|--------|
| UserRole | UNASSIGNED, INTERVIEWEE, INTERVIEWER |
| BookingStatus | SCHEDULED, COMPLETED, CANCELLED |
| AvailabilityStatus | AVAILABLE, BOOKED, BLOCKED |
| PayoutStatus | PROCESSING, PROCESSED |
| InterviewCategory | FRONTEND, BACKEND, FULLSTACK, DSA, SYSTEM_DESIGN, BEHAVIORAL, DEVOPS, MOBILE |
| FeedbackRating | POOR, AVERAGE, GOOD, EXCELLENT |
| TransactionType | CREDIT_PURCHASE, BOOKING_DEDUCTION, BOOKING_EARNING, ADMIN_ADJUSTMENT |

## Important Indexes (Performance ke liye)
```
Availability: @@index([interviewerId, startTime])
Booking:      @@index([status, createdAt])
              @@index([interviewerId, status])
              @@index([intervieweeId, status])
Payout:       @@index([status, createdAt])
              @@index([interviewerId, status])
```

## Why Single User Model for Both Roles?
- **Simple**: No complex joins needed
- **Trade-off**: Some fields null for wrong role (e.g., `bio` null for interviewee)
- Role field determines which fields are relevant

---

# 📌 Section 7: Security Deep Dive

| Security Layer | Implementation | Explanation |
|---------------|----------------|-------------|
| **Authentication** | Clerk middleware | Har request pe auth check. JWT in HTTP-only cookies (XSS-safe) |
| **Authorization** | Role checks in server actions | Har action me `currentUser()` + role verify |
| **Bot Protection** | Arcjet shield + detectBot | Middleware level — automated scripts block |
| **Rate Limiting** | Token-bucket per userId | IP ke bajaye userId fingerprint — shared WiFi pe valid users safe |
| **CSRF Prevention** | Server Actions built-in | Next.js automatically CSRF tokens handle karta hai |
| **XSS Prevention** | React auto-escapes | JSX output automatically escaped |
| **SQL Injection** | Prisma parameterized queries | Never raw SQL — Prisma handles escaping |
| **Webhook Security** | Excluded from Arcjet | Trusted Stream servers — blocking breaks pipeline |
| **Token Expiry** | Stream tokens 1-hour validity | Expired tokens se re-join nahi ho sakta |
| **Idempotency** | Feedback duplicate check | Duplicate webhooks se double feedback nahi |
| **Admin Gate** | Password comparison for payouts | Admin-only payout approval |
| **Env Secrets** | .env file, server-only | Never exposed to client bundle |

---

# 📌 Section 8: Performance + Scalability

## Performance Optimizations

| Optimization | Where | Impact |
|-------------|-------|--------|
| **Server Components** | Most pages | Zero JS shipped for data fetching |
| **Parallel Data Fetch** | Dashboard: `Promise.all()` | 4x faster initial load |
| **Prisma Singleton** | `lib/prisma.js` → `globalThis` | Prevents connection leaks in dev (HMR) |
| **Selective Select** | All DB queries | 50-70% less data transferred (only needed fields) |
| **useMemo** | ExploreGrid filtering | Avoids re-filtering on every render |
| **revalidatePath** | After mutations | Targeted cache invalidation |
| **Connection Pooling** | Supabase port 6543 | Shared connections, less overhead |

## Scalability Discussion (Common Interview Question!)

| Users | Problem | Solution |
|-------|---------|----------|
| **100** | None | Current architecture works |
| **1,000** | DB connections | Connection pooling (already using) |
| **10,000** | Single server | Vercel auto-scales serverless functions |
| **100,000** | DB query speed | Read replicas + Redis caching |
| **1M** | Everything | Microservices: separate video, AI, billing services |

### Specific Scaling Strategies:
- **Redis** cache for hot data (user profiles, interviewer listings)
- **BullMQ** queue for AI pipeline (async instead of synchronous webhook)
- **Read replicas** for explore queries
- **Elasticsearch** for interviewer search at scale

---

# 📌 Section 9: Interview Q&A (80+ Questions)

## 🟢 Basic Questions (Ye Zaroor Aayenge)

### Q1: What does your project do?
> "IntervueX ek AI-powered mock interview platform hai jahan candidates real engineers se 1:1 practice kar sakte hain. After every call, AI automatically feedback report generate karta hai."

### Q2: What tech stack did you use?
> "Next.js 16 (full-stack), Supabase PostgreSQL with Prisma ORM, Clerk for auth + billing, Stream for HD video calls, Google Gemini for AI feedback, Deepgram for transcription, Arcjet for security, and Resend for emails."

### Q3: Why did you build this?
> "Interview prep ka huge pain point hai. Generic practice enough nahi hoti — real human feedback chahiye. But quality mock interviewers expensive hain. IntervueX isko accessible banata hai."

### Q4: What is Next.js App Router?
> "Next.js 16 ka file-based routing system. `app/` directory me folders = routes. Special files jaise `layout.js`, `page.jsx`, `route.js` hain. Route groups `(auth)`, `(main)` se URL affect nahi hoti but layout alag hota hai."

### Q5: What are Server Actions?
> "`\"use server\"` functions jo directly client components se callable hain. REST API ka modern replacement. No fetch boilerplate, built-in CSRF protection, no CORS setup needed."

### Q6: Server Components vs Client Components?
> "Server Components server pe render hote hain — data fetching, no JS bundle. Client Components client pe — interactivity (hooks, event handlers). Pattern: Server Component data fetch karta hai, props se Client Component ko pass karta hai."

### Q7: What is Prisma?
> "Type-safe ORM. `schema.prisma` file me pura database schema define hai — models, enums, relations. `npx prisma generate` se client auto-generate hota hai. Migrations automatic hain."

---

## 🟡 Architecture Questions

### Q8: Explain your overall architecture.
> "Monolithic Next.js 16 App Router based full-stack app. Server Components for rendering, Server Actions for backend logic, Supabase PostgreSQL via Prisma for data, Clerk for auth, Stream for video, Gemini for AI, Arcjet for security."

### Q9: Why Server Actions instead of REST APIs?
> "Type safety end-to-end, zero fetch boilerplate on client, built-in CSRF protection, no CORS config needed. For a Next.js-only frontend, REST APIs add unnecessary complexity."
>
> **Follow-up: When would REST be better?** → "When you need multiple clients like mobile app or third-party integrations."

### Q10: Why monolith over microservices?
> "Faster development, simpler deployment (one Vercel deploy), easier debugging. Fine for current scale. At 1M users, would decompose into separate video, AI, and billing services."

### Q11: How does your middleware work?
> "`proxy.js` runs Clerk auth middleware to protect routes (/appointments, /explore, /dashboard, /onboarding). Arcjet shield + bot detection runs on all non-webhook routes. Webhook routes excluded because they come from trusted Stream servers."

### Q12: Why PostgreSQL over MongoDB?
> "Data inherently relational hai — Users have Bookings, Bookings have Feedback, Credit Transactions link to both. Financial operations need ACID transactions. PostgreSQL also supports array fields (categories[]) natively."

---

## 🟡 Database Questions

### Q13: Explain your database schema.
> "6 models: User (both roles in one table), Availability (interviewer time windows), Booking (sessions linked to Stream calls), Feedback (AI-generated analysis), CreditTransaction (immutable audit log), Payout (withdrawal requests). 6+ enums for type safety."

### Q14: Why single User model for both roles?
> "Simplicity — no complex joins needed. Role field determines which fields are relevant. Trade-off: some fields null for wrong role."

### Q15: Explain the Prisma singleton pattern.
> "Next.js dev me Hot Module Replacement hoti hai — file save pe module re-execute hota hai. Agar har baar naya PrismaClient bane, to 100s of DB connections leak hon. Singleton pattern `globalThis` pe client cache karta hai — HMR pe reuse hota hai. Production me fresh instance banta hai."

### Q16: Why do you store `creditsCharged` in Booking?
> "Snapshot of cost at booking time. Interviewer baad me creditRate change kar sakta hai. Snapshotting preserves financial accuracy — past bookings original price reflect karein."

### Q17: Explain your database indexing strategy.
> "Compound indexes on common query patterns. Booking: `[status, createdAt]` for recent completed, `[interviewerId, status]` for dashboard, `[intervieweeId, status]` for appointments page. Fast lookups without full table scans."

---

## 🔴 Core Feature Questions (Deep Dive)

### Q18: Walk me through the booking flow end-to-end.
> "7 steps:
> 1. **Auth**: Clerk `currentUser()` verifies logged-in user
> 2. **Rate limit**: Arcjet token-bucket (5/hour per userId)
> 3. **Parallel fetch**: `Promise.all()` for interviewee + interviewer DB records
> 4. **Validation**: Role must be INTERVIEWEE, credits ≥ creditRate
> 5. **Conflict check**: Overlap query prevents double booking
> 6. **Stream call**: Create with auto-recording + auto-transcription (before DB transaction — if Stream fails, no orphan records)
> 7. **DB Transaction**: 4 atomic operations — create booking, credit ledger entry, decrement interviewee credits, increment interviewer creditBalance. All succeed or all rollback."

### Q19: How does the AI feedback pipeline work?
> "Post-call: Stream fires webhook → find booking by streamCallId → Deepgram transcribes recording (seconds) → Gemini analyzes transcript using structured prompt → parse JSON response → DB transaction: upsert feedback + update booking to COMPLETED + create earning transaction."

### Q20: Explain the dual transcription strategy.
> "Stream fires two webhook events. `call.recording_ready` comes first — we send recording URL to Deepgram (fast path, seconds). If Deepgram fails, we wait for `call.transcription_ready` (Stream built-in, 5-15 min). Both paths check if feedback already exists to prevent duplicates."

### Q21: How does the credit system work?
> "3 plans: Free (1/mo), Starter ($29→5/mo), Pro ($69→15/mo). Credits **roll over** — unused credits carry forward. Booking deducts from interviewee, adds to interviewer. Withdrawal: 1 credit = $5, platform takes 20%. All tracked via CreditTransaction ledger."

### Q22: Explain credit allocation and rollover logic.
> "`checkUser()` runs on every page load. Checks 3 conditions: plan changed? never allocated before? new calendar month? If yes, `rolledCredits = planCredits + existingBalance`. `creditsLastAllocatedAt` timestamp prevents double allocation on page refresh."

### Q23: How does the slot generation algorithm work?
> "Takes availability window, maps hours onto target date, generates 45-min slots in a while loop. Each slot checked against existing bookings using overlap formula. Past slots filtered out. Time complexity O(n × m), could use interval tree for O(n log m) at scale."

### Q24: How do you generate AI interview questions?
> "Category-specific prompt to Gemini (e.g., 'Generate 6 FRONTEND questions covering React, JavaScript, CSS...'). Response parsed as JSON. Markdown code fences cleaned with regex before `JSON.parse()`."

---

## 🔴 Security Questions

### Q25: How do you handle rate limiting?
> "Arcjet token-bucket algorithm. Per-userId fingerprinting (not per-IP) so shared WiFi/VPN users aren't unfairly blocked. Booking: 5/hour capacity, 2 refill rate. Withdrawal: 6/hour."

### Q26: How do you prevent unauthorized booking?
> "Multiple layers: Clerk middleware blocks unauthenticated users. Server action checks `currentUser()`. Role validation ensures only INTERVIEWEE can book. Credit check prevents overspending."

### Q27: How do you handle webhook security?
> "Webhook routes excluded from Arcjet (trusted Stream servers). Idempotency checks prevent duplicate processing. Always return 200 to prevent retry storms."

### Q28: Why return 200 on webhook errors?
> "Stream retries failed webhooks. If we return 500 and error was transient, retry creates duplicate feedback. Always 200 prevents retry storms causing duplicate writes."

### Q29: How do you prevent SQL injection?
> "Prisma uses parameterized queries. Never raw SQL. All values auto-escaped by Prisma."

### Q30: How does CSRF protection work?
> "Server Actions have built-in CSRF tokens. Next.js automatically handles this — no manual setup needed."

### Q31: How does authentication work in your app?
> "Clerk handles everything: sign-in/up UI, JWT creation, session cookies (HTTP-only, XSS-safe), token refresh. Middleware protects routes. Server actions verify via `currentUser()` or `auth()`."

---

## 🔴 Performance Questions

### Q32: How do you optimize database queries?
> "Three strategies: (1) `select` instead of `include *` — fetch only needed fields, 50-70% less data. (2) Compound indexes on common query patterns. (3) Parallel fetching with `Promise.all()` for independent queries."

### Q33: Explain the parallel data fetching pattern.
> "Dashboard page loads 4 independent datasets: availability, appointments, stats, withdrawal history. Instead of sequential (4 × latency), we use `Promise.all()` (max latency) — 4x faster."

### Q34: Why Prisma singleton pattern?
> "Next.js dev HMR creates new module on every save. Without singleton, 100s of Prisma clients and DB connections pile up → pool overflow. `globalThis` cache ensures one client reused across HMR cycles."

### Q35: How would you scale to 100K users?
> "Add Redis caching for hot data (cache-aside pattern), database read replicas for explore queries, BullMQ queue for async AI pipeline instead of synchronous webhook, Elasticsearch for interviewer search. Vercel already auto-scales serverless functions."

### Q36: What's the most expensive operation?
> "AI feedback generation — Deepgram transcription + Gemini analysis. At scale, would move to queue-based processing (BullMQ) so webhook returns immediately and workers process async."

---

## 🔴 Code-Level Questions

### Q37: What is `revalidatePath()` and why do you use it?
> "Next.js cache invalidation function. After mutations (booking, withdrawal), cached data is stale. `revalidatePath('/dashboard')` tells Next.js to re-fetch that page's data on next request."

### Q38: What does `\"use server\"` do?
> "Marks a function as a Server Action — runs only on server. Can be called from client components but executes server-side. Has access to DB, env secrets, etc. Never exposed to browser bundle."

### Q39: What does `\"use client\"` do?
> "Marks a component as Client Component — runs in browser. Needed for React hooks (useState, useEffect), event handlers, browser APIs. Creates client-server boundary."

### Q40: How does the `useFetch` custom hook work?
> "Generic async state manager. Wraps any server action with loading/error/data states + toast notifications. Returns `{ data, loading, error, fn, setData }`. Eliminates boilerplate — every server action call needs these states."

### Q41: What is `cn()` utility?
> "Combines `clsx` + `tailwind-merge`. `clsx` conditionally joins class names, `tailwind-merge` resolves Tailwind class conflicts (e.g., `p-2 p-4` → `p-4`)."

### Q42: Why `suppressHydrationWarning` on body tag?
> "Theme switching (dark/light) adds class to body before React hydrates. Without suppression, React warns about server/client mismatch."

### Q43: How does `PrismaPg` adapter work?
> "Prisma normally uses its own query engine binary. `PrismaPg` adapter uses native `pg` (node-postgres) driver instead — better for serverless/edge runtimes where binary execution might be restricted."

### Q44: What is token-bucket algorithm?
> "Rate limiting pattern. Bucket has capacity (max burst). Tokens refill at fixed rate. Each request consumes 1 token. If empty → denied. Allows legitimate bursts while blocking sustained abuse."

---

## 🔴 Design Decision Questions

### Q45: Why Server Actions over REST API?
> "Less boilerplate, type-safe, built-in CSRF, no CORS. For Next.js-only frontend, REST adds unnecessary complexity. Would switch to REST for mobile app or third-party integrations."

### Q46: Why Deepgram added alongside Stream transcription?
> "Stream built-in transcription took 5-15 minutes → feedback too slow. Deepgram does it in seconds. Added as fast path with Stream as fallback."

### Q47: Why credit rollover instead of expiry?
> "User-friendly, reduces churn. If credits expired monthly, users would feel forced to use them, leading to bad experience. Rollover builds trust and retention."

### Q48: Why 20% platform fee?
> "Industry standard for marketplace platforms (Uber, Fiverr, Upwork all take 15-25%). Balances platform sustainability with fair interviewer compensation."

### Q49: Why password-based admin auth for payouts?
> "Simple MVP approach. In production, would replace with role-based admin dashboard using Clerk admin roles."

---

## 🔴 Challenges Faced (Interviewers Love This!)

### Q50: What was the hardest challenge?
> "AI feedback pipeline — getting reliable transcription from recorded calls, handling webhook failures gracefully, parsing AI output (Gemini sometimes wraps JSON in markdown fences), and ensuring idempotency to prevent duplicate feedback from repeated webhooks."

### Q51: How did you solve the Stream transcription delay?
> "Built-in transcription took 5-15 min. Added Deepgram as fast path triggered on `call.recording_ready` webhook. Deepgram transcribes in seconds. Stream transcription kept as fallback."

### Q52: How did you handle webhook reliability?
> "Three strategies: (1) Idempotency checks — `booking.feedback` existence before generating. (2) Always return 200 to prevent retry storms. (3) Backfill script for missed webhooks."

### Q53: How did you prevent credit double-allocation?
> "Page refreshes could trigger re-allocation. Added `creditsLastAllocatedAt` timestamp. `shouldAllocateCredits()` checks if plan changed, never allocated, or new month — only then allocates."

### Q54: How did you handle Gemini JSON parsing issues?
> "Gemini sometimes wraps output in markdown code fences (` ```json ... ``` `). Regex cleanup: `.replace(/^```json|^```|```$/gm, \"\")` before `JSON.parse()`."

---

## 🔴 Component & Frontend Questions

### Q55: Explain Server Component → Client Component handoff pattern.
> "Server component fetches data (no loading states, no waterfalls), then passes data as props to Client component for interactivity. Example: Dashboard page (server) fetches availability, appointments, stats with `Promise.all()`, passes to EarningsSection (client) for tabs/forms."

### Q56: How does state management work without Redux?
> "Server Components handle most data fetching. `useState` for local UI state (modals, filters). `useMemo` for derived data (filtered list). Props drilling kept shallow (max 2 levels). No global state needed."

### Q57: How does RoleRedirect work?
> "Client component with `useEffect` on pathname change. Checks user role against allowed routes. Wrong role → `router.replace()` to correct page. INTERVIEWEE → /explore, INTERVIEWER → /dashboard, UNASSIGNED → /onboarding."

### Q58: How does AppointmentCard handle both roles?
> "`mode` prop ('interviewer' | 'interviewee') determines which participant's info to show and which actions to display. One component, two modes — DRY principle."

---

## 🔴 Deployment & DevOps Questions

### Q59: How do you deploy this?
> "Push to GitHub → Vercel auto-deploys. Environment variables in Vercel dashboard. Build command: `npm run build`. Post-deployment: configure Stream webhook URL, enable webhook events."

### Q60: What is `postinstall` script in package.json?
> "`prisma generate` — runs after `npm install`. Generates Prisma client from schema. Ensures client is always up-to-date with schema on every install."

### Q61: What environment variables does your app need?
> "DATABASE_URL (Supabase), CLERK keys, STREAM API key + secret, GEMINI_API_KEY, DEEPGRAM_API_KEY, ARCJET_KEY, RESEND_API_KEY, NEXT_PUBLIC_APP_URL."

---

## 🔴 Advanced / Cross Questions

### Q62: What if two users try to book the same slot simultaneously?
> "Conflict detection query runs before booking. But race condition possible between check and insert. `db.$transaction()` provides some isolation. For bulletproof: would add a unique constraint or use SELECT FOR UPDATE (pessimistic locking)."

### Q63: What if Gemini gives wrong/bad feedback?
> "It's AI guidance, not a final verdict. Can regenerate feedback via backfill script. Adding human override capability in future."

### Q64: Why JWT over sessions?
> "Clerk uses JWT internally. Stateless — no server-side session store needed (no Redis). HTTP-only cookies prevent XSS. Short-lived tokens with auto-refresh."

### Q65: What if Deepgram is down?
> "Falls back to Stream's built-in transcription. Dual transcription strategy ensures at least one path produces feedback."

### Q66: Why no unit tests?
> "MVP stage — focused on feature completeness. Would add Jest for server actions and React Testing Library for components next. Have backfill and seed scripts for manual validation."

### Q67: How do you handle timezone issues?
> "Store everything as UTC in database. Display local via date-fns formatting. Availability stores full ISO timestamps but only hours/minutes matter — `set()` from date-fns applies them to target date."

### Q68: What is connection pooling and why is it needed?
> "Supabase provides connection pooling via port 6543. Multiple serverless function invocations share a pool of DB connections instead of each creating new ones. Prevents 'too many connections' errors at scale."

---

## 🟢 HR Questions (Easy Answers)

### Q69: Tell me about yourself.
> "Hi, I'm Prince. I'm a full-stack developer passionate about building products that solve real problems. I recently built IntervueX, an AI-powered mock interview platform where candidates practice with real engineers and get AI-generated feedback. I enjoy working with modern tech — Next.js, PostgreSQL, AI APIs."

### Q70: What was your role in this project?
> "Solo developer — I designed the architecture, implemented all features, integrated 6+ external APIs, and handled deployment. From database schema to AI pipeline to video integration — everything."

### Q71: What did you learn from this project?
> "Production-grade SaaS development: financial transaction safety, webhook handling, AI integration, rate limiting, database design for marketplace economies, and the importance of idempotency in distributed systems."

### Q72: What would you improve?
> "Add automated tests (Jest + Playwright), implement CI/CD pipeline, integrate Stripe for real payments, build admin dashboard with analytics, add mobile responsiveness testing."

### Q73: How do you handle deadlines/pressure?
> "I break tasks into small, testable chunks. For IntervueX, I built core booking flow first, then added AI pipeline, then security. Each feature was independent and testable."

### Q74: Why should we hire you?
> "I can build production-grade applications end-to-end. IntervueX demonstrates my ability to integrate complex systems (video, AI, auth, payments), design scalable architectures, and handle real-world challenges like webhook reliability and financial integrity."

---

## 🟢 STAR Method Answers

### Project Introduction (STAR)
- **S**: Engineers struggle with interview prep — no affordable platform for 1:1 practice
- **T**: Build full-stack platform connecting candidates with expert interviewers, with AI feedback
- **A**: Designed credit-based marketplace with Next.js 16, integrated Stream video, Gemini AI pipeline, Clerk auth, Arcjet security
- **R**: Working platform with HD video calls, AI feedback reports, credit economy, and admin payout system

### Technical Challenge (STAR)
- **S**: Stream's built-in transcription took 5-15 minutes
- **T**: Get transcription fast enough for near-instant feedback
- **A**: Integrated Deepgram as fast path triggered on `call.recording_ready` webhook, with Stream as fallback
- **R**: Feedback generation went from 15 minutes to under 30 seconds

---

# 📌 Section 10: Last-Minute Cheat Sheet (Print Kar Le!)

## Page 1: Architecture & Tech

```
ARCHITECTURE: Next.js 16 (monolith) → Supabase PostgreSQL (Prisma) → External APIs

AUTH:     Clerk (JWT cookies) → middleware → server actions
SECURITY: Arcjet (shield + bot detect + rate limit per userId)
VIDEO:    Stream SDK (HD, recording, transcription, screen share)
AI:       Gemini 2.5 flash-lite (feedback + questions) + Deepgram (fast STT)
EMAIL:    Resend + React Email
STYLING:  Tailwind 4 + shadcn/ui + Motion animations

DATABASE: 6 Models, 6+ Enums
  User, Availability, Booking, Feedback, CreditTransaction, Payout

CREDIT SYSTEM:
  Free: 1/mo | Starter: $29 → 5/mo | Pro: $69 → 15/mo | Rollover ✓
  Booking: deduct from interviewee, add to interviewer
  Withdrawal: 20% platform fee, 1 credit = $5

BOOKING FLOW (7 steps):
  Auth → Rate Limit → Parallel Fetch → Validate → Conflict Check
  → Stream Call → DB Transaction (4 atomic ops)

AI PIPELINE:
  Recording → Deepgram STT (seconds) → Gemini Analysis → JSON → DB
  Fallback: Stream Transcription (5-15 min) → Gemini → DB
```

## Page 2: Key Patterns & Files

```
PATTERNS:
  • Server Component → Client Component handoff (data on server, interactivity on client)
  • useFetch hook (loading/error/data + toast)
  • Prisma singleton (globalThis cache in dev)
  • DB transactions (atomic multi-write)
  • Dual transcription (Deepgram fast + Stream fallback)
  • Rate limiting (token-bucket per userId, not IP)
  • Idempotency (check before write, always 200 on webhook)

KEY FILES:
  1. booking.js — Core business logic (booking + credits + Stream)
  2. feedbackPipeline.js — AI pipeline (Deepgram + Gemini + DB)
  3. schema.prisma — Database design (6 models, 6 enums)
  4. proxy.js — Security middleware (Clerk + Arcjet)
  5. webhook/route.js — Post-call automation (recording → feedback)

SECURITY:
  Clerk auth + Arcjet bot/rate + Server validation + Prisma parameterized

PERFORMANCE:
  Parallel fetch + selective select + useMemo + singleton DB + revalidatePath

SCALING:
  Connection pooling → Read replicas → Redis cache → Queue AI → Microservices
```

## Page 3: Quick-Fire Answers

| If They Ask... | Say This |
|----------------|----------|
| "What does it do?" | AI mock interview platform — candidates practice with real engineers, get AI feedback |
| "Tech stack?" | Next.js 16, Supabase PostgreSQL, Prisma, Clerk, Stream, Gemini, Deepgram, Arcjet |
| "Why Next.js?" | Full-stack, Server Components, Server Actions, no separate backend |
| "Why PostgreSQL?" | Relational data, ACID transactions, array fields |
| "How does AI work?" | Deepgram transcribes → Gemini analyzes → structured JSON feedback |
| "How is it secure?" | Clerk auth + Arcjet rate limiting + Server validation + Prisma parameterized queries |
| "Hardest part?" | AI feedback pipeline — webhook reliability, transcription speed, idempotency |
| "How does booking work?" | Auth → Rate limit → Validate → Stream call → DB Transaction (4 atomic ops) |
| "Why no REST API?" | Server Actions — less boilerplate, type-safe, built-in CSRF, no CORS |
| "How would you scale?" | Redis cache, read replicas, queue-based AI, microservices at 1M users |
| "Why singleton Prisma?" | Dev HMR creates new clients → connection leak. globalThis cache prevents this |
| "What's unique?" | Dual transcription strategy + credit-based marketplace + AI feedback pipeline |

---

> **🎯 Bhai, ye guide padh le ache se — har section important hai. Elevator pitch 2-3 baar bolo zor se. Architecture diagram yaad karo. Top 5 files ka flow dimaag me rakh lo. Confidence rakh — tu karr lega! 💪🔥**

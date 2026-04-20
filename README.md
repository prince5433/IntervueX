<p align="center">
  <img src="public/logo.png" alt="IntervueX Logo" width="80" />
</p>

<h1 align="center">IntervueX — AI-Powered Mock Interview Platform</h1>

<p align="center">
  Book 1:1 mock interviews with senior engineers from top companies.<br/>
  Get AI-powered feedback, role-specific questions, and the confidence to land your dream job.
</p>

<p align="center">
  <a href="#-features"><strong>Features</strong></a> ·
  <a href="#%EF%B8%8F-tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#-getting-started"><strong>Getting Started</strong></a> ·
  <a href="#-project-structure"><strong>Structure</strong></a> ·
  <a href="#-environment-variables"><strong>Env Variables</strong></a> ·
  <a href="#-database-schema"><strong>Database</strong></a>
</p>

---

## ✨ Features

### For Interviewees
- **Browse Expert Interviewers** — Filter by category (Frontend, Backend, System Design, DSA, DevOps, Mobile, Behavioral, Full Stack) and experience level
- **Slot-based Booking** — Pick from an interviewer's available time slots and book with one click using credits
- **HD Video Calls** — 1080p video calls with screen sharing, powered by Stream
- **AI Feedback Reports** — After each session, Google Gemini analyzes the full transcript and generates a detailed performance report covering technical depth, communication, problem-solving, strengths, and areas to improve
- **Session Recordings** — Automatic recording with playback links for later review
- **Credit-based Plans** — Free (1 credit/mo), Starter ($29 — 5 credits/mo), Pro ($69 — 15 credits/mo) with rollover

### For Interviewers
- **Set Your Availability** — Define your available hours and let the platform handle scheduling
- **AI Question Generator** — Get role-specific interview questions generated on-demand by Gemini, tailored to Frontend, Backend, System Design, DSA, DevOps, Mobile, Behavioral, or Full Stack categories
- **Earn Credits** — Receive credits for each completed session
- **Withdraw Earnings** — Request payouts from your dashboard; admin reviews and approves via email notification
- **Interviewer Dashboard** — View appointments, manage availability, track credit balance, and monitor earnings

### Platform-wide
- **Authentication** — Clerk-powered auth with sign-in/sign-up flows, subscription plans, and user sync
- **Bot Protection & Rate Limiting** — Arcjet shields all routes with bot detection and token-bucket rate limiters
- **Transactional Emails** — React Email templates sent via Resend for withdrawal requests and admin notifications
- **Dark Theme** — Premium dark UI with amber/gold accent colors, glassmorphism, and micro-animations
- **Responsive Design** — Fully responsive across desktop, tablet, and mobile

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) | Full-stack React framework with server components & server actions |
| **Authentication** | [Clerk](https://clerk.com/) | Auth, user management, subscription plans (Checkout) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) | Hosted PostgreSQL database |
| **ORM** | [Prisma 7](https://www.prisma.io/) | Type-safe database client with migrations |
| **Video & Chat** | [Stream](https://getstream.io/) | HD video calls, recordings, transcription, and chat |
| **AI** | [Google Gemini](https://ai.google.dev/) (`gemini-2.5-flash-lite`) | AI feedback generation & interview question generation |
| **Security** | [Arcjet](https://arcjet.com/) | Bot protection, shield, and per-user rate limiting |
| **Email** | [Resend](https://resend.com/) + [React Email](https://react.email/) | Transactional email delivery |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | Utility-first CSS with pre-built accessible components |
| **Animations** | [Motion](https://motion.dev/) | Smooth page transitions and micro-animations |
| **Deployment** | [Vercel](https://vercel.com/) | Recommended hosting platform |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- Accounts on: [Clerk](https://clerk.com/), [Supabase](https://supabase.com/), [Stream](https://getstream.io/), [Google AI Studio](https://aistudio.google.com/), [Arcjet](https://arcjet.com/), [Resend](https://resend.com/)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ai-interview-platform.git
cd ai-interview-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root (or use the provided template) and fill in your keys:

```env
# ─── DATABASE (Supabase PostgreSQL) ─────────────────────────
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# ─── CLERK (Authentication) ─────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# ─── STREAM (Video Calling & Chat) ──────────────────────────
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_SECRET_KEY=your_stream_secret

# ─── GOOGLE GEMINI (AI Feedback & Questions) ────────────────
GEMINI_API_KEY=your_gemini_api_key

# ─── DEEPGRAM (Post-call transcription, faster than Stream) ─
DEEPGRAM_API_KEY=your_deepgram_api_key

# ─── ARCJET (Rate Limiting & Bot Protection) ────────────────
ARCJET_KEY=ajkey_...

# ─── RESEND (Transactional Emails) ──────────────────────────
RESEND_API_KEY=re_...

# ─── APP CONFIG ─────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── ADMIN ──────────────────────────────────────────────────
ADMIN_PAYOUT_PASSWORD=your_secure_admin_password
```

> See the [Environment Variables](#-environment-variables) section for details on where to get each key.

### 4. Set up the database

```bash
# Generate the Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database with sample data
npx prisma db seed
```

### 5. Rename the middleware file

Next.js requires the middleware to be named `middleware.js` at the project root:

```bash
mv proxy.js middleware.js
```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Configure Stream Webhook (Required for AI Feedback)

After deploying (or using a tunnel like [ngrok](https://ngrok.com/) for local development):

1. Go to your [Stream Dashboard](https://dashboard.getstream.io/)
2. Navigate to your app → **Webhooks**
3. Add a webhook URL: `https://your-domain.com/api/webhooks/stream`
4. Enable these events:
   - `call.transcription_ready` — triggers AI feedback generation
   - `call.recording_ready` — saves recording URL to the booking

---

## 📁 Project Structure

```
ai-interview-platform/
│
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth group layout
│   │   ├── sign-in/                  # Clerk sign-in page
│   │   └── sign-up/                  # Clerk sign-up page
│   ├── (main)/                       # Protected routes group layout
│   │   ├── appointments/             # User's booked interviews
│   │   ├── call/[callId]/            # Stream video call room
│   │   ├── dashboard/                # Interviewer dashboard
│   │   ├── explore/                  # Browse & filter interviewers
│   │   ├── interviewers/[id]/        # Interviewer profile + slot booking
│   │   ├── onboarding/               # Role selection (Interviewee / Interviewer)
│   │   └── payout/[id]/              # Admin payout approval page
│   ├── api/
│   │   └── webhooks/stream/route.js  # Stream webhook handler
│   ├── globals.css                   # Global styles & Tailwind config
│   ├── layout.js                     # Root layout (Clerk, theme, fonts)
│   └── page.jsx                      # Landing page
│
├── actions/                          # Server Actions
│   ├── aiQuestions.jsx               # AI question generation (Gemini)
│   ├── booking.js                    # Slot booking + Stream call creation
│   ├── call.js                       # Call data retrieval + Stream token
│   ├── dashboard.js                  # Availability, appointments, withdrawals
│   ├── explore.js                    # Interviewer listing & search
│   ├── onboarding.js                 # User role setup
│   ├── payout.js                     # Admin payout approval
│   └── user.js                       # User-related actions
│
├── components/                       # React components
│   ├── ui/                           # shadcn/ui primitives (Button, Badge, Dialog, etc.)
│   ├── animate-ui/                   # Animation components
│   ├── AppointmentCard.jsx           # Appointment display card
│   ├── CreditButton.jsx              # Credit purchase button
│   ├── FeedbackModal.jsx             # AI feedback report modal
│   ├── PricingSection.jsx            # Pricing plans with Clerk checkout
│   ├── RoleRedirect.jsx              # Role-based redirect logic
│   ├── UpgradeModal.jsx              # Plan upgrade prompt
│   ├── header.jsx                    # Site header / navbar
│   ├── reusables.jsx                 # Reusable styled text components
│   └── theme-provider.jsx            # Dark/light theme context
│
├── emails/
│   └── WithdrawalRequestEmail.jsx    # React Email template for payout requests
│
├── hooks/
│   ├── use-controlled-state.jsx      # Controlled state hook
│   ├── use-fetch.js                  # Data fetching hook
│   └── use-is-in-view.jsx            # Intersection observer hook
│
├── lib/
│   ├── arcjet.js                     # Arcjet rate limiter factory
│   ├── checkUser.js                  # Clerk→DB user sync + credit allocation
│   ├── data.js                       # Static data, plans, categories, constants
│   ├── helpers.js                    # Date formatting & slot generation utilities
│   ├── prisma.js                     # Prisma client singleton (with pg adapter)
│   └── utils.js                      # General utilities (cn helper)
│
├── prisma/
│   ├── schema.prisma                 # Database schema
│   ├── migrations/                   # Migration files
│   └── seed.js                       # Database seeder
│
├── public/                           # Static assets (logos, images)
├── proxy.js                          # Middleware (⚠️ rename to middleware.js)
├── prisma.config.ts                  # Prisma config (DIRECT_URL for migrations)
├── next.config.mjs                   # Next.js configuration
├── package.json                      # Dependencies & scripts
└── .env                              # Environment variables (git-ignored)
```

---

## 🔑 Environment Variables

| Variable | Required | Where to Get It |
|---|---|---|
| `DATABASE_URL` | ✅ | **Supabase** → Project Settings → Database → Connection string → Use **Session pooler** mode (port `6543`) |
| `DIRECT_URL` | ✅ | **Supabase** → Same page → **Direct connection** (port `5432`) — used only for Prisma migrations |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | **Clerk** → Dashboard → [API Keys](https://dashboard.clerk.com/) → Publishable key |
| `CLERK_SECRET_KEY` | ✅ | **Clerk** → Same page → Secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | ✅ | Set to `/sign-in` (matches your auth route) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | ✅ | Set to `/sign-up` (matches your auth route) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | ✅ | Set to `/` (or any post-login redirect) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | ✅ | Set to `/` (or any post-signup redirect) |
| `NEXT_PUBLIC_STREAM_API_KEY` | ✅ | **Stream** → [Dashboard](https://dashboard.getstream.io/) → Your App → API Key |
| `STREAM_SECRET_KEY` | ✅ | **Stream** → Same page → Secret |
| `GEMINI_API_KEY` | ✅ | **Google AI Studio** → [Create API Key](https://aistudio.google.com/apikey) |
| `DEEPGRAM_API_KEY` | ✅ | **Deepgram** → [Console](https://console.deepgram.com/) → API Keys → Create |
| `ARCJET_KEY` | ✅ | **Arcjet** → [Dashboard](https://app.arcjet.com/) → Site → Settings → API Key |
| `RESEND_API_KEY` | ✅ | **Resend** → [Dashboard](https://resend.com/api-keys) → API Keys → Create |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your deployed URL (use `http://localhost:3000` for local dev) |
| `ADMIN_PAYOUT_PASSWORD` | ✅ | Choose any strong password — used to authorize payout approvals |

---

## 🗄️ Database Schema

The database is powered by **Supabase PostgreSQL** and managed with **Prisma 7**. Here's an overview of the data models:

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      User       │     │   Availability   │     │     Booking      │
├─────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id              │◄────│ interviewerId    │     │ id               │
│ clerkUserId     │     │ startTime        │     │ intervieweeId    │
│ email           │     │ endTime          │     │ interviewerId    │
│ name            │     │ status           │     │ startTime        │
│ role            │     └──────────────────┘     │ endTime          │
│ credits         │                              │ status           │
│ currentPlan     │◄─────────────────────────────│ creditsCharged   │
│ bio             │                              │ streamCallId     │
│ title           │                              │ recordingUrl     │
│ company         │                              └────────┬─────────┘
│ categories[]    │                                       │
│ creditBalance   │                                       │
│ creditRate      │     ┌──────────────────┐              │
└────────┬────────┘     │    Feedback      │              │
         │              ├──────────────────┤              │
         │              │ bookingId ◄──────┼──────────────┘
         │              │ summary          │
         │              │ technical        │
         │              │ communication    │
         │              │ problemSolving   │
         │              │ recommendation   │
         │              │ strengths[]      │
         │              │ improvements[]   │
         │              │ overallRating    │
         │              └──────────────────┘
         │
         │         ┌───────────────────────┐
         │         │  CreditTransaction    │
         │         ├───────────────────────┤
         └────────►│ userId               │
                   │ amount               │
                   │ type                 │
                   │ bookingId            │
                   └───────────────────────┘

         ┌──────────────────┐
         │     Payout       │
         ├──────────────────┤
         │ interviewerId    │
         │ credits          │
         │ platformFee      │
         │ netAmount        │
         │ paymentMethod    │
         │ status           │
         └──────────────────┘
```

### Key Enums

| Enum | Values |
|---|---|
| `UserRole` | `UNASSIGNED`, `INTERVIEWEE`, `INTERVIEWER` |
| `BookingStatus` | `SCHEDULED`, `COMPLETED`, `CANCELLED` |
| `InterviewCategory` | `FRONTEND`, `BACKEND`, `FULLSTACK`, `DSA`, `SYSTEM_DESIGN`, `BEHAVIORAL`, `DEVOPS`, `MOBILE` |
| `FeedbackRating` | `POOR`, `AVERAGE`, `GOOD`, `EXCELLENT` |
| `TransactionType` | `CREDIT_PURCHASE`, `BOOKING_DEDUCTION`, `BOOKING_EARNING`, `ADMIN_ADJUSTMENT` |
| `PayoutStatus` | `PROCESSING`, `PROCESSED` |

---

## 🔄 How It Works

### Interview Flow

```
1. Interviewee browses interviewers on /explore
2. Picks an interviewer → views profile & availability on /interviewers/[id]
3. Selects a time slot → credits are deducted → Stream call is created
4. Both parties join the HD video call on /call/[callId]
5. During the call:
   - Interviewer can generate AI questions via the question generator
   - Stream auto-records and transcribes the session
6. After the call ends:
   - Stream fires a webhook (call.transcription_ready)
   - The webhook handler downloads the transcript
   - Google Gemini analyzes it and generates a detailed feedback report
   - Feedback is saved to the database
   - Booking status → COMPLETED
   - Interviewer receives credit earnings
7. Interviewee views their AI feedback report on /appointments
```

### Credit System

| Plan | Price | Credits/Month | Features |
|---|---|---|---|
| **Free** | $0 | 1 | 1 session, HD video, chat |
| **Starter** | $29 | 5 | AI feedback, recording, credits roll over |
| **Pro** | $69 | 15 | Everything in Starter + priority features |

- **1 credit = 1 interview session**
- Unused credits **roll over** to the next month
- Interviewers earn credits per session and can **withdraw** anytime (20% platform fee)

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma migrate dev` | Run database migrations |
| `npx prisma db seed` | Seed the database |
| `npx prisma studio` | Open Prisma Studio (visual DB browser) |

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository on [Vercel](https://vercel.com/)
3. Add all environment variables in the Vercel dashboard
4. Set the **build command** to `npm run build`
5. Set the **output directory** to `.next`
6. Deploy!

> **Important:** After deployment, update `NEXT_PUBLIC_APP_URL` to your production URL and configure the Stream webhook endpoint.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is built by **Prince**. Inspired by the [RoadsideCoder](https://youtu.be/f0msp-QQUqw) tutorial.

---

<p align="center">
  Made with ❤️ by <strong>IntervueX</strong>
</p>

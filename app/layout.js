/*
 * ─────────────────────────────────────────────────────────────────────────────
 * FILE: app/layout.js
 * ROLE: Root Layout — Next.js ka topmost wrapper jo EVERY page ke around wrap
 *       hota hai. Yahan global providers, fonts, header aur footer define hote hain.
 *
 * KEY RESPONSIBILITIES:
 *   1. ClerkProvider  → puri app ko auth context deta hai (login state, sessions)
 *   2. ThemeProvider  → dark/light mode toggle manage karta hai CSS class se
 *   3. Google Fonts   → Lora (serif headings) + DM Sans (body text) load karta hai
 *   4. Header         → har route pe same navigation bar dikhata hai
 *   5. Toaster        → toast notifications globally register karta hai
 *   6. Footer         → simple branding footer har page ke neeche
 *
 * TRIGGER: Har route render se pehle Next.js automatically yeh layout mount karta hai.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ThemeProvider: class-based dark/light mode system (next-themes library)
import { ThemeProvider } from "@/components/theme-provider";

// Global CSS: Tailwind base styles + custom CSS variables load karta hai
import "./globals.css";

// Header: top navigation bar — har page pe same component
import Header from "@/components/header";

// Google Fonts: Next.js ka built-in font system — zero layout shift, self-hosted
import { DM_Sans, Lora } from "next/font/google";

// ClerkProvider: Clerk authentication ka React context provider —
// is wrapper ke bina SignedIn/SignedOut/useUser hooks kaam nahi karenge
import { ClerkProvider } from "@clerk/nextjs";

// dark: Clerk ke built-in dark visual preset theme object
import { dark } from "@clerk/themes";

// Toaster: Sonner library ka global toast notification component —
// ek baar yahan mount karo, kahin bhi toast() call karo
import { Toaster } from "sonner";

// ── FONT CONFIGURATION ────────────────────────────────────────────────────────

// Lora: elegant serif font — headings aur brand text ke liye
// subsets: ["latin"] → sirf latin characters download honge (bundle size optimize)
// weight: 400 (regular) aur 500 (medium)
// style: normal aur italic — italic hero headings ke liye
// variable: CSS custom property name jisse font reference hoga in CSS/Tailwind
const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif", // usage: font-serif class ya var(--font-serif) in CSS
});

// DM Sans: clean sans-serif font — body text, buttons, labels ke liye
// weight: 300 (light) → 600 (semibold) — multiple weights for hierarchy
// variable: CSS custom property for body/sans usage
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans", // usage: font-sans class ya var(--font-sans) in CSS
});

// ── METADATA ─────────────────────────────────────────────────────────────────
// Next.js metadata API: browser tab title aur meta description set karta hai.
// Yeh global default hai; individual pages apna metadata override kar sakte hain.
export const metadata = {
  title: "IntervueX",          // browser tab aur SEO title
  description: "",             // TODO: add SEO description for better search ranking
};

// ── ROOT LAYOUT COMPONENT ─────────────────────────────────────────────────────
// children = currently active route ka page component (e.g. LandingPage, DashboardPage)
// Next.js automatically children inject karta hai based on current URL
export default function RootLayout({ children }) {
  return (
    // ClerkProvider: OUTERMOST wrapper — yeh pura app tree auth se wrap hona chahiye
    // appearance.theme = dark → Clerk ke sign-in modals ko dark styling milegi
    <ClerkProvider
      appearance={{
        theme: dark, // Clerk widgets (SignIn modal, UserButton) dark theme use karenge
      }}
    >
      {/* html tag: lang="en" screen readers ke liye, suppressHydrationWarning = ThemeProvider
          dark/light class add karta hai jo SSR se differ ho sakta hai — warning suppress karte hain */}
      <html lang="en" suppressHydrationWarning>
        {/* head: Next.js yahan automatically meta tags, font preloads inject karta hai */}
        <head />

        {/* body: dono font CSS variables yahan className se inject hote hain
            font-sans = DM Sans as default body font (Tailwind utility) */}
        <body className={`${lora.variable} ${dmSans.variable} font-sans`}>

          {/* ThemeProvider: next-themes library — CSS class "dark"/"light" body pe toggle karta hai
              attribute="class" → class-based switching (not data attribute)
              defaultTheme="system" → OS preference follow karta hai initially
              enableSystem → OS dark/light mode detect karna ON
              disableTransitionOnChange → theme switch pe flash prevent karta hai */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Header: global navigation bar — har route pe dikhega
                async server component hai — checkUser() call karta hai inside */}
            <Header />

            {/* main: actual page content yahan render hota hai
                min-h-screen ensures footer neeche hi rahe even on short pages */}
            <main className="min-h-screen">{children}</main>

            {/* Toaster: Sonner toast library ka container — richColors = color-coded toasts
                (green for success, red for error, yellow for warning) */}
            <Toaster richColors />

            {/* Footer: simple branding footer — globally rendered under every page
                border-t → subtle top divider line
                backdrop via parent black bg se natural dark feel milta hai */}
            <footer className="relative z-10 border-t border-white/7 py-12  mx-auto px-6 flex flex-wrap items-center justify-center text-stone-400">
              Made with ❤️ by Prince
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

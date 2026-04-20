/*
 * File Overview:
 * Use Case: Pure application shell define karta hai: Clerk auth provider, theme provider, global header/footer, fonts aur toast layer.
 * Project Role: Yeh root composition file app ki global UX consistency maintain karti hai.
 * Typical Trigger: Har route render se pehle root layout mount hota hai.
 * File Path: app/layout.js
 */
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import Header from "@/components/header";
import { DM_Sans, Lora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";

// Note: serif heading font setup (brand tone ke liye).
const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

// Note: sans body font setup (readability ke liye).
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
});

// Note: metadata SEO/title bar ke liye global level par set hota hai.
export const metadata = {
  title: "IntervueX",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    // Note: ClerkProvider pura app ko auth context deta hai.
    <ClerkProvider
      appearance={{
        // Note: Clerk widgets ko dark visual theme dena.
        theme: dark,
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head />
        <body className={`${lora.variable} ${dmSans.variable} font-sans`}>
          {/* Note: ThemeProvider class-based dark/light handling karta hai. */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Note: Header har route pe common rahega. */}
            <Header />
            {/* Note: actual route page content yahan render hota hai. */}
            <main className="min-h-screen">{children}</main>
            {/* Note: toast notifications globally enable. */}
            <Toaster richColors />

            {/* Note: simple global footer branding. */}
            <footer className="relative z-10 border-t border-white/7 py-12  mx-auto px-6 flex flex-wrap items-center justify-center text-stone-400">
              Made with ❤️ by Prince
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

/*
 * File Overview:
 * Use Case: Global nav bar with auth-aware links and role-dependent actions.
 * Project Role: Top-level navigation + quick actions ka central component hai.
 * Trigger: Root layout ke through har page par render hota hai.
 * File Path: components/header.jsx
 */
import { checkUser } from "@/lib/checkUser";
import { Button } from "./ui/button";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import RoleRedirect from "./RoleRedirect";
import CreditButton from "./CreditButton";
import { CalendarDays, Users } from "lucide-react";

const Header = async () => {
  const user = await checkUser();
  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-3 sm:px-10 py-3 border-b border-white/7 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-1.5 shrink-0">
        {/* Inline SVG logo — person + briefcase + chat bubble */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Person head */}
          <circle cx="22" cy="14" r="7" fill="#F5A623" />
          {/* Person body */}
          <path
            d="M22 24c-8 0-14 4-14 10v2h28v-2c0-6-6-10-14-10z"
            fill="#F5A623"
          />
          {/* Briefcase */}
          <rect x="6" y="38" width="16" height="12" rx="2" fill="#F5A623" />
          <rect x="11" y="35" width="6" height="5" rx="1" fill="#F5A623" />
          {/* Chat bubble */}
          <rect x="34" y="4" width="26" height="18" rx="4" fill="#F5A623" />
          <polygon points="40,22 44,28 48,22" fill="#F5A623" />
          {/* Chat dots */}
          <circle cx="42" cy="13" r="2.2" fill="#0a0a0b" />
          <circle cx="47" cy="13" r="2.2" fill="#0a0a0b" />
          <circle cx="52" cy="13" r="2.2" fill="#0a0a0b" />
        </svg>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Intervue<span className="text-amber-400">X</span>
        </span>
      </Link>

      {user && <RoleRedirect role={user.role} />}

      <div className="flex items-center gap-3">
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="ghost">Sign in</Button>
          </SignInButton>
          <SignInButton mode="modal">
            <Button variant="gold">Get started →</Button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          {user?.role === "INTERVIEWER" && (
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          )}

          {user?.role === "INTERVIEWEE" && (
            <>
              <Button variant="ghost" asChild>
                <Link href="/explore">
                  <Users size={16} />
                  <span className="hidden md:inline">Explore</span>
                </Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/appointments">
                  <CalendarDays size={16} />
                  <span className="hidden md:inline">My Appointments</span>
                </Link>
              </Button>
            </>
          )}

          <CreditButton
            role={user?.role === "INTERVIEWER" ? "INTERVIEWER" : "INTERVIEWEE"}
            credits={
              (user?.role === "INTERVIEWER"
                ? user?.creditBalance
                : user?.credits) ?? 0
            }
          />

          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
};

export default Header;

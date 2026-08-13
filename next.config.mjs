/*
 * Natural-Language File Comment:
 * File Role: Next.js app ka runtime behavior configure karta hai (StrictMode, image domains, etc.).
 * Project Flow Link: 'next.config.mjs' build/dev server behavior aur framework-level options control karta hai.
 * Read Order: type hint -> nextConfig object -> export.
 */
/** @type {import('next').NextConfig} */
const nextConfig = { // Next.js config object
  reactStrictMode: false, // React Strict Mode off (warnings disabled) — set true for stricter checks.
  images: { // Image optimization & remote image settings
    remotePatterns: [ // Allowed remote image URL patterns
      {
        protocol: "https", // Allowed protocol for remote images
        hostname: "randomuser.me", // Allowed remote image hostname
      },
      {
        protocol: "https",
        hostname: "img.clerk.com", // Clerk user avatar images
      },
    ],
  },
};

export default nextConfig; // Export config for Next.js runtime

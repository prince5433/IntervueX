/*
 * Natural-Language File Comment:
 * File Role: Next.js app ka runtime behavior configure karta hai (StrictMode, image domains, etc.).
 * Project Flow Link: 'next.config.mjs' build/dev server behavior aur framework-level options control karta hai.
 * Read Order: type hint -> nextConfig object -> export.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },
};

export default nextConfig;

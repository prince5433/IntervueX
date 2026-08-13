/*
 * File Overview:
 * Use Case: Rate limiter instances create karta hai aur Arcjet decision ko app-friendly error messages me convert karta hai.
 * Project Role: Abuse prevention policy ko reusable utility form me centralize karta hai.
 * Typical Trigger: Booking/withdrawal jaise sensitive actions me request guard ke liye call hota hai.
 * File Path: lib/arcjet.js
 */
import arcjet, { tokenBucket } from "@arcjet/next"; // Arcjet client + token bucket helper

/**
 * Creates a pre-configured Arcjet instance with token bucket rate limiting.
 *
 * @param {Object} options
 * @param {number} options.refillRate  - tokens added per interval
 * @param {string} options.interval    - e.g. "1h", "1m"
 * @param {number} options.capacity    - max burst size
 */
export function createRateLimiter({ refillRate, interval, capacity }) {
  return arcjet({ // Arcjet instance return karta hai
    key: process.env.ARCJET_KEY, // API key env se lo
    // IP ke bajaye userId use kar rahe hain taaki shared IP pe valid users block na ho
    characteristics: ["userId"], // fingerprint characteristic set
    rules: [
      tokenBucket({ // token bucket rule configure
        mode: "LIVE", // LIVE mode — real-time enforcement
        refillRate, // tokens per interval (parameter)
        interval, // interval string like '1h' (parameter)
        capacity, // max burst (parameter)
      }),
    ],
  });
}

/**
 * Runs an Arcjet decision and returns an error string if denied, null if allowed.
 * userId is the Clerk user ID — passed as the fingerprint characteristic.
 *
 * @param {import("@arcjet/next").ArcjetInstance} aj
 * @param {Request} req
 * @param {string} userId
 * @returns {Promise<string|null>}
 */
export async function checkRateLimit(aj, req, userId) {
  const decision = await aj.protect(req, { userId, requested: 1 }); // Arcjet se protection call
  if (decision.isDenied()) { // agar deny hua to message banao
    // reason ke hisaab se user-friendly message
    return decision.reason.isRateLimit()
      ? "Too many requests. Please try again later." // rate limit message
      : "Request blocked."; // generic block
  }
  return null; // allowed hua — null return karo
}

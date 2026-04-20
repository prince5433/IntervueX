/*
 * File Overview:
 * Use Case: Generic utility helpers provide karta hai (jaise className merge via clsx + tailwind-merge).
 * Project Role: UI class composition ko clean aur conflict-free rakhta hai.
 * Typical Trigger: Shared UI components me class names combine karte waqt use hota hai.
 * File Path: lib/utils.js
 */
// Note: clsx conditional classes ko normalize karta hai.
import { clsx } from "clsx";
// Note: tailwind class conflicts ko smart merge karta hai.
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  // Note: pehle clsx condition-based classes ko flat string banata hai.
  // phir twMerge Tailwind class conflicts (e.g. p-2 vs p-4) resolve karta hai.
  return twMerge(clsx(inputs));
}

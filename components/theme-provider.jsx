"use client";

/*
 * File Overview:
 * Use Case: Theme context provider wrapper (next-themes) expose karta hai.
 * Project Role: Global theme switching support ko root layer se connect karta hai.
 * Trigger: Root layout me provider mount hote hi.
 * File Path: components/theme-provider.jsx
 */
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

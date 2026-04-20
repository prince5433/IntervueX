"use client";

/*
 * File Overview:
 * Use Case: Animated stars background wrapper provide karta hai.
 * Project Role: Dark-theme visual depth aur premium feel add karta hai.
 * Trigger: Jin pages/sections me stars effect include hai.
 * File Path: components/demo-components-backgrounds-stars.jsx
 */
import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export const StarsBackgroundDemo = () => {
  const { resolvedTheme } = useTheme();
  return (
    <StarsBackground
      starColor={resolvedTheme === "dark" ? "#FFF" : "#000"}
      className={cn(
        "absolute inset-0 flex items-center justify-center rounded-xl",
        "dark:bg-[radial-gradient(ellipse_at_bottom,#262626_0%,#000_100%)] bg-[radial-gradient(ellipse_at_bottom,#f5f5f5_0%,#fff_100%)]"
      )}
    />
  );
};

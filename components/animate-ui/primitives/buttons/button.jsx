/*
 * File Overview:
 * Use Case: Is component ka use-case folder feature ko render/handle karna hai.
 * Project Role: Project flow me yeh reusable UI ya route block ki tarah kaam karta hai.
 * Trigger: Jab related route/component tree render hoti hai tab yeh active hota hai.
 * File Path: components/animate-ui/primitives/buttons/button.jsx
 */
'use client';;
import * as React from 'react';
import { motion } from 'motion/react';

import { Slot } from '@/components/animate-ui/primitives/animate/slot';

function Button({
  hoverScale = 1.05,
  tapScale = 0.95,
  asChild = false,
  ...props
}) {
  const Component = asChild ? Slot : motion.button;
  return (
    <Component
      whileTap={{ scale: tapScale }}
      whileHover={{ scale: hoverScale }}
      {...props} />
  );
}

export { Button };

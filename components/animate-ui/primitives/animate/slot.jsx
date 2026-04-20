/*
 * File Overview:
 * Use Case: Is component ka use-case folder feature ko render/handle karna hai.
 * Project Role: Project flow me yeh reusable UI ya route block ki tarah kaam karta hai.
 * Trigger: Jab related route/component tree render hoti hai tab yeh active hota hai.
 * File Path: components/animate-ui/primitives/animate/slot.jsx
 */
'use client';;
import * as React from 'react';
import { motion, isMotionComponent } from 'motion/react';
import { cn } from '@/lib/utils';

function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        (ref).current = node;
      }
    });
  };
}

function mergeProps(childProps, slotProps) {
  const merged = { ...childProps, ...slotProps };

  if (childProps.className || slotProps.className) {
    merged.className = cn(childProps.className, slotProps.className);
  }

  if (childProps.style || slotProps.style) {
    merged.style = {
      ...(childProps.style),
      ...(slotProps.style),
    };
  }

  return merged;
}

function Slot(
  {
    children,
    ref,
    ...props
  }
) {
  const isAlreadyMotion =
    typeof children.type === 'object' &&
    children.type !== null &&
    isMotionComponent(children.type);

  const Base = React.useMemo(() =>
    isAlreadyMotion
      ? (children.type)
      : motion.create(children.type), [isAlreadyMotion, children.type]);

  if (!React.isValidElement(children)) return null;

  const { ref: childRef, ...childProps } = children.props;

  const mergedProps = mergeProps(childProps, props);
  return (<Base {...mergedProps} ref={mergeRefs(childRef, ref)} />);
}

export { Slot };

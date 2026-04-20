/*
 * File Overview:
 * Use Case: Is component ka use-case folder feature ko render/handle karna hai.
 * Project Role: Project flow me yeh reusable UI ya route block ki tarah kaam karta hai.
 * Trigger: Jab related route/component tree render hoti hai tab yeh active hota hai.
 * File Path: hooks/use-is-in-view.jsx
 */
import * as React from 'react';
import { useInView } from 'motion/react';

function useIsInView(ref, options = {}) {
  const { inView, inViewOnce = false, inViewMargin = '0px' } = options;
  const localRef = React.useRef(null);
  React.useImperativeHandle(ref, () => localRef.current);
  const inViewResult = useInView(localRef, {
    once: inViewOnce,
    margin: inViewMargin,
  });
  const isInView = !inView || inViewResult;
  return { ref: localRef, isInView };
}

export { useIsInView };

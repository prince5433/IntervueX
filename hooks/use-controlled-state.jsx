/*
 * File Overview:
 * Use Case: Is component ka use-case folder feature ko render/handle karna hai.
 * Project Role: Project flow me yeh reusable UI ya route block ki tarah kaam karta hai.
 * Trigger: Jab related route/component tree render hoti hai tab yeh active hota hai.
 * File Path: hooks/use-controlled-state.jsx
 */
import * as React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useControlledState(props) {
  const { value, defaultValue, onChange } = props;
  const [state, setInternalState] = React.useState(value !== undefined ? value : (defaultValue));

  React.useEffect(() => {
    if (value !== undefined) setInternalState(value);
  }, [value]);

  const setState = React.useCallback((next, ...args) => {
    setInternalState(next);
    onChange?.(next, ...args);
  }, [onChange]);

  return [state, setState];
}

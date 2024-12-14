import { useRef, useEffect } from 'react';
/**
 * A custom hook that returns the previous value of a state or prop.
 * @param value The current value.
 * @returns The previous value.
 */
export function usePrevValue<T>(value: T): T | undefined {
  const prevRef = useRef<T>();

  useEffect(() => {
    prevRef.current = value;
  }, [value]);

  return prevRef.current;
}

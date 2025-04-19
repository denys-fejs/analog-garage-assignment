import { useState, useEffect, useRef } from "react";

export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdate = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeElapsed = now - lastUpdate.current;

    if (timeElapsed >= delay) {
      // If enough time has elapsed, update immediately
      setThrottledValue(value);
      lastUpdate.current = now;
    } else {
      // Otherwise, set a timeout for the remaining time
      const timerId = setTimeout(() => {
        setThrottledValue(value);
        lastUpdate.current = Date.now();
      }, delay - timeElapsed);

      return () => clearTimeout(timerId);
    }
  }, [value, delay]);

  return throttledValue;
}

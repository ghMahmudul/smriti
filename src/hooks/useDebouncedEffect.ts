import { useEffect, useRef } from "react";

export function useDebouncedEffect(
  callback: () => void,
  delay: number,
  deps: readonly unknown[],
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const timer = setTimeout(() => callbackRef.current(), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are passed explicitly
  }, [delay, ...deps]);
}

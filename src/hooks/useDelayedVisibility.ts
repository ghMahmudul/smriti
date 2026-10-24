import { useEffect, useState } from "react";

export function useDelayedVisibility(delayMs = 10): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return visible;
}

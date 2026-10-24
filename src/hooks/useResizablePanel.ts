import { useCallback, useEffect, useState } from "react";

export const DEFAULT_STORAGE_KEY = "smriti_detail_panel_width";
export const MIN_PANEL_WIDTH = 320;
const MAX_PANEL_WIDTH_CAP = 800;
export const MIN_MAIN_WIDTH = 360;

export function getResponsiveDefaultWidth(windowWidth: number): number {
  if (windowWidth >= 1920) return 560;
  if (windowWidth >= 1600) return 520;
  if (windowWidth >= 1440) return 460;
  if (windowWidth >= 1200) return 420;
  if (windowWidth >= 1024) return 380;
  return 340;
}

export function getMaxPanelWidth(
  windowWidth: number,
  minWidth = MIN_PANEL_WIDTH,
  maxWidthCap = MAX_PANEL_WIDTH_CAP,
  minMainWidth = MIN_MAIN_WIDTH,
): number {
  const available = windowWidth - minMainWidth;
  return Math.max(minWidth, Math.min(maxWidthCap, available));
}

interface UseResizablePanelOptions {
  storageKey?: string;
  minWidth?: number;
  maxWidthCap?: number;
  minMainWidth?: number;
  disabled?: boolean;
}

export function useResizablePanel({
  storageKey = DEFAULT_STORAGE_KEY,
  minWidth = MIN_PANEL_WIDTH,
  maxWidthCap = MAX_PANEL_WIDTH_CAP,
  minMainWidth = MIN_MAIN_WIDTH,
  disabled = false,
}: UseResizablePanelOptions = {}) {
  const [isDragging, setIsDragging] = useState(false);

  const [isCustom, setIsCustom] = useState(() => {
    try {
      return localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  });

  const [width, setWidth] = useState(() => {
    const windowWidth =
      typeof window !== "undefined" ? window.innerWidth : 1280;
    const maxW = getMaxPanelWidth(
      windowWidth,
      minWidth,
      maxWidthCap,
      minMainWidth,
    );

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = Number.parseInt(saved, 10);
        if (!Number.isNaN(parsed)) {
          return Math.min(Math.max(parsed, minWidth), maxW);
        }
      }
    } catch {}

    return Math.min(getResponsiveDefaultWidth(windowWidth), maxW);
  });

  useEffect(() => {
    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, []);

  useEffect(() => {
    if (disabled) return;

    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const maxW = getMaxPanelWidth(
        windowWidth,
        minWidth,
        maxWidthCap,
        minMainWidth,
      );

      if (!isCustom) {
        const responsiveW = getResponsiveDefaultWidth(windowWidth);
        setWidth(Math.min(responsiveW, maxW));
      } else {
        setWidth((prev) => Math.min(Math.max(prev, minWidth), maxW));
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [disabled, isCustom, minWidth, maxWidthCap, minMainWidth]);

  const resetWidth = useCallback(() => {
    setIsCustom(false);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    const windowWidth =
      typeof window !== "undefined" ? window.innerWidth : 1280;
    const maxW = getMaxPanelWidth(
      windowWidth,
      minWidth,
      maxWidthCap,
      minMainWidth,
    );
    setWidth(Math.min(getResponsiveDefaultWidth(windowWidth), maxW));
  }, [storageKey, minWidth, maxWidthCap, minMainWidth]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || e.button !== 0) return;
      e.preventDefault();

      const startX = e.clientX;
      const startWidth = width;
      setIsDragging(true);

      const prevUserSelect = document.body.style.userSelect;
      const prevCursor = document.body.style.cursor;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";

      let lastWidth = startWidth;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        const maxW = getMaxPanelWidth(
          window.innerWidth,
          minWidth,
          maxWidthCap,
          minMainWidth,
        );
        const newWidth = Math.min(Math.max(startWidth - delta, minWidth), maxW);
        lastWidth = newWidth;
        setWidth(newWidth);
        setIsCustom(true);
      };

      const handlePointerUp = () => {
        setIsDragging(false);
        document.body.style.userSelect = prevUserSelect;
        document.body.style.cursor = prevCursor;

        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);

        try {
          localStorage.setItem(storageKey, lastWidth.toString());
        } catch {}
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [disabled, width, minWidth, maxWidthCap, minMainWidth, storageKey],
  );

  const handleDoubleClick = useCallback(() => {
    if (disabled) return;
    resetWidth();
  }, [disabled, resetWidth]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      const step = e.shiftKey ? 50 : 16;
      let nextWidth: number | null = null;
      const maxW = getMaxPanelWidth(
        window.innerWidth,
        minWidth,
        maxWidthCap,
        minMainWidth,
      );

      if (e.key === "ArrowLeft") {
        nextWidth = Math.min(width + step, maxW);
      } else if (e.key === "ArrowRight") {
        nextWidth = Math.max(width - step, minWidth);
      } else if (e.key === "Home") {
        nextWidth = minWidth;
      } else if (e.key === "End") {
        nextWidth = maxW;
      } else if (e.key === "Enter" || e.key === " ") {
        resetWidth();
        e.preventDefault();
        return;
      }

      if (nextWidth !== null) {
        e.preventDefault();
        setWidth(nextWidth);
        setIsCustom(true);
        try {
          localStorage.setItem(storageKey, nextWidth.toString());
        } catch {}
      }
    },
    [
      disabled,
      width,
      minWidth,
      maxWidthCap,
      minMainWidth,
      resetWidth,
      storageKey,
    ],
  );

  const currentMaxWidth =
    typeof window !== "undefined"
      ? getMaxPanelWidth(window.innerWidth, minWidth, maxWidthCap, minMainWidth)
      : maxWidthCap;

  return {
    width,
    isDragging,
    isCustom,
    handlePointerDown,
    handleDoubleClick,
    handleKeyDown,
    resetWidth,
    minWidth,
    maxWidth: currentMaxWidth,
  };
}

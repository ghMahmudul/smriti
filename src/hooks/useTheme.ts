import { useEffect } from "react";
import { useWorkspaceStore } from "../store/workspace-store";

export function useTheme() {
  const theme = useWorkspaceStore((s) => s.settings.theme);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      const naturalColor = isDark ? "#09090b" : "#ffffff";
      if (isDark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.remove("dark");
        root.style.colorScheme = "light";
      }
      const metaThemeColor = document.querySelector(
        'meta[name="theme-color"]:not([media])',
      );
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", naturalColor);
      }
    };

    if (theme === "light") {
      applyTheme(false);
    } else if (theme === "dark") {
      applyTheme(true);
    } else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mq.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);
}

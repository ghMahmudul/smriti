import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { APP_VERSION } from "@/core/constants";

export const UPDATE_STORAGE_KEY = "smriti_app_version";

export function useAppUpdate() {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      const storedVersion = localStorage.getItem(UPDATE_STORAGE_KEY);

      if (storedVersion && storedVersion !== APP_VERSION) {
        toast("Smriti updated");
      }

      localStorage.setItem(UPDATE_STORAGE_KEY, APP_VERSION);
    } catch {}
  }, []);
}

import { toast } from "sonner";
import { create } from "zustand";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;

  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setIsInstalled: (installed: boolean) => void;

  installApp: () => Promise<boolean>;
}

function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true)
  );
}

function checkIsIOS(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export const usePWAStore = create<PWAState>((set, get) => {
  const isInstalled = checkIsStandalone();
  const isIOS = checkIsIOS();

  return {
    isInstallable: isIOS && !isInstalled,
    isInstalled,
    isIOS,
    deferredPrompt: null,

    setDeferredPrompt: (prompt) => {
      const { isIOS, isInstalled } = get();
      set({
        deferredPrompt: prompt,
        isInstallable: prompt !== null || (isIOS && !isInstalled),
      });
    },

    setIsInstalled: (installed) => {
      const { deferredPrompt, isIOS } = get();
      set({
        isInstalled: installed,
        isInstallable: !installed && (deferredPrompt !== null || isIOS),
      });
    },

    installApp: async () => {
      const { deferredPrompt, isIOS } = get();

      if (!deferredPrompt) {
        if (isIOS) {
          toast.info(
            "To install on iOS: tap the Share button in Safari, then tap 'Add to Home Screen'.",
            { duration: 6000 },
          );
        }
        return false;
      }

      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          set({
            deferredPrompt: null,
            isInstallable: false,
            isInstalled: true,
          });
          return true;
        }
        return false;
      } catch (err) {
        console.error("PWA install error:", err);
        return false;
      }
    },
  };
});

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    usePWAStore.getState().setDeferredPrompt(e as BeforeInstallPromptEvent);
  });

  window.addEventListener("appinstalled", () => {
    usePWAStore.getState().setIsInstalled(true);
  });

  const mql = window.matchMedia?.("(display-mode: standalone)");
  mql?.addEventListener("change", (e: MediaQueryListEvent) => {
    usePWAStore.getState().setIsInstalled(e.matches);
  });
}

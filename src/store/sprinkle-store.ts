import { create } from "zustand";
import type { Priority } from "../core/types";
import { useWorkspaceStore } from "./workspace-store";

export interface SprinkleBurst {
  id: string;
  x: number;
  y: number;
  priority?: Priority;
}

interface SprinkleState {
  latestBurst: SprinkleBurst | null;
  triggerSprinkle: (burst: Omit<SprinkleBurst, "id">) => void;
}

let nextId = 0;

export const useSprinkleStore = create<SprinkleState>((set) => ({
  latestBurst: null,
  triggerSprinkle: (burst) => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const isSprinkleEnabled =
      useWorkspaceStore.getState?.()?.settings?.sprinkleEffect ?? true;
    if (!isSprinkleEnabled) {
      return;
    }
    const id = `sprinkle-${++nextId}`;
    set({ latestBurst: { ...burst, id } });
  },
}));

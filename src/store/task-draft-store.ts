import { create } from "zustand";
import {
  getFutureLocalDateString,
  getTodayLocalDateString,
} from "../core/date-utils";
import type { Priority } from "../core/types";

export interface TaskDraft {
  title: string;
  description: string;
  projectId: string;
  priority?: Priority;
  due?: string;
  repeat?: string;
  tags: string[];
}

export function getDefaultDue(activeView: string): string {
  if (activeView === "today") {
    return getTodayLocalDateString();
  }
  if (activeView === "upcoming") {
    return getFutureLocalDateString(1);
  }
  return "";
}

export function getDefaultTags(activeView: string): string[] {
  if (activeView.startsWith("tag:")) {
    const tag = activeView.slice(4);
    return tag ? [tag] : [];
  }
  return [];
}

export function getTargetProject(activeView: string): string {
  if (
    activeView === "all" ||
    activeView === "today" ||
    activeView === "upcoming" ||
    activeView === "archived" ||
    activeView === "completed" ||
    activeView === "trash" ||
    activeView.startsWith("tag:")
  ) {
    return "Inbox";
  }
  if (activeView.startsWith("project:")) {
    return activeView.slice(8);
  }
  return "Inbox";
}

export function createDefaultDraft(activeView = "inbox"): TaskDraft {
  return {
    title: "",
    description: "",
    projectId: getTargetProject(activeView),
    priority: undefined,
    due: getDefaultDue(activeView),
    repeat: undefined,
    tags: getDefaultTags(activeView),
  };
}

export interface TaskDraftState {
  isOpen: boolean;
  currentView: string | null;
  draft: TaskDraft;

  openModal: () => void;
  closeModal: () => void;
  setDraftField: <K extends keyof TaskDraft>(
    field: K,
    value: TaskDraft[K],
  ) => void;
  setDraft: (updates: Partial<TaskDraft>) => void;
  syncView: (view: string) => void;
  resetDraft: (view?: string) => void;
  resetAll: () => void;
}

export const useTaskDraftStore = create<TaskDraftState>()((set, get) => ({
  isOpen: false,
  currentView: null,
  draft: createDefaultDraft(),

  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),

  setDraftField: (field, value) =>
    set((state) => ({
      draft: { ...state.draft, [field]: value },
    })),

  setDraft: (updates) =>
    set((state) => ({
      draft: { ...state.draft, ...updates },
    })),

  syncView: (view) => {
    const { currentView } = get();
    if (currentView !== view) {
      set({
        currentView: view,
        draft: createDefaultDraft(view),
      });
    }
  },

  resetDraft: (view) => {
    const targetView = view ?? get().currentView ?? "inbox";
    set({
      draft: createDefaultDraft(targetView),
    });
  },

  resetAll: () =>
    set({
      isOpen: false,
      currentView: null,
      draft: createDefaultDraft(),
    }),
}));

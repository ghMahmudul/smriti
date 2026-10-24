import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  isValidSortBy,
  isValidSortOrder,
  SORT_CONFIG,
  type TaskSortBy,
  type TaskSortOrder,
} from "../core/task-sort";

interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  taskSortBy: TaskSortBy;
  taskSortOrder: TaskSortOrder;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  openMobileSidebar: () => void;
  setTaskSortBy: (sortBy: TaskSortBy) => void;
  setTaskSortOrder: (order: TaskSortOrder) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      taskSortBy: "default",
      taskSortOrder: "smart",

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      toggleMobileSidebar: () =>
        set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
      openMobileSidebar: () => set({ mobileSidebarOpen: true }),
      setTaskSortBy: (sortBy) => {
        const targetSortBy =
          isValidSortBy(sortBy) && sortBy in SORT_CONFIG ? sortBy : "default";
        const defaultOrder = SORT_CONFIG[targetSortBy].defaultOrder;
        set({ taskSortBy: targetSortBy, taskSortOrder: defaultOrder });
      },
      setTaskSortOrder: (order) => {
        if (isValidSortOrder(order)) {
          set({ taskSortOrder: order });
        }
      },
    }),
    {
      name: "smriti-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        taskSortBy: state.taskSortBy,
        taskSortOrder: state.taskSortOrder,
      }),
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<UIState> | null | undefined;
        if (state) {
          const taskSortBy = isValidSortBy(state.taskSortBy)
            ? state.taskSortBy
            : "default";
          const validOrders =
            SORT_CONFIG[taskSortBy]?.orderOptions.map((o) => o.value) ?? [];
          const taskSortOrder =
            isValidSortOrder(state.taskSortOrder) &&
            validOrders.includes(state.taskSortOrder)
              ? state.taskSortOrder
              : (SORT_CONFIG[taskSortBy]?.defaultOrder ?? "smart");

          return {
            ...currentState,
            ...state,
            taskSortBy,
            taskSortOrder,
          };
        }
        if (typeof window !== "undefined") {
          const legacy = localStorage.getItem("sidebar-collapsed");
          if (legacy !== null) {
            localStorage.removeItem("sidebar-collapsed");
            return { ...currentState, sidebarCollapsed: legacy === "true" };
          }
        }
        return currentState;
      },
    },
  ),
);

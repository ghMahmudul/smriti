import type { Priority } from "./types";

export const RESERVED_METADATA_KEYS = [
  "id",
  "created",
  "modified",
  "completed",
  "due",
  "remind",
  "priority",
  "tags",
  "estimate",
  "repeat",
  "archived",
  "trashed",
] as const;

export const SYSTEM_VIEW_IDS = [
  "all",
  "inbox",
  "today",
  "upcoming",
  "archived",
  "completed",
  "trash",
] as const;

export type SystemViewId = (typeof SYSTEM_VIEW_IDS)[number];

export const PRIORITY_OPTIONS: {
  value: Priority;
  label: string;
  color: string;
}[] = [
  { value: "high", label: "High", color: "text-red-500 dark:text-red-400" },
  {
    value: "medium",
    label: "Medium",
    color: "text-amber-500 dark:text-amber-400",
  },
  { value: "low", label: "Low", color: "text-blue-500 dark:text-blue-400" },
];

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "text-red-500",
  medium: "text-amber-500",
  low: "text-blue-500",
};

export const PRIORITY_MUTED_COLORS: Record<Priority, string> = {
  high: "text-red-500/50",
  medium: "text-amber-500/50",
  low: "text-blue-500/50",
};

export function getTaskCheckboxColor(
  priority: Priority | undefined,
  state: "open" | "done",
): string {
  if (state === "done") {
    return priority
      ? PRIORITY_MUTED_COLORS[priority]
      : "text-muted-foreground/60";
  }
  return priority ? PRIORITY_COLORS[priority] : "text-muted-foreground";
}

export { formatDate, getDueDateColor } from "./date-utils";

declare const __APP_VERSION__: string | undefined;

export const APP_VERSION =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.1.0";

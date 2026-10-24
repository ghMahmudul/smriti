import {
  getFutureLocalDateString,
  getTodayLocalDateString,
  parseDueDate,
} from "./date-utils";
import type { TodoItem } from "./types";

export type TaskSortBy = "default" | "due" | "priority" | "title" | "created";
export type TaskSortOrder = "asc" | "desc" | "smart" | "normal";

export interface SortFieldConfig {
  label: string;
  orderLabel?: string;
  defaultOrder: TaskSortOrder;
  orderOptions: {
    value: TaskSortOrder;
    label: string;
  }[];
}

export const SORT_CONFIG: Record<TaskSortBy, SortFieldConfig> = {
  default: {
    label: "Default",
    orderLabel: "Mode",
    defaultOrder: "smart",
    orderOptions: [
      { value: "smart", label: "Smart" },
      { value: "normal", label: "Normal" },
    ],
  },
  due: {
    label: "Date",
    defaultOrder: "asc",
    orderOptions: [
      { value: "asc", label: "Earliest first" },
      { value: "desc", label: "Latest first" },
    ],
  },
  created: {
    label: "Created",
    defaultOrder: "desc",
    orderOptions: [
      { value: "desc", label: "Newest first" },
      { value: "asc", label: "Oldest first" },
    ],
  },
  priority: {
    label: "Priority",
    defaultOrder: "desc",
    orderOptions: [
      { value: "desc", label: "Highest first" },
      { value: "asc", label: "Lowest first" },
    ],
  },
  title: {
    label: "Title",
    defaultOrder: "asc",
    orderOptions: [
      { value: "asc", label: "A to Z" },
      { value: "desc", label: "Z to A" },
    ],
  },
};

export interface SortOption {
  value: TaskSortBy;
  label: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { value: "default", label: SORT_CONFIG.default.label },
  { value: "due", label: SORT_CONFIG.due.label },
  { value: "created", label: SORT_CONFIG.created.label },
  { value: "priority", label: SORT_CONFIG.priority.label },
  { value: "title", label: SORT_CONFIG.title.label },
];

export function isValidSortBy(value: unknown): value is TaskSortBy {
  return (
    typeof value === "string" && Object.hasOwn(SORT_CONFIG, value as TaskSortBy)
  );
}

export function isValidSortOrder(value: unknown): value is TaskSortOrder {
  return (
    value === "asc" ||
    value === "desc" ||
    value === "smart" ||
    value === "normal"
  );
}

const PRIORITY_WEIGHT: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

interface SmartSortKey {
  task: TodoItem;
  index: number;
  tier: number;
  weight: number;
  timestamp: number;
  hasTime: boolean;
  timeMinutes: number;
  order: number;
}

function computeSmartSortKey(
  task: TodoItem,
  index: number,
  todayStr: string,
  nextWeekStr: string,
): SmartSortKey {
  const parsed = parseDueDate(task.metadata.due);
  const weight = task.metadata.priority
    ? (PRIORITY_WEIGHT[task.metadata.priority] ?? 0)
    : 0;

  let tier: number;
  if (parsed.localDateStr !== null) {
    if (parsed.localDateStr < todayStr) {
      tier = 1; // Overdue
    } else if (parsed.localDateStr === todayStr) {
      tier = 2; // Due today
    } else if (parsed.localDateStr <= nextWeekStr) {
      tier = 3; // Due soon (next 7 days)
    } else {
      tier = 6; // Future scheduled (> 7 days)
    }
  } else {
    if (weight === 3) {
      tier = 4; // High priority undated
    } else if (weight === 2) {
      tier = 5; // Medium priority undated
    } else {
      tier = 7; // Low / no priority undated
    }
  }

  return {
    task,
    index,
    tier,
    weight,
    timestamp: parsed.timestamp ?? 0,
    hasTime: parsed.hasTime,
    timeMinutes: parsed.timeMinutes ?? 0,
    order: task.order,
  };
}

export function smartSortTasks(tasks: TodoItem[]): TodoItem[] {
  if (tasks.length <= 1) return tasks;

  const todayStr = getTodayLocalDateString();
  const nextWeekStr = getFutureLocalDateString(7);

  // 1. Pass 1: Precompute sort keys in O(N) (Schwartzian transform)
  const prepared: SmartSortKey[] = tasks.map((task, index) =>
    computeSmartSortKey(task, index, todayStr, nextWeekStr),
  );

  // 2. Pass 2: Sort keys in O(N log N) using fast, pure primitive comparisons
  prepared.sort((a, b) => {
    if (a.tier !== b.tier) {
      return a.tier - b.tier;
    }

    switch (a.tier) {
      case 1: {
        // Overdue: oldest date first, then highest priority
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        if (a.weight !== b.weight) return b.weight - a.weight;
        break;
      }
      case 2: {
        // Due today: highest priority first, then earliest time
        if (a.weight !== b.weight) return b.weight - a.weight;
        if (a.hasTime !== b.hasTime) return a.hasTime ? -1 : 1;
        if (a.timeMinutes !== b.timeMinutes)
          return a.timeMinutes - b.timeMinutes;
        break;
      }
      case 3:
      case 6: {
        // Due soon or future: earliest date first, then highest priority
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        if (a.weight !== b.weight) return b.weight - a.weight;
        break;
      }
      case 4:
      case 5:
        // Undated high / medium priority: order within tier
        break;
      case 7: {
        // Undated low / no priority: low priority before no priority
        if (a.weight !== b.weight) return b.weight - a.weight;
        break;
      }
      default:
        break;
    }

    // Stable tie-breakers: file order within project, then initial list index
    if (a.order !== b.order) return a.order - b.order;
    return a.index - b.index;
  });

  // 3. Pass 3: Extract sorted tasks in O(N)
  return prepared.map((item) => item.task);
}

export function sortTasks(
  tasks: TodoItem[],
  sortBy: TaskSortBy,
  sortOrder: TaskSortOrder,
): TodoItem[] {
  if (tasks.length <= 1) {
    return tasks;
  }

  if (sortBy === "default") {
    if (sortOrder === "normal") {
      return tasks;
    }
    return smartSortTasks(tasks);
  }

  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case "priority": {
        const weightA = a.metadata.priority
          ? (PRIORITY_WEIGHT[a.metadata.priority] ?? 0)
          : 0;
        const weightB = b.metadata.priority
          ? (PRIORITY_WEIGHT[b.metadata.priority] ?? 0)
          : 0;
        if (weightA !== weightB) {
          return sortOrder === "desc" ? weightB - weightA : weightA - weightB;
        }
        return 0;
      }
      case "due": {
        const dueA = a.metadata.due;
        const dueB = b.metadata.due;
        if (!dueA && !dueB) return 0;
        if (!dueA) return 1;
        if (!dueB) return -1;
        const timeA = Date.parse(dueA);
        const timeB = Date.parse(dueB);
        const validA = !Number.isNaN(timeA);
        const validB = !Number.isNaN(timeB);
        if (validA && validB) {
          const diff = timeA - timeB;
          if (diff !== 0) return sortOrder === "asc" ? diff : -diff;
        } else {
          const cmp = dueA.localeCompare(dueB);
          if (cmp !== 0) return sortOrder === "asc" ? cmp : -cmp;
        }
        return 0;
      }
      case "title": {
        const cmp = a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
          numeric: true,
        });
        return sortOrder === "asc" ? cmp : -cmp;
      }
      case "created": {
        const timeA = a.metadata.created ? Date.parse(a.metadata.created) : 0;
        const timeB = b.metadata.created ? Date.parse(b.metadata.created) : 0;
        const validA = !Number.isNaN(timeA) && timeA > 0;
        const validB = !Number.isNaN(timeB) && timeB > 0;
        if (!validA && !validB) return 0;
        if (!validA) return 1;
        if (!validB) return -1;
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      }
      default:
        return 0;
    }
  });
}

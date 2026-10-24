import type { DateRange } from "react-day-picker";
import { formatLocalDate, parseDueDate } from "./date-utils";
import type { TodoItem } from "./types";

export function getTodayRange(): { from: Date; to: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { from: today, to: today };
}

export function getThisWeekRange(referenceDate: Date = new Date()): {
  from: Date;
  to: Date;
} {
  const day = referenceDate.getDay();
  // Monday is 1, Sunday is 0. If Sunday, go back 6 days to Monday.
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + diffToMonday,
  );
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + 6,
  );
  sunday.setHours(0, 0, 0, 0);

  return { from: monday, to: sunday };
}

export function getThisMonthRange(referenceDate: Date = new Date()): {
  from: Date;
  to: Date;
} {
  const start = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    1,
  );
  start.setHours(0, 0, 0, 0);

  const end = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0,
  );
  end.setHours(0, 0, 0, 0);

  return { from: start, to: end };
}

export function isSameDay(d1?: Date, d2?: Date): boolean {
  if (!d1 && !d2) return true;
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function normalizeRange(
  range?: DateRange,
): { start: Date; end: Date } | null {
  if (!range?.from) return null;
  const to = range.to ?? range.from;
  if (range.from.getTime() > to.getTime()) {
    return { start: to, end: range.from };
  }
  return { start: range.from, end: to };
}

export function isRangeEqual(r1?: DateRange, r2?: DateRange): boolean {
  if (!r1 && !r2) return true;
  if (!r1 || !r2) return false;
  const n1 = normalizeRange(r1);
  const n2 = normalizeRange(r2);
  if (!n1 && !n2) return true;
  if (!n1 || !n2) return false;
  return isSameDay(n1.start, n2.start) && isSameDay(n1.end, n2.end);
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatFilterDateRange(range?: DateRange): string | null {
  if (!range) return null;
  const normalized = normalizeRange(range);
  if (!normalized) return null;

  const todayRange = getTodayRange();
  const weekRange = getThisWeekRange();
  const monthRange = getThisMonthRange();

  if (isRangeEqual(range, todayRange)) return "Today";
  if (isRangeEqual(range, weekRange)) return "This Week";
  if (isRangeEqual(range, monthRange)) return "This Month";

  const fromStr = formatShortDate(normalized.start);
  if (isSameDay(normalized.start, normalized.end)) {
    return fromStr;
  }
  const toStr = formatShortDate(normalized.end);
  return `${fromStr} – ${toStr}`;
}

export function filterCompletedTasks(
  tasks: TodoItem[],
  projectFilter: string,
  dateRange?: DateRange,
): TodoItem[] {
  const hasProjectFilter =
    Boolean(projectFilter) && projectFilter.toLowerCase() !== "all";
  const normalizedRange = dateRange ? normalizeRange(dateRange) : null;
  const hasDateFilter = Boolean(normalizedRange);

  if (!hasProjectFilter && !hasDateFilter) {
    return tasks;
  }

  const minDateStr = normalizedRange
    ? formatLocalDate(normalizedRange.start)
    : null;
  const maxDateStr = normalizedRange
    ? formatLocalDate(normalizedRange.end)
    : null;

  const isInboxProject = projectFilter.toLowerCase() === "inbox";

  return tasks.filter((task) => {
    if (hasProjectFilter) {
      if (isInboxProject) {
        if (task.projectId.toLowerCase() !== "inbox") {
          return false;
        }
      } else if (task.projectId !== projectFilter) {
        return false;
      }
    }

    if (hasDateFilter && minDateStr && maxDateStr) {
      if (!task.metadata.completed) {
        return false;
      }
      const parsed = parseDueDate(task.metadata.completed);
      if (!parsed.localDateStr) {
        return false;
      }
      if (
        parsed.localDateStr < minDateStr ||
        parsed.localDateStr > maxDateStr
      ) {
        return false;
      }
    }

    return true;
  });
}

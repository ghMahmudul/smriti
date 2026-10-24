import { formatLocalDate } from "./date-utils";

export interface RepeatRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly" | "weekdays" | "custom";
  interval: number;
  unit?: "days" | "weeks" | "months";
}

export const REPEAT_PRESETS: { label: string; value: string }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "Weekdays", value: "weekdays" },
];

export function parseRepeatRule(value: string): RepeatRule | null {
  const trimmed = value.trim().toLowerCase();

  switch (trimmed) {
    case "daily":
      return { frequency: "daily", interval: 1 };
    case "weekly":
      return { frequency: "weekly", interval: 1 };
    case "monthly":
      return { frequency: "monthly", interval: 1 };
    case "yearly":
      return { frequency: "yearly", interval: 1 };
    case "weekdays":
      return { frequency: "weekdays", interval: 1 };
  }

  const customMatch = trimmed.match(/^every\s+(\d+)\s+(days?|weeks?|months?)$/);
  if (customMatch) {
    const interval = Number.parseInt(customMatch[1] as string, 10);
    if (interval < 1 || !Number.isFinite(interval)) return null;
    const unitRaw = customMatch[2] as string;
    const unit: "days" | "weeks" | "months" = unitRaw.startsWith("day")
      ? "days"
      : unitRaw.startsWith("week")
        ? "weeks"
        : "months";

    return { frequency: "custom", interval, unit };
  }

  return null;
}

export function formatRepeatLabel(value: string): string {
  const rule = parseRepeatRule(value);
  if (!rule) return value;

  switch (rule.frequency) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "yearly":
      return "Yearly";
    case "weekdays":
      return "Weekdays";
    case "custom": {
      if (rule.interval === 1) {
        switch (rule.unit) {
          case "days":
            return "Daily";
          case "weeks":
            return "Weekly";
          case "months":
            return "Monthly";
        }
      }
      return `Every ${rule.interval} ${rule.unit}`;
    }
  }
}

/**
 * Calculates the initial due date anchor when a repeat rule is applied to an undated task.
 * Follows industry standards: defaults to today, or the first matching day (e.g. next weekday
 * if selected on a weekend).
 */
export function getInitialDueDate(
  repeatValue: string,
  fromDate: Date | string = new Date(),
): string {
  const rule = parseRepeatRule(repeatValue);
  let target: Date;
  if (typeof fromDate === "string") {
    const parts = fromDate.split("-").map(Number);
    target = new Date(parts[0] ?? 0, (parts[1] ?? 1) - 1, parts[2] ?? 1);
  } else {
    target = new Date(fromDate);
  }
  target.setHours(0, 0, 0, 0);

  if (rule?.frequency === "weekdays") {
    const day = target.getDay();
    if (day === 6) {
      // Saturday -> move to Monday (+2 days)
      target.setDate(target.getDate() + 2);
    } else if (day === 0) {
      // Sunday -> move to Monday (+1 day)
      target.setDate(target.getDate() + 1);
    }
  }

  return formatLocalDate(target);
}

export function getNextDueDate(
  currentDue: string | undefined,
  repeatValue: string,
): string {
  const rule = parseRepeatRule(repeatValue);
  if (!rule) return formatLocalDate(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let baseDate: Date;
  if (currentDue) {
    const parts = currentDue.split("-").map(Number);
    baseDate = new Date(
      parts[0] ?? today.getFullYear(),
      (parts[1] ?? 1) - 1,
      parts[2] ?? 1,
    );
    baseDate.setHours(0, 0, 0, 0);
  } else {
    baseDate = new Date(today);
  }

  let nextDate = advanceDate(baseDate, rule);

  while (nextDate < today) {
    nextDate = advanceDate(nextDate, rule);
  }

  return formatLocalDate(nextDate);
}

function advanceDate(date: Date, rule: RepeatRule): Date {
  const next = new Date(date);

  switch (rule.frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
    case "weekdays": {
      next.setDate(next.getDate() + 1);
      while (next.getDay() === 0 || next.getDay() === 6) {
        next.setDate(next.getDate() + 1);
      }
      break;
    }
    case "custom": {
      switch (rule.unit) {
        case "days":
          next.setDate(next.getDate() + rule.interval);
          break;
        case "weeks":
          next.setDate(next.getDate() + rule.interval * 7);
          break;
        case "months":
          next.setMonth(next.getMonth() + rule.interval);
          break;
      }
      break;
    }
  }

  return next;
}

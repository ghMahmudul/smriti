import {
  Ban,
  CalendarDays,
  Calendar as CalendarIcon,
  ChevronDown,
  Repeat,
  Sun,
  Sunrise,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatLocalDate,
  getFutureLocalDateString,
  getTodayLocalDateString,
} from "@/core/date-utils";
import {
  formatRepeatLabel,
  getInitialDueDate,
  parseRepeatRule,
  REPEAT_PRESETS,
} from "@/core/repeat-utils";
import { cn } from "@/lib/utils";

function toDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  return new Date(parts[0] ?? 0, (parts[1] ?? 1) - 1, parts[2] ?? 1);
}

function formatDate(dateStr: string): string {
  const d = toDate(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const DATE_QUICK_OPTIONS: {
  label: string;
  getValue: () => string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    label: "Today",
    getValue: () => getTodayLocalDateString(),
    icon: Sun,
  },
  {
    label: "Tomorrow",
    getValue: () => getFutureLocalDateString(1),
    icon: Sunrise,
  },
  {
    label: "Next Week",
    getValue: () => getFutureLocalDateString(7),
    icon: CalendarDays,
  },
  {
    label: "No Date",
    getValue: () => "",
    icon: Ban,
  },
];

const QUICK_OPTIONS = DATE_QUICK_OPTIONS;

const CUSTOM_UNITS = [
  { label: "Days", value: "days" },
  { label: "Weeks", value: "weeks" },
  { label: "Months", value: "months" },
] as const;

type CustomUnit = (typeof CUSTOM_UNITS)[number]["value"];

interface RepeatMenuProps {
  repeat: string;
  onRepeatChange: (value: string) => void;
}

function RepeatMenu({ repeat, onRepeatChange }: RepeatMenuProps) {
  const isCustomRepeat =
    repeat !== "" && !REPEAT_PRESETS.some((preset) => preset.value === repeat);
  const parsedCustom = isCustomRepeat ? parseRepeatRule(repeat) : null;
  const parsedInterval = parsedCustom?.interval;
  const parsedUnit = parsedCustom?.unit;

  const [customInterval, setCustomInterval] = useState(parsedInterval ?? 2);
  const [customIntervalInput, setCustomIntervalInput] = useState(
    String(parsedInterval ?? 2),
  );
  const [customUnit, setCustomUnit] = useState<CustomUnit>(
    parsedUnit ?? "days",
  );
  const intervalInputRef = useRef<HTMLInputElement>(null);
  const intervalInputId = useId();

  useEffect(() => {
    if (parsedInterval === undefined) return;
    setCustomInterval(parsedInterval);
    setCustomIntervalInput(String(parsedInterval));
  }, [parsedInterval]);

  useEffect(() => {
    if (parsedUnit) setCustomUnit(parsedUnit);
  }, [parsedUnit]);

  const selectedValue = !repeat ? "none" : isCustomRepeat ? "custom" : repeat;

  const applyCustom = (interval: number, unit: CustomUnit) => {
    onRepeatChange(`every ${interval} ${unit}`);
  };

  const handleValueChange = (value: string) => {
    if (value === "none") {
      onRepeatChange("");
      return;
    }
    if (value === "custom") {
      applyCustom(customInterval, customUnit);
      requestAnimationFrame(() => intervalInputRef.current?.focus());
      return;
    }
    onRepeatChange(value);
  };

  const handleIntervalInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setCustomIntervalInput(value);
    if (value === "") return;

    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;

    const clamped = Math.min(99, Math.max(1, parsed));
    setCustomInterval(clamped);
    applyCustom(clamped, customUnit);
  };

  const commitCustomInterval = () => {
    const parsed = Number.parseInt(customIntervalInput, 10);
    const next = Number.isFinite(parsed)
      ? Math.min(99, Math.max(1, parsed))
      : customInterval;

    setCustomInterval(next);
    setCustomIntervalInput(String(next));
    applyCustom(next, customUnit);
  };

  const handleCustomUnitChange = (unit: CustomUnit) => {
    setCustomUnit(unit);
    applyCustom(customInterval, unit);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-between rounded-md px-3 text-sm"
            aria-label={
              repeat ? `Repeat: ${formatRepeatLabel(repeat)}` : "Repeat"
            }
          />
        }
      >
        <span className="flex items-center gap-2">
          <Repeat className="size-4" />
          Repeat
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {repeat ? formatRepeatLabel(repeat) : "None"}
          <ChevronDown className="size-4" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={4}
        className="w-[calc(var(--anchor-width)+0.5rem)] p-1"
      >
        <DropdownMenuRadioGroup
          value={selectedValue}
          onValueChange={handleValueChange}
          aria-label="Repeat frequency"
        >
          {REPEAT_PRESETS.map((preset) => (
            <DropdownMenuRadioItem
              key={preset.value}
              value={preset.value}
              className="h-8 rounded-md px-3 py-0 pr-8 text-sm"
              closeOnClick
            >
              <span>{preset.label}</span>
            </DropdownMenuRadioItem>
          ))}
          <DropdownMenuRadioItem
            value="custom"
            className="h-8 rounded-md px-3 py-0 pr-8 text-sm"
            closeOnClick={false}
          >
            <span>Custom</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="none"
            className="h-8 rounded-md px-3 py-0 pr-8 text-sm"
            closeOnClick
          >
            <span>None</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        {isCustomRepeat && (
          <>
            <DropdownMenuSeparator className="-mx-1" />
            <fieldset
              aria-label="Custom repeat interval"
              className="m-0 min-w-0 space-y-2 border-0 px-3 py-2"
              onKeyDown={(event) => {
                if (event.key === "Escape" || event.key === "Tab") return;
                event.stopPropagation();
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={intervalInputId}>Every</Label>
                <Input
                  id={intervalInputId}
                  ref={intervalInputRef}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={99}
                  value={customIntervalInput}
                  onChange={handleIntervalInputChange}
                  onBlur={commitCustomInterval}
                  onFocus={(event) => event.currentTarget.select()}
                  className="h-8 w-20"
                />
              </div>
              <fieldset
                className="m-0 flex min-w-0 gap-2 border-0 p-0"
                aria-label="Repeat interval unit"
              >
                {CUSTOM_UNITS.map((unit) => (
                  <Button
                    key={unit.value}
                    type="button"
                    size="sm"
                    variant={customUnit === unit.value ? "default" : "outline"}
                    aria-pressed={customUnit === unit.value}
                    className="flex-1 px-2"
                    onClick={() => handleCustomUnitChange(unit.value)}
                  >
                    {unit.label}
                  </Button>
                ))}
              </fieldset>
            </fieldset>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  repeat?: string;
  onRepeatChange?: (value: string) => void;
  onDateAndRepeatChange?: (date: string, repeat: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  triggerClassName?: string;
  variant?: "outline" | "ghost";
  placeholder?: string;
  iconClassName?: string;
}

export function DatePicker({
  value,
  onChange,
  repeat = "",
  onRepeatChange,
  onDateAndRepeatChange,
  open: propOpen,
  onOpenChange: propOnOpenChange,
  className,
  triggerClassName,
  variant = "ghost",
  placeholder,
  iconClassName,
}: DatePickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = propOpen !== undefined;
  const open = isControlled ? propOpen : uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    propOnOpenChange?.(nextOpen);
  };

  const selectedDate = value ? toDate(value) : undefined;
  const triggerLabel = `${
    value ? `Date: ${formatDate(value)}` : (placeholder ?? "Date")
  }${repeat ? `, repeats ${formatRepeatLabel(repeat)}` : ""}`;
  const sharedIconClassName = cn(
    value ? "" : "text-muted-foreground",
    iconClassName,
  );

  const handleQuickOptionSelect = (getValue: () => string) => {
    const nextValue = getValue();
    if (onDateAndRepeatChange) {
      const nextRepeat = !nextValue ? "" : repeat;
      onDateAndRepeatChange(nextValue, nextRepeat);
    } else {
      onChange(nextValue);
      if (!nextValue && repeat && onRepeatChange) {
        onRepeatChange("");
      }
    }
    setOpen(false);
  };

  const handleCalendarSelect = (day?: Date) => {
    if (day) {
      const nextValue = formatLocalDate(day);
      if (onDateAndRepeatChange) {
        onDateAndRepeatChange(nextValue, repeat);
      } else {
        onChange(nextValue);
      }
      setOpen(false);
    }
  };

  const handleRepeatSelect = (nextRepeat: string) => {
    if (onDateAndRepeatChange) {
      if (!nextRepeat || nextRepeat === "none") {
        onDateAndRepeatChange(value, "");
      } else {
        const nextDate = value || getInitialDueDate(nextRepeat);
        onDateAndRepeatChange(nextDate, nextRepeat);
      }
      return;
    }

    if (!nextRepeat || nextRepeat === "none") {
      onRepeatChange?.("");
    } else {
      onRepeatChange?.(nextRepeat);
      if (!value) {
        onChange(getInitialDueDate(nextRepeat));
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant={variant}
            size="sm"
            className={triggerClassName ?? `h-8 ${value ? "gap-1.5" : ""}`}
            aria-label={triggerLabel}
          />
        }
      >
        <CalendarIcon className={cn("size-4", sharedIconClassName)} />
        {value ? (
          <span>{formatDate(value)}</span>
        ) : (
          placeholder && <span>{placeholder}</span>
        )}
        {repeat && <Repeat className={cn(sharedIconClassName, "size-3")} />}
      </PopoverTrigger>
      <PopoverContent className={`w-auto p-0 ${className ?? ""}`}>
        <div className="flex flex-col">
          <div className="flex flex-col p-1 border-b border-border">
            {QUICK_OPTIONS.map((opt) => {
              return (
                <Button
                  key={opt.label}
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-between px-3 text-sm rounded-md"
                  onClick={() => handleQuickOptionSelect(opt.getValue)}
                >
                  <span className="flex items-center gap-2">
                    <opt.icon className="size-4" />
                    {opt.label}
                  </span>
                </Button>
              );
            })}
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
          />
          {(onRepeatChange || onDateAndRepeatChange) && (
            <div className="border-t border-border p-1">
              <RepeatMenu repeat={repeat} onRepeatChange={handleRepeatSelect} />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

import {
  Ban,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronDown,
  Folder,
  Inbox,
  ListFilter,
  Sun,
} from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getProjectIcon } from "../../core/icons";
import {
  formatFilterDateRange,
  getThisMonthRange,
  getThisWeekRange,
  getTodayRange,
} from "../../core/task-filter";
import { cn } from "../../lib/utils";
import { useProjects } from "../../store/task-store";
import { useWorkspaceStore } from "../../store/workspace-store";

interface CompletedTaskFilterProps {
  projectFilter: string;
  onProjectChange: (project: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  projects?: string[];
  disabled?: boolean;
  className?: string;
}

const QUICK_OPTIONS = [
  {
    label: "Today",
    icon: Sun,
    testId: "filter-quick-today",
    getRange: () => getTodayRange(),
    clearProject: false,
  },
  {
    label: "This Week",
    icon: CalendarDays,
    testId: "filter-quick-this-week",
    getRange: () => getThisWeekRange(),
    clearProject: false,
  },
  {
    label: "This Month",
    icon: CalendarRange,
    testId: "filter-quick-this-month",
    getRange: () => getThisMonthRange(),
    clearProject: false,
  },
  {
    label: "No Filter",
    icon: Ban,
    testId: "filter-quick-no-filter",
    getRange: () => undefined,
    clearProject: true,
  },
];

export function CompletedTaskFilter({
  projectFilter,
  onProjectChange,
  dateRange,
  onDateRangeChange,
  projects: propProjects,
  disabled = false,
  className,
}: CompletedTaskFilterProps) {
  const storeProjects = useProjects();
  const settings = useWorkspaceStore((s) => s.settings);
  const projects = propProjects ?? storeProjects;
  const [open, setOpen] = useState(false);

  const isAll = !projectFilter || projectFilter.toLowerCase() === "all";
  const isInbox = projectFilter.toLowerCase() === "inbox";

  const displayLabel = isAll
    ? "All Projects"
    : isInbox
      ? "Inbox"
      : projectFilter;

  const ProjectIcon = isInbox
    ? Inbox
    : isAll
      ? Folder
      : getProjectIcon(projectFilter, settings?.projectIcons);

  const hasProjectFilter = !isAll;
  const hasDateFilter = Boolean(dateRange?.from);
  const formattedDate = formatFilterDateRange(dateRange);

  let filterLabel = "Filter";
  if (hasProjectFilter && hasDateFilter && formattedDate) {
    filterLabel = `${displayLabel} · ${formattedDate}`;
  } else if (hasProjectFilter) {
    filterLabel = displayLabel;
  } else if (hasDateFilter && formattedDate) {
    filterLabel = formattedDate;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="default"
            disabled={disabled}
            className={cn(
              "gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground",
              className,
            )}
            aria-label={
              filterLabel === "Filter"
                ? "Filter tasks"
                : `Filter tasks: ${filterLabel}`
            }
          >
            <ListFilter className="size-4 shrink-0" />
            <span className="hidden sm:inline truncate max-w-44">
              {filterLabel}
            </span>
          </Button>
        }
      />
      <PopoverContent align="end" sideOffset={6} className="w-auto p-0">
        <div className="flex flex-col">
          {/* 1. Project select */}
          <div className="p-2 border-b border-border">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full h-9 px-3 text-sm font-normal gap-2 justify-between rounded-lg shadow-none"
                    aria-label="Select project"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <ProjectIcon className="size-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{displayLabel}</span>
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  </Button>
                }
              />
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => onProjectChange("all")}
                  className="text-sm justify-between"
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <Folder className="size-4 text-muted-foreground shrink-0" />
                    <span className="truncate">All Projects</span>
                  </div>
                  {isAll && (
                    <Check className="size-4 text-foreground ml-auto shrink-0" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onProjectChange("Inbox")}
                  className="text-sm justify-between"
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <Inbox className="size-4 text-muted-foreground shrink-0" />
                    <span className="truncate">Inbox</span>
                  </div>
                  {isInbox && (
                    <Check className="size-4 text-foreground ml-auto shrink-0" />
                  )}
                </DropdownMenuItem>
                {projects
                  .filter((p) => p.toLowerCase() !== "inbox")
                  .map((p) => {
                    const isSelected = projectFilter === p;
                    const PIcon = getProjectIcon(p, settings?.projectIcons);
                    return (
                      <DropdownMenuItem
                        key={p}
                        onClick={() => onProjectChange(p)}
                        className="text-sm justify-between"
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <PIcon className="size-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{p}</span>
                        </div>
                        {isSelected && (
                          <Check className="size-4 text-foreground ml-auto shrink-0" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 2. Shortcut options (just like date-picker) */}
          <div className="flex flex-col p-1 border-b border-border">
            {QUICK_OPTIONS.map((opt) => (
              <Button
                key={opt.label}
                data-testid={opt.testId}
                variant="ghost"
                size="sm"
                className="h-8 justify-between px-3 text-sm rounded-md"
                onClick={() => {
                  onDateRangeChange(opt.getRange());
                  if (opt.clearProject) {
                    onProjectChange("all");
                  }
                  setOpen(false);
                }}
              >
                <span className="flex items-center gap-2">
                  <opt.icon className="size-3.5" />
                  {opt.label}
                </span>
              </Button>
            ))}
          </div>

          {/* 3. Range calendar */}
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={onDateRangeChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default CompletedTaskFilter;

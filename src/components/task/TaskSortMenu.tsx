import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { SORT_CONFIG, SORT_OPTIONS } from "../../core/task-sort";
import { useUIStore } from "../../store/ui-store";

interface TaskSortMenuProps {
  disabled?: boolean;
}

export default function TaskSortMenu({ disabled = false }: TaskSortMenuProps) {
  const sortBy = useUIStore((s) => s.taskSortBy);
  const sortOrder = useUIStore((s) => s.taskSortOrder);
  const setSortBy = useUIStore((s) => s.setTaskSortBy);
  const setSortOrder = useUIStore((s) => s.setTaskSortOrder);

  const currentConfig = SORT_CONFIG[sortBy] ?? SORT_CONFIG.default;
  const currentSortLabel = currentConfig.label;
  const currentOrderLabel =
    currentConfig.orderOptions.find((o) => o.value === sortOrder)?.label ??
    currentConfig.orderOptions[0]?.label ??
    "";
  const orderRowLabel = sortBy === "default" ? "Mode" : "Order";

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="default"
            disabled={disabled}
            className="gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            aria-label="Sort tasks"
          >
            <ArrowUpDown className="size-4" />
            <span className="hidden sm:inline">Sort</span>
          </Button>
        }
      />
      <PopoverContent align="end" sideOffset={6} className="w-72 p-3.5">
        <div className="space-y-3">
          {/* Sort by Row */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">Sort by</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="default"
                    className="h-9 px-3 text-sm font-normal gap-2 min-w-[135px] justify-between rounded-lg shadow-none"
                    aria-label="Select sort field"
                  >
                    <span className="truncate">{currentSortLabel}</span>
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                {SORT_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className="text-sm justify-between"
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.value && (
                      <Check className="size-4 text-foreground ml-auto" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Order Row */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">
              {orderRowLabel}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="default"
                    className="h-9 px-3 text-sm font-normal gap-2 min-w-[135px] justify-between rounded-lg shadow-none"
                    aria-label="Select sort order"
                  >
                    <span className="truncate">{currentOrderLabel}</span>
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                {currentConfig.orderOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setSortOrder(opt.value)}
                    className="text-sm justify-between"
                  >
                    <span>{opt.label}</span>
                    {sortOrder === opt.value && (
                      <Check className="size-4 text-foreground ml-auto" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

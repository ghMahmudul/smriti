import { Check, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PRIORITY_MUTED_COLORS, PRIORITY_OPTIONS } from "../../core/constants";
import type { Priority } from "../../core/types";

interface PrioritySelectProps {
  value: Priority | undefined;
  onChange: (priority: Priority | undefined) => void;
  variant?: "toolbar" | "inline";
  isDone?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function PrioritySelect({
  value,
  onChange,
  variant = "toolbar",
  isDone = false,
  open,
  onOpenChange,
}: PrioritySelectProps) {
  const selected = PRIORITY_OPTIONS.find((p) => p.value === value);

  const colorClass = selected
    ? isDone
      ? PRIORITY_MUTED_COLORS[selected.value]
      : selected.color
    : "text-muted-foreground";

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 gap-1.5 ${colorClass}`}
          />
        }
      >
        <Flag className={variant === "inline" ? "size-3.5" : "size-4"} />
        {selected && <span>{selected.label}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {PRIORITY_OPTIONS.map((opt) => (
          <DropdownMenuItem key={opt.value} onClick={() => onChange(opt.value)}>
            <Flag className={`size-4 ${opt.color}`} />
            <span className="text-foreground">{opt.label}</span>
            {value === opt.value && (
              <Check className="size-4 text-muted-foreground ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => onChange(undefined)}>
          <Flag className="size-4 text-muted-foreground" />
          <span className="text-foreground">None</span>
          {!value && <Check className="size-4 text-muted-foreground ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

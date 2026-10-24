import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sidebarItemState } from "./sidebar-item";

interface SidebarViewProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  isActive: boolean;
  layout?: "row" | "card";
  onClick: () => void;
}

export default function SidebarView({
  icon: Icon,
  label,
  count,
  isActive,
  layout = "row",
  onClick,
}: SidebarViewProps) {
  if (layout === "card") {
    return (
      <Button
        variant="outline"
        onClick={onClick}
        className={`flex flex-col items-start py-2.5 px-2.5 rounded-lg text-sm h-auto transition-all duration-150 ${sidebarItemState(isActive, { bordered: true })}`}
      >
        <div className="flex items-center justify-between w-full mb-1">
          <Icon className="size-4 shrink-0" />
          {count !== undefined && count > 0 && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {count}
            </span>
          )}
        </div>
        <span className="text-sm font-medium truncate">{label}</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`w-full justify-start gap-2 pl-3 pr-1 py-2 h-auto min-h-9 text-sm rounded-lg transition-colors duration-150 ${sidebarItemState(isActive)}`}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 text-left truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="flex w-8 shrink-0 items-center justify-center text-xs text-muted-foreground tabular-nums">
          {count}
        </span>
      )}
    </Button>
  );
}

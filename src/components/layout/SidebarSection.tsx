import { ChevronDown, type LucideIcon, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SidebarSectionItem from "./SidebarSectionItem";

export interface SidebarSectionProps {
  title: string;
  storageKey?: string;
  icon?: LucideIcon;
  items?: string[];
  activeView?: string;
  type?: "project" | "tag";
  getTaskCount?: (name: string) => number;
  getItemIcon?: (name: string) => LucideIcon;
  onNavigate?: (name: string) => void;
  onAdd?: () => void;
  onEdit?: (name: string) => void;
  onRename?: (name: string) => void;
  onPin?: (name: string) => void;
  isItemPinned?: (name: string) => boolean;
  onDelete?: (name: string) => void;
  onToggleCollapse?: (isCollapsed: boolean) => void;
  className?: string;
  children?: React.ReactNode;
}

export default function SidebarSection({
  title,
  storageKey,
  icon: Icon,
  items,
  activeView,
  type,
  getTaskCount,
  getItemIcon,
  onNavigate,
  onAdd,
  onEdit,
  onRename,
  onPin,
  isItemPinned,
  onDelete,
  onToggleCollapse,
  className,
  children,
}: SidebarSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (!storageKey) return false;
    return localStorage.getItem(storageKey) === "true";
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (storageKey) {
        localStorage.setItem(storageKey, String(next));
      }
      onToggleCollapse?.(next);
      return next;
    });
  };

  const singularTitle = title.toLowerCase().replace(/s$/, "");

  return (
    <div className={className}>
      <div className="group flex items-center justify-between pl-3 pr-0 mb-1 rounded-lg hover:bg-sidebar-accent transition-colors duration-150">
        <Button
          variant="ghost"
          onClick={toggleCollapsed}
          aria-expanded={!isCollapsed}
          aria-label={
            isCollapsed
              ? `Expand ${title.toLowerCase()}`
              : `Collapse ${title.toLowerCase()}`
          }
          className="flex flex-1 items-center justify-start gap-0.5 h-8 px-0 rounded-lg hover:bg-transparent aria-expanded:bg-transparent"
        >
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-200 ease-out group-hover:opacity-100",
              isCollapsed && "-rotate-90",
            )}
          />
        </Button>
        {onAdd && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 hover:text-sidebar-foreground active:text-sidebar-foreground focus-visible:text-sidebar-foreground"
            onClick={onAdd}
            aria-label={`Add ${singularTitle}`}
          >
            <Plus className="size-4" />
          </Button>
        )}
      </div>

      {!isCollapsed && (
        <div className="space-y-0.5">
          {children ??
            (items &&
              Icon &&
              type &&
              items.map((item) => {
                const itemIcon = getItemIcon ? getItemIcon(item) : Icon;
                return (
                  <SidebarSectionItem
                    key={item}
                    icon={itemIcon}
                    name={item}
                    count={getTaskCount?.(item)}
                    isActive={activeView === `${type}:${item}`}
                    onClick={() => onNavigate?.(item)}
                    onEdit={() => (onEdit || onRename)?.(item)}
                    onPin={onPin ? () => onPin(item) : undefined}
                    isPinned={isItemPinned?.(item)}
                    onDelete={() => onDelete?.(item)}
                  />
                );
              }))}
        </div>
      )}
    </div>
  );
}

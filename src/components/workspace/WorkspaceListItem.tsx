import { Check, Folder, HardDrive, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { WorkspaceEntry } from "@/core/types";
import { cn } from "@/lib/utils";
import ProjectContextMenu from "../layout/ProjectContextMenu";
import { sidebarItemState } from "../layout/sidebar-item";

export interface WorkspaceListItemProps {
  workspace: WorkspaceEntry;
  isActive: boolean;
  disabled?: boolean;
  onClick: () => void;
  onRename?: () => void;
  onDelete: () => void;
  className?: string;
}

export default function WorkspaceListItem({
  workspace,
  isActive,
  disabled,
  onClick,
  onRename,
  onDelete,
  className,
}: WorkspaceListItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={cn("group relative flex items-center", className)}>
      <Button
        variant="ghost"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "w-full justify-start items-start gap-2.5 pl-3 pr-10 py-2 h-auto text-sm rounded-lg max-md:rounded-none font-normal",
          sidebarItemState(isActive),
          !isActive && "group-hover:bg-sidebar-accent",
          menuOpen && !isActive && "bg-sidebar-accent text-sidebar-foreground",
        )}
      >
        {workspace.mode === "file-system" ? (
          <Folder className="size-4 text-muted-foreground shrink-0 mt-0.5" />
        ) : (
          <HardDrive className="size-4 text-muted-foreground shrink-0 mt-0.5" />
        )}
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate block">
              {workspace.name}
            </span>
            {isActive && <Check className="size-3.5 text-primary shrink-0" />}
          </div>
          <span className="text-xs text-muted-foreground block truncate font-mono">
            {workspace.mode === "file-system"
              ? workspace.path || `/${workspace.name}`
              : "Local Storage"}
          </span>
        </div>
      </Button>

      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex size-8 shrink-0 items-center justify-center pointer-events-none">
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-150",
            menuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto has-[:focus-visible]:opacity-100 has-[:focus-visible]:pointer-events-auto max-md:opacity-100 max-md:pointer-events-auto",
          )}
        >
          <ProjectContextMenu
            open={menuOpen}
            onOpenChange={setMenuOpen}
            onRename={onRename}
            onDelete={onDelete}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              aria-label={`Options for ${workspace.name}`}
              className={cn(
                "size-7 rounded-full text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-foreground/10 active:bg-sidebar-foreground/10 aria-expanded:bg-sidebar-foreground/10",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar focus-visible:outline-none",
                menuOpen && "bg-sidebar-foreground/10 text-sidebar-foreground",
              )}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </ProjectContextMenu>
        </div>
      </div>
    </div>
  );
}

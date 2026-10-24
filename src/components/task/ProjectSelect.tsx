import { Check, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getProjectIcon } from "@/core/icons";
import { useWorkspaceStore } from "@/store/workspace-store";

interface ProjectSelectProps {
  value: string;
  onChange: (projectId: string) => void;
  projects: string[];
  variant?: "toolbar" | "inline";
  isDone?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ProjectSelect({
  value,
  onChange,
  projects,
  variant = "toolbar",
  isDone = false,
  open,
  onOpenChange,
}: ProjectSelectProps) {
  const settings = useWorkspaceStore((s) => s.settings);
  const isInbox = value.toLowerCase() === "inbox";
  const ValueIcon = getProjectIcon(value, settings?.projectIcons);

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 gap-1.5 ${isDone ? "text-muted-foreground" : ""}`}
          />
        }
      >
        <ValueIcon
          className={`${variant === "inline" ? "size-3.5" : "size-4"} text-muted-foreground`}
        />
        <span className="max-w-24 truncate">{isInbox ? "Inbox" : value}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuItem onClick={() => onChange("Inbox")}>
          <Inbox className="size-4 text-muted-foreground" />
          <span className="text-foreground">Inbox</span>
          {isInbox && (
            <Check className="size-4 text-muted-foreground ml-auto" />
          )}
        </DropdownMenuItem>
        {projects.map((p) => {
          const PIcon = getProjectIcon(p, settings?.projectIcons);
          return (
            <DropdownMenuItem key={p} onClick={() => onChange(p)}>
              <PIcon className="size-4 text-muted-foreground" />
              <span className="text-foreground truncate min-w-0 flex-1">
                {p}
              </span>
              {value === p && (
                <Check className="size-4 text-muted-foreground ml-auto" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

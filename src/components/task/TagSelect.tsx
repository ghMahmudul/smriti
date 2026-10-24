import { Check, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTagIcon } from "@/core/icons";
import { useWorkspaceStore } from "@/store/workspace-store";

interface TagSelectProps {
  value: string[];
  onChange: (tags: string[]) => void;
  availableTags: string[];
  variant?: "toolbar" | "inline";
  isDone?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function TagSelect({
  value,
  onChange,
  availableTags,
  variant = "toolbar",
  isDone = false,
  open,
  onOpenChange,
}: TagSelectProps) {
  const settings = useWorkspaceStore((s) => s.settings);

  const handleToggle = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  };

  const hasTags = value.length > 0;
  const firstTag = value[0];
  const TriggerIcon =
    value.length === 1 && firstTag
      ? getTagIcon(firstTag, settings?.tagIcons)
      : Tag;

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size={!hasTags && variant === "toolbar" ? "icon" : "sm"}
            className={`${
              !hasTags && variant === "toolbar" ? "size-8" : "h-8 gap-1.5"
            } ${isDone ? "text-muted-foreground" : ""}`}
          />
        }
      >
        <TriggerIcon
          className={`${variant === "inline" ? "size-3.5" : "size-4"} ${
            !hasTags || isDone ? "text-muted-foreground" : ""
          }`}
        />
        {hasTags && (
          <span>{`${value.length} tag${value.length !== 1 ? "s" : ""}`}</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 max-h-48 overflow-y-auto"
      >
        {availableTags.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No tags yet
          </div>
        ) : (
          availableTags.map((tag) => {
            const ItemIcon = getTagIcon(tag, settings?.tagIcons);
            return (
              <DropdownMenuItem key={tag} onClick={() => handleToggle(tag)}>
                <ItemIcon className="size-4 text-muted-foreground" />
                <span className="text-foreground truncate min-w-0 flex-1">
                  {tag}
                </span>
                {value.includes(tag) && (
                  <Check className="size-4 text-muted-foreground ml-auto" />
                )}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

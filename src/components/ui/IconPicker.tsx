import { Search, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type IconDefinition, searchIcons } from "@/core/icons";
import { cn } from "@/lib/utils";

export interface IconPickerProps {
  selectedIcon?: string | null;
  defaultIconId?: string;
  onSelect: (iconId: string | undefined) => void;
  className?: string;
}

export function IconPicker({
  selectedIcon,
  defaultIconId = "folder",
  onSelect,
  className,
}: IconPickerProps) {
  const [search, setSearch] = useState("");
  const searchInputId = useId();

  const filteredIcons = useMemo(() => {
    return searchIcons(search);
  }, [search]);

  const activeIconId = (selectedIcon || defaultIconId).toLowerCase().trim();

  const handleSelect = (iconId: string) => {
    if (defaultIconId && iconId.toLowerCase() === defaultIconId.toLowerCase()) {
      onSelect(undefined);
    } else {
      onSelect(iconId);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2.5 w-64 sm:w-72", className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          id={searchInputId}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons..."
          className="pl-8.5 pr-8 h-8.5 text-xs rounded-lg"
          autoComplete="off"
          autoFocus
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <ScrollArea className="h-56 pr-2">
        {filteredIcons.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center text-xs text-muted-foreground">
            No icons found
          </div>
        ) : (
          <div className="grid grid-cols-6 sm:grid-cols-7 gap-1">
            {filteredIcons.map((item: IconDefinition) => {
              const IconComp = item.icon;
              const isSelected = activeIconId === item.id.toLowerCase();
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  title={item.name}
                  aria-label={item.name}
                  className={cn(
                    "flex items-center justify-center size-8 rounded-lg transition-colors duration-100",
                    isSelected
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <IconComp className="size-4" />
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { ShortcutItem } from "./task-shortcut-types";

export interface TaskShortcutDropdownProps {
  isOpen: boolean;
  items: ShortcutItem[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onHoverIndex: (index: number) => void;
  onClose: () => void;
  position: { top: number; left: number };
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export default function TaskShortcutDropdown({
  isOpen,
  items,
  activeIndex,
  onSelectIndex,
  onHoverIndex,
  onClose,
  position,
  textareaRef,
}: TaskShortcutDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        textareaRef.current &&
        !textareaRef.current.contains(target)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onClose, textareaRef]);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      id="task-shortcut-dropdown"
      role="listbox"
      aria-label="Shortcut suggestions"
      tabIndex={-1}
      data-slot="dropdown-menu-content"
      className="absolute z-50 w-48 min-w-48 rounded-xl bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/5 outline-none duration-150 ease-out dark:ring-foreground/10"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="max-h-48 overflow-y-auto space-y-0.5 [-ms-overflow-style:none] scrollbar-none">
        {items.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No options found
          </div>
        ) : (
          items.map((item, index) => {
            const isSelected = index === activeIndex;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`shortcut-opt-${item.id}`}
                type="button"
                role="option"
                data-slot="dropdown-menu-item"
                data-highlighted={isSelected ? "true" : undefined}
                aria-selected={isSelected}
                data-active={isSelected}
                ref={isSelected ? activeItemRef : undefined}
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectIndex(index);
                }}
                onMouseEnter={() => onHoverIndex(index)}
                className={cn(
                  "group/dropdown-menu-item relative flex w-full cursor-pointer items-center justify-start text-left gap-2.5 rounded-md px-2 py-2 text-sm font-normal outline-hidden select-none transition-colors duration-100 ease-out focus:bg-foreground/10 hover:bg-foreground/10",
                  isSelected && "bg-foreground/10",
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      item.color ?? "text-muted-foreground",
                    )}
                  />
                )}
                <span className="text-foreground truncate min-w-0 flex-1 text-left">
                  {item.label}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

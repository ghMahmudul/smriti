import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconPicker } from "./IconPicker";

export interface IconPickerPopoverProps {
  children: React.ReactElement;
  currentIcon?: string | null;
  defaultIconId?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  onSelect: (iconId: string | undefined) => void;
}

export function IconPickerPopover({
  children,
  currentIcon,
  defaultIconId,
  align = "start",
  side = "bottom",
  sideOffset = 6,
  onSelect,
}: IconPickerPopoverProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (iconId: string | undefined) => {
    onSelect(iconId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={children} />
      <PopoverContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="w-auto p-3 z-60"
        onClick={(e) => e.stopPropagation()}
      >
        <IconPicker
          selectedIcon={currentIcon}
          defaultIconId={defaultIconId}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

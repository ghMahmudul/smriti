import { zodResolver } from "@hookform/resolvers/zod";
import { type LucideIcon, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconPickerPopover } from "@/components/ui/IconPickerPopover";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { getIconComponent } from "@/core/icons";
import { type RenameFormData, renameSchema } from "../../core/schemas";

export interface TextInputModalProps {
  title: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  icon: LucideIcon;
  defaultIconId?: string;
  currentIcon?: string | null;
  showIconPicker?: boolean;
  toastId: string;
  allowSameValue?: boolean;
  onClose: () => void;
  onSubmit: (value: string, icon?: string | null) => void | Promise<void>;
}

export function TextInputModal({
  title,
  placeholder = "Name",
  initialValue = "",
  submitLabel = "Submit",
  icon: Icon,
  defaultIconId,
  currentIcon,
  showIconPicker = false,
  toastId,
  allowSameValue = false,
  onClose,
  onSubmit: onFormSubmit,
}: TextInputModalProps) {
  const effectiveDefaultId = defaultIconId || (Icon === Tag ? "tag" : "folder");
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(
    currentIcon ?? undefined,
  );

  const { register, handleSubmit, reset, watch } = useForm<RenameFormData>({
    resolver: zodResolver(renameSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { name: initialValue },
  });

  useEffect(() => {
    reset({ name: initialValue });
    setSelectedIcon(currentIcon ?? undefined);
  }, [initialValue, currentIcon, reset]);

  const nameValue = watch("name") ?? "";
  const trimmed = nameValue.trim();
  const isIconChanged = selectedIcon !== (currentIcon ?? undefined);
  const isChanged = allowSameValue || trimmed !== initialValue || isIconChanged;
  const canSubmit = isChanged && trimmed.length > 0;

  useEffect(() => {
    return () => {
      toast.dismiss(toastId);
    };
  }, [toastId]);

  const handleValidSubmit = async (data: RenameFormData) => {
    const value = data.name.trim();
    if (!allowSameValue && value === initialValue && !isIconChanged) return;
    toast.dismiss(toastId);
    try {
      if (isIconChanged) {
        await onFormSubmit(value, selectedIcon ?? null);
      } else if (selectedIcon) {
        await onFormSubmit(value, selectedIcon);
      } else {
        await onFormSubmit(value);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : `Failed to ${submitLabel.toLowerCase()}`;
      toast.error(message, { id: toastId });
    }
  };

  const handleError = (errors: FieldErrors<RenameFormData>) => {
    if (errors.name?.message && errors.name.message !== "Name is required") {
      toast.error(errors.name.message, { id: toastId });
    }
  };

  const SelectedIconComponent = getIconComponent(selectedIcon, Icon);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5 text-muted-foreground" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleValidSubmit, handleError)}>
          <div className="flex items-center gap-2">
            {showIconPicker && (
              <IconPickerPopover
                currentIcon={selectedIcon}
                defaultIconId={effectiveDefaultId}
                onSelect={setSelectedIcon}
              >
                <Button
                  type="button"
                  variant="outline"
                  className="size-9 p-0 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Choose icon"
                  aria-label="Choose icon"
                >
                  <SelectedIconComponent className="size-4" />
                </Button>
              </IconPickerPopover>
            )}
            <Input
              {...register("name")}
              placeholder={placeholder}
              aria-label={title}
              autoFocus
              className="flex-1"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

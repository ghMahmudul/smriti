import type { LucideIcon } from "lucide-react";
import { Pencil } from "lucide-react";
import { TextInputModal } from "@/components/ui/TextInputModal";

interface RenameModalProps {
  title?: string;
  currentName: string;
  currentIcon?: string;
  defaultIconId?: string;
  icon?: LucideIcon;
  showIconPicker?: boolean;
  submitLabel?: string;
  onClose: () => void;
  onRename: (newName: string, newIcon?: string | null) => void | Promise<void>;
}

export default function RenameModal({
  title = "Edit Project",
  currentName,
  currentIcon,
  defaultIconId,
  icon = Pencil,
  showIconPicker = true,
  submitLabel,
  onClose,
  onRename,
}: RenameModalProps) {
  const effectiveSubmitLabel =
    submitLabel ?? (title.toLowerCase().includes("rename") ? "Rename" : "Save");

  return (
    <TextInputModal
      title={title}
      initialValue={currentName}
      currentIcon={currentIcon}
      defaultIconId={defaultIconId}
      placeholder="Name"
      icon={icon}
      showIconPicker={showIconPicker}
      submitLabel={effectiveSubmitLabel}
      toastId="rename-modal-name-error"
      allowSameValue={false}
      onClose={onClose}
      onSubmit={onRename}
    />
  );
}

import type { LucideIcon } from "lucide-react";
import { Folder } from "lucide-react";
import { TextInputModal } from "@/components/ui/TextInputModal";

interface CreateProjectModalProps {
  title?: string;
  placeholder?: string;
  icon?: LucideIcon;
  defaultIconId?: string;
  currentIcon?: string;
  showIconPicker?: boolean;
  onClose: () => void;
  onCreate: (name: string, icon?: string | null) => void | Promise<void>;
}

export default function CreateProjectModal({
  title = "New Project",
  placeholder = "Project name",
  icon = Folder,
  defaultIconId,
  currentIcon,
  showIconPicker = true,
  onClose,
  onCreate,
}: CreateProjectModalProps) {
  return (
    <TextInputModal
      title={title}
      placeholder={placeholder}
      icon={icon}
      defaultIconId={defaultIconId}
      currentIcon={currentIcon}
      showIconPicker={showIconPicker}
      submitLabel="Create"
      toastId="create-modal-name-error"
      allowSameValue={true}
      onClose={onClose}
      onSubmit={onCreate}
    />
  );
}

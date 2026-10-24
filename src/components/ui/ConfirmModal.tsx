import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmModalProps {
  open?: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?:
    | "default"
    | "destructive"
    | "destructive-solid"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  isLoading?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export default function ConfirmModal({
  open = true,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  isLoading = false,
  disabled = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const loading = isLoading || internalSubmitting;
  const isActionDisabled = disabled || loading;

  const handleConfirm = async () => {
    if (isActionDisabled) return;
    try {
      const result = onConfirm();
      if (result instanceof Promise) {
        setInternalSubmitting(true);
        await result;
      }
    } finally {
      setInternalSubmitting(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !loading) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader className="text-left place-items-start">
          <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={confirmVariant}
            disabled={isActionDisabled}
            onClick={handleConfirm}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

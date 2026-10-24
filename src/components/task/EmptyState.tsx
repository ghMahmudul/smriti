import type { LucideIcon } from "lucide-react";
import { useDelayedVisibility } from "../../hooks/useDelayedVisibility";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
}

export default function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  const visible = useDelayedVisibility(10);

  return (
    <div
      className={`flex flex-col items-center justify-center h-full text-center px-4 transition-opacity duration-150 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="size-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <Icon className="size-10 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

import { Toaster as Sonner, toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspace-store";

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster({ position = "top-right", ...props }: ToasterProps) {
  const theme = useWorkspaceStore((s) => s.settings?.theme ?? "system");

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={position}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster, toast };

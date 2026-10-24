import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSidebar } from "../layout/Layout";
import { SETTINGS_SECTIONS } from "./sections";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { isMobile } = useSidebar();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const active =
    SETTINGS_SECTIONS.find((s) => s.id === activeSection) ??
    SETTINGS_SECTIONS[0];
  if (!active) return null;
  const ActiveComponent = active.component;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        initialFocus={isMobile ? false : undefined}
        closeButtonClassName={isMobile ? "top-4 right-5" : undefined}
        viewportClassName={isMobile ? "p-0" : undefined}
        className={cn(
          isMobile
            ? "inset-0 top-0 left-0 translate-x-0 translate-y-0 w-full max-w-none h-dvh rounded-none ring-0 border-0 shadow-none"
            : "sm:max-w-4xl sm:h-auto sm:rounded-xl",
          "p-0 gap-0 overflow-hidden",
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        {isMobile ? (
          <div className="flex flex-col h-full overflow-hidden bg-muted/40 dark:bg-background">
            <div className="flex items-center justify-between px-5 pt-6 pb-2 shrink-0 pr-14">
              <h1 className="font-heading text-xl font-semibold text-foreground">
                Settings
              </h1>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {SETTINGS_SECTIONS.map((section) => {
                const SectionComponent = section.component;
                return (
                  <div
                    key={section.id}
                    className="space-y-1.5 w-full max-w-sm mx-auto"
                  >
                    <div className="px-1 flex items-center gap-1.5">
                      <section.icon className="size-3.5 text-muted-foreground" />
                      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {section.label}
                      </h2>
                    </div>
                    <div className="w-full rounded-xl border border-border/50 bg-card dark:bg-sidebar-accent overflow-hidden shadow-xs">
                      <SectionComponent />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-row h-[min(35rem,85vh)]">
            <nav className="w-56 shrink-0 flex flex-col gap-1 border-r p-3 overflow-y-auto h-full">
              <p className="px-2 py-1.5 text-sm font-medium">Settings</p>
              {SETTINGS_SECTIONS.map((s) => (
                <Button
                  key={s.id}
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveSection(s.id)}
                  className={`justify-start gap-2 rounded-lg ${active.id === s.id ? "bg-muted" : ""}`}
                >
                  <s.icon className="size-4" />
                  {s.label}
                </Button>
              ))}
            </nav>

            <div className="flex-1 min-w-0 flex flex-col overflow-y-auto p-6 h-full">
              <h2 className="font-heading text-lg font-medium mb-4">
                {active.label}
              </h2>
              <ActiveComponent />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWorkspaceStore } from "../../../store/workspace-store";

export default function AppearanceSection() {
  const theme = useWorkspaceStore((s) => s.settings.theme);
  const sprinkleEffect = useWorkspaceStore(
    (s) => s.settings.sprinkleEffect ?? true,
  );
  const setSettings = useWorkspaceStore((s) => s.setSettings);

  return (
    <div>
      <div className="p-3.5 sm:px-0 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
        <Label className="text-sm font-medium">Theme</Label>
        <div className="flex gap-2 w-56">
          {(["light", "dark", "system"] as const).map((t) => (
            <Button
              key={t}
              type="button"
              variant={theme === t ? "default" : "outline"}
              className="flex-1"
              onClick={() => setSettings({ theme: t })}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      <div className="p-3.5 sm:px-0 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
        <Label htmlFor="task-sprinkles" className="text-sm font-medium">
          Task completion sprinkles
        </Label>
        <Switch
          id="task-sprinkles"
          checked={sprinkleEffect}
          onCheckedChange={(checked) =>
            setSettings({ sprinkleEffect: checked })
          }
        />
      </div>
    </div>
  );
}

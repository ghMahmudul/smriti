import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWorkspaceStore } from "../../../store/workspace-store";

export default function ViewsSection() {
  const settings = useWorkspaceStore((s) => s.settings);
  const setSettings = useWorkspaceStore((s) => s.setSettings);

  return (
    <div>
      <div className="p-3.5 sm:px-0 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
        <Label htmlFor="show-completed" className="text-sm font-medium">
          Show Completed
        </Label>
        <Switch
          id="show-completed"
          checked={settings.showCompleted}
          onCheckedChange={(checked) => setSettings({ showCompleted: checked })}
        />
      </div>
      <div className="p-3.5 sm:px-0 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
        <Label htmlFor="show-archived" className="text-sm font-medium">
          Show Archived
        </Label>
        <Switch
          id="show-archived"
          checked={settings.showArchived}
          onCheckedChange={(checked) => setSettings({ showArchived: checked })}
        />
      </div>
      <div className="p-3.5 sm:px-0 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
        <Label htmlFor="show-trash" className="text-sm font-medium">
          Show Trash
        </Label>
        <Switch
          id="show-trash"
          checked={settings.showTrash}
          onCheckedChange={(checked) => setSettings({ showTrash: checked })}
        />
      </div>
    </div>
  );
}

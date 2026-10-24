import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspaceStore } from "../../../store/workspace-store";

const VIEW_OPTIONS = [
  { value: "all", label: "All" },
  { value: "inbox", label: "Inbox" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
  { value: "trash", label: "Trash" },
];

export default function GeneralSection() {
  const settings = useWorkspaceStore((s) => s.settings);
  const setSettings = useWorkspaceStore((s) => s.setSettings);
  const mode = useWorkspaceStore((s) => s.mode);
  const workspaceName = useWorkspaceStore((s) => s.workspaceName);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const renameWorkspace = useWorkspaceStore((s) => s.renameWorkspace);
  const [name, setName] = useState(workspaceName);

  useEffect(() => {
    setName(workspaceName);
  }, [workspaceName]);

  const saveName = () => {
    const trimmed = name.trim();
    if (trimmed && currentWorkspaceId && trimmed !== workspaceName) {
      renameWorkspace(currentWorkspaceId, trimmed);
    } else {
      setName(workspaceName);
    }
  };

  return (
    <div>
      <div className="p-3.5 sm:px-0 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
        <Label htmlFor="settings-name" className="text-sm font-medium">
          Workspace name
        </Label>
        {mode === "file-system" ? (
          <span className="text-sm text-muted-foreground truncate max-w-40">
            {workspaceName}
          </span>
        ) : (
          <Input
            id="settings-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-40"
          />
        )}
      </div>
      <div className="p-3.5 sm:px-0 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
        <Label className="text-sm font-medium">Default view</Label>
        <Select
          value={settings.defaultView ?? "all"}
          onValueChange={(value) => {
            if (value) setSettings({ defaultView: value });
          }}
        >
          <SelectTrigger className="w-40" aria-label="Default view">
            <SelectValue>
              {(value: string | null) =>
                VIEW_OPTIONS.find((o) => o.value === (value ?? "all"))?.label ??
                value
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {VIEW_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

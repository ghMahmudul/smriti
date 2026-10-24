import { FolderOpen, FolderSearch, Folders } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "../../store/task-store";
import { useWorkspaceStore } from "../../store/workspace-store";

export default function ReconnectScreen() {
  const { rebindWorkspaceFolder, setView, workspaceName } = useWorkspaceStore();
  const { loadFiles } = useTaskStore();
  const navigate = useNavigate();

  useEffect(() => {
    window.history.replaceState(null, "", "/");
  }, []);

  const handleLocate = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      const adapter = await rebindWorkspaceFolder(dirHandle);
      if (adapter) {
        const wsId = useWorkspaceStore.getState().currentWorkspaceId;
        await loadFiles(adapter, wsId);
      }
    } catch {
      // Picker cancelled or open failed — stay on this screen so the user
      // can retry locating the folder or manage workspaces.
    }
  };

  const handleManage = () => {
    setView("picker");
    navigate("/workspaces");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <FolderSearch className="size-12 text-muted-foreground mx-auto mb-6" />

        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Workspace unavailable
        </h1>
        <p className="text-muted-foreground mb-8">
          {workspaceName
            ? `"${workspaceName}" couldn't be opened. The folder may have been renamed, moved, or deleted — or access wasn't granted.`
            : "Your workspace couldn't be opened. The folder may have been renamed, moved, or deleted — or access wasn't granted."}
        </p>

        <div className="flex flex-col gap-3">
          <Button onClick={handleLocate} className="gap-2">
            <FolderOpen className="size-4" />
            Locate folder
          </Button>

          <Button variant="outline" onClick={handleManage} className="gap-2">
            <Folders className="size-4" />
            Manage workspaces
          </Button>
        </div>
      </div>
    </div>
  );
}

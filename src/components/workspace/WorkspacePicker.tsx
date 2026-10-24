import {
  Folder,
  FolderOpen,
  FolderPlus,
  FolderSearch,
  HardDrive,
  Info,
  ServerCog,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import type { WorkspaceEntry } from "../../core/types";
import { useTaskStore } from "../../store/task-store";
import { useUIStore } from "../../store/ui-store";
import { useWorkspaceStore } from "../../store/workspace-store";
import ConfirmModal from "../ui/ConfirmModal";
import RenameModal from "../ui/RenameModal";
import SmritiIcon from "../ui/SmritiIcon";
import WorkspaceListItem from "./WorkspaceListItem";

function getSafeErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  if (error.name === "AbortError") return fallback;
  if (error.name === "NotFoundError")
    return "The selected folder could not be found.";
  if (error.name === "NotAllowedError")
    return "Permission was denied. Please grant access and try again.";
  if (error.name === "SecurityError")
    return "A security error occurred. Please try again.";
  return fallback;
}

export default function WorkspacePicker() {
  const supportsFileSystem =
    typeof window !== "undefined" && "showDirectoryPicker" in window;

  const navigate = useNavigate();
  const mode = useWorkspaceStore((s) => s.mode);

  const {
    createWorkspace,
    openWorkspace,
    connectLocalStorage,
    switchWorkspace,
    removeWorkspace,
    renameWorkspace,
    workspaces,
    currentWorkspaceId,
    setView,
  } = useWorkspaceStore();
  const { loadFiles } = useTaskStore();

  useEffect(() => {
    setView("picker");
  }, [setView]);

  const handleReturnToWorkspace = useCallback(() => {
    useUIStore.getState().closeMobileSidebar();
    setView("main");
    const defaultView =
      useWorkspaceStore.getState().settings.defaultView || "all";
    navigate(`/${defaultView}`);
  }, [setView, navigate]);

  const [creationModal, setCreationModal] = useState<"folder" | "local" | null>(
    null,
  );
  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedFolderHandle, setSelectedFolderHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceRenameTarget, setWorkspaceRenameTarget] =
    useState<WorkspaceEntry | null>(null);
  const [workspaceDeleteTarget, setWorkspaceDeleteTarget] =
    useState<WorkspaceEntry | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        !creationModal &&
        !workspaceRenameTarget &&
        !workspaceDeleteTarget &&
        mode &&
        currentWorkspaceId
      ) {
        handleReturnToWorkspace();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    creationModal,
    workspaceRenameTarget,
    workspaceDeleteTarget,
    mode,
    currentWorkspaceId,
    handleReturnToWorkspace,
  ]);

  const hasExisting = workspaces.length > 0;

  const fullWorkspacePath = selectedFolderHandle
    ? `/${selectedFolderHandle.name}/${workspaceName.trim()}`
    : "";

  const resetForm = () => {
    setWorkspaceName("");
    setSelectedFolderHandle(null);
    setError(null);
  };

  const handleCloseModal = () => {
    resetForm();
    setCreationModal(null);
  };

  const handleOpenCreateFolder = () => {
    resetForm();
    setCreationModal("folder");
  };

  const handleOpenCreateLocal = () => {
    resetForm();
    setCreationModal("local");
  };

  const handleQuickStart = async () => {
    const defaultName = "Smriti";
    try {
      setIsLoading(true);
      setError(null);
      if (supportsFileSystem) {
        const parentHandle = await window.showDirectoryPicker();
        const folderHandle = await parentHandle.getDirectoryHandle(
          defaultName,
          {
            create: true,
          },
        );
        const fullPath = `/${parentHandle.name}/${defaultName}`;
        const adapter = await createWorkspace(
          defaultName,
          folderHandle,
          fullPath,
        );
        const wsId = useWorkspaceStore.getState().currentWorkspaceId;
        await loadFiles(adapter, wsId);
        useUIStore.getState().closeMobileSidebar();
        handleReturnToWorkspace();
      } else {
        const adapter = await connectLocalStorage(defaultName);
        const wsId = useWorkspaceStore.getState().currentWorkspaceId;
        await loadFiles(adapter, wsId);
        useUIStore.getState().closeMobileSidebar();
        handleReturnToWorkspace();
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(getSafeErrorMessage(e, "Failed to start workspace"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenExisting = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const handle = await window.showDirectoryPicker();
      const fullPath = `/${handle.name}`;
      const adapter = await openWorkspace(handle, fullPath);
      const wsId = useWorkspaceStore.getState().currentWorkspaceId;
      await loadFiles(adapter, wsId);
      useUIStore.getState().closeMobileSidebar();
      handleReturnToWorkspace();
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(getSafeErrorMessage(e, "Failed to open workspace"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocateFolder = async () => {
    try {
      setError(null);
      const handle = await window.showDirectoryPicker();
      setSelectedFolderHandle(handle);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(getSafeErrorMessage(e, "Failed to select folder"));
    }
  };

  const handleCreateFolderWorkspace = async () => {
    const name = workspaceName.trim();
    if (!name) return;
    try {
      setIsLoading(true);
      setError(null);
      let parentHandle = selectedFolderHandle;
      if (!parentHandle) {
        parentHandle = await window.showDirectoryPicker();
        setSelectedFolderHandle(parentHandle);
      }
      const folderHandle = await parentHandle.getDirectoryHandle(name, {
        create: true,
      });
      const finalPath = `/${parentHandle.name}/${name}`;
      const adapter = await createWorkspace(name, folderHandle, finalPath);
      const wsId = useWorkspaceStore.getState().currentWorkspaceId;
      await loadFiles(adapter, wsId);
      handleCloseModal();
      useUIStore.getState().closeMobileSidebar();
      handleReturnToWorkspace();
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(getSafeErrorMessage(e, "Failed to create workspace"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLocalStorage = async () => {
    const name = workspaceName.trim();
    if (!name) return;
    try {
      setIsLoading(true);
      setError(null);
      const adapter = await connectLocalStorage(name);
      const wsId = useWorkspaceStore.getState().currentWorkspaceId;
      await loadFiles(adapter, wsId);
      handleCloseModal();
      useUIStore.getState().closeMobileSidebar();
      handleReturnToWorkspace();
    } catch (e) {
      setError(getSafeErrorMessage(e, "Failed to use local storage"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitch = async (w: WorkspaceEntry) => {
    if (w.id === currentWorkspaceId) {
      handleReturnToWorkspace();
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const adapter = await switchWorkspace(w.id);
      if (adapter) {
        await loadFiles(
          adapter,
          useWorkspaceStore.getState().currentWorkspaceId,
        );
        useUIStore.getState().closeMobileSidebar();
        handleReturnToWorkspace();
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(getSafeErrorMessage(e, "Failed to switch workspace"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (w: WorkspaceEntry) => {
    setWorkspaceDeleteTarget(w);
  };

  const handleRename = (w: WorkspaceEntry) => {
    setWorkspaceRenameTarget(w);
  };

  const handleConfirmDelete = async () => {
    if (!workspaceDeleteTarget) return;
    const w = workspaceDeleteTarget;
    await removeWorkspace(w.id);
    setWorkspaceDeleteTarget(null);
  };

  const handleConfirmRename = (newName: string) => {
    if (!workspaceRenameTarget) return;
    renameWorkspace(workspaceRenameTarget.id, newName);
    setWorkspaceRenameTarget(null);
  };

  const renderCardContent = () => {
    const createOption = {
      id: "create",
      icon: FolderPlus,
      title: "Create new workspace",
      description: "Create a new Smriti workspace under a folder.",
      buttonText: "Create",
      buttonVariant: (supportsFileSystem ? "default" : "outline") as
        | "default"
        | "outline",
      disabled: isLoading || !supportsFileSystem,
      unavailable: !supportsFileSystem,
      onClick: handleOpenCreateFolder,
    };

    const openOption = {
      id: "open",
      icon: FolderOpen,
      title: "Open folder as workspace",
      description: "Choose an existing folder of .todo files.",
      buttonText: "Open",
      buttonVariant: "outline" as const,
      disabled: isLoading || !supportsFileSystem,
      unavailable: !supportsFileSystem,
      onClick: handleOpenExisting,
    };

    const localOption = {
      id: "local",
      icon: HardDrive,
      title: "Use local storage",
      description: "Create a workspace stored in your browser's local storage.",
      buttonText: "Local",
      buttonVariant: (!supportsFileSystem ? "default" : "outline") as
        | "default"
        | "outline",
      disabled: isLoading,
      unavailable: false,
      onClick: handleOpenCreateLocal,
    };

    const options = supportsFileSystem
      ? [createOption, openOption, localOption]
      : [localOption, createOption, openOption];

    return (
      <div className="w-full max-w-sm rounded-xl border border-border/50 md:border-border bg-card dark:bg-sidebar-accent md:divide-y md:divide-border overflow-hidden shadow-xs">
        {options.map((opt) => (
          <div
            key={opt.id}
            className={cn(
              "p-3.5 flex items-center justify-between gap-3 transition-colors duration-150 hover:bg-muted/40",
              opt.unavailable && "opacity-50 pointer-events-none",
            )}
          >
            <div className="flex items-center md:items-start gap-3 min-w-0">
              <opt.icon className="size-4 text-muted-foreground shrink-0 md:mt-0.5" />
              <div className="min-w-0">
                <span className="text-sm font-medium text-foreground block">
                  {opt.title}
                </span>
                <p className="hidden md:block text-xs text-muted-foreground">
                  {opt.description}
                </p>
              </div>
            </div>
            <Button
              variant={opt.buttonVariant}
              size="sm"
              disabled={opt.disabled}
              onClick={opt.onClick}
              className="w-16 shrink-0"
            >
              {opt.buttonText}
            </Button>
          </div>
        ))}

        {!supportsFileSystem && (
          <div className="px-3.5 py-2.5 bg-muted/40 border-t border-border/50 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0 text-muted-foreground mt-0.5" />
            <span className="leading-relaxed">
              Folder access requires a Chromium browser (Chrome, Edge). Use
              local storage to create a workspace here.
            </span>
          </div>
        )}
      </div>
    );
  };

  const mainPickerContent = (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-6">
        <SmritiIcon className="size-12 mx-auto mb-2.5 select-none" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight md:mb-1">
          Smriti
        </h1>
        <p className="hidden md:block text-xs sm:text-sm text-muted-foreground">
          A task management app powered by .todo files
        </p>
      </div>

      {!hasExisting && (
        <div className="flex justify-center mb-5">
          <Button
            size="default"
            onClick={handleQuickStart}
            disabled={isLoading}
            className="h-9 px-6 gap-2 text-sm font-medium shadow-xs"
          >
            <Zap className="size-4 fill-current" />
            Quick Start
          </Button>
        </div>
      )}

      {renderCardContent()}

      {error && !creationModal && (
        <div className="mt-3 p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive w-full max-w-sm text-left">
          {error}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-neutral-200/90 dark:bg-neutral-950 flex items-center justify-center p-4 sm:p-6 md:p-8 max-md:min-h-0 max-md:h-dvh max-md:p-0 max-md:bg-background animate-in fade-in-0 duration-200 ease-out">
        {hasExisting ? (
          <div className="relative w-full max-w-4xl h-145 max-h-[90vh] bg-card rounded-2xl border border-border shadow-md flex flex-col md:flex-row overflow-hidden max-md:h-full max-md:max-h-none max-md:rounded-none max-md:border-0 max-md:shadow-none max-md:bg-background animate-in fade-in-0 zoom-in-[0.98] duration-150 ease-out">
            {mode && currentWorkspaceId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReturnToWorkspace}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground size-8 rounded-full z-10 max-md:top-3.5 max-md:right-5"
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            )}

            <aside className="w-full md:w-60 lg:w-68 border-b md:border-b-0 md:border-r border-sidebar-border bg-sidebar flex flex-col shrink-0 overflow-hidden max-md:order-2 max-md:flex-1 max-md:min-h-0 max-md:border-b-0 max-md:bg-transparent max-md:px-5 max-md:pb-3">
              <div className="w-full max-w-sm mx-auto mb-2 md:hidden">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-0.5">
                  Workspaces
                </h2>
              </div>
              <div className="md:contents max-md:w-full max-md:max-w-sm max-md:mx-auto max-md:rounded-xl max-md:border max-md:border-border/50 max-md:bg-card max-md:dark:bg-sidebar-accent max-md:overflow-hidden max-md:shadow-xs max-md:flex max-md:flex-col max-md:min-h-0 max-md:max-h-full">
                <ScrollArea className="flex-1 min-h-0 p-2.5 max-md:p-0">
                  <div className="space-y-1 max-md:space-y-0">
                    {workspaces.map((w) => (
                      <WorkspaceListItem
                        key={w.id}
                        workspace={w}
                        isActive={w.id === currentWorkspaceId}
                        disabled={isLoading}
                        onClick={() => handleSwitch(w)}
                        onRename={
                          w.mode === "local-storage"
                            ? () => handleRename(w)
                            : undefined
                        }
                        onDelete={() => handleDelete(w)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </aside>

            <main className="flex-1 min-w-0 flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto bg-card max-md:order-1 max-md:flex-none max-md:shrink-0 max-md:pt-12 max-md:pb-3 max-md:px-5 max-md:bg-transparent max-md:overflow-visible">
              {mainPickerContent}
            </main>
          </div>
        ) : (
          <div className="relative w-full max-w-md min-h-120 max-h-[90vh] bg-card rounded-2xl border border-border shadow-md flex flex-col items-center justify-center p-6 sm:p-8 overflow-y-auto max-md:min-h-0 max-md:h-full max-md:max-h-none max-md:rounded-none max-md:border-0 max-md:shadow-none max-md:px-5 max-md:bg-background animate-in fade-in-0 zoom-in-[0.98] duration-150 ease-out">
            {mode && currentWorkspaceId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReturnToWorkspace}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground size-8 rounded-full z-10 max-md:top-3.5 max-md:right-5"
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            )}
            {mainPickerContent}
          </div>
        )}
      </div>

      {creationModal && (
        <Dialog open onOpenChange={(open) => !open && handleCloseModal()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {creationModal === "folder" ? (
                  <>
                    <FolderPlus className="size-5 text-muted-foreground" />
                    Create new workspace
                  </>
                ) : (
                  <>
                    <HardDrive className="size-5 text-muted-foreground" />
                    Use local storage
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (creationModal === "folder") {
                  handleCreateFolderWorkspace();
                } else {
                  handleCreateLocalStorage();
                }
              }}
              className="space-y-4"
            >
              <div>
                <Input
                  id="workspace-name"
                  type="text"
                  placeholder="Workspace name"
                  aria-label="Workspace name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  autoFocus
                />
              </div>

              {creationModal === "folder" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLocateFolder}
                  disabled={isLoading}
                  className="w-full justify-start gap-2 h-9 text-left font-normal rounded-lg"
                >
                  {selectedFolderHandle ? (
                    <>
                      <Folder className="size-4 text-primary shrink-0" />
                      <span className="truncate font-mono text-xs text-foreground">
                        {fullWorkspacePath}
                      </span>
                    </>
                  ) : (
                    <>
                      <FolderSearch className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        Choose folder...
                      </span>
                    </>
                  )}
                </Button>
              )}

              {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
              )}

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !workspaceName.trim()}
                >
                  {isLoading ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {workspaceRenameTarget && (
        <RenameModal
          title="Rename Workspace"
          currentName={workspaceRenameTarget.name}
          icon={ServerCog}
          showIconPicker={false}
          onClose={() => setWorkspaceRenameTarget(null)}
          onRename={handleConfirmRename}
        />
      )}

      {workspaceDeleteTarget && (
        <ConfirmModal
          title="Delete Workspace"
          message={`Are you sure you want to delete "${workspaceDeleteTarget.name}"? This action cannot be undone.`}
          onClose={() => setWorkspaceDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}

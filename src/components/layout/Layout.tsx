import { Folder, Tag } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useKeyboard } from "../../hooks/useKeyboard";
import { cn } from "../../lib/utils";
import { useTaskDraftStore } from "../../store/task-draft-store";
import { useTaskStore } from "../../store/task-store";
import { useUIStore } from "../../store/ui-store";
import { useWorkspaceStore } from "../../store/workspace-store";
import SearchPopup from "../search/SearchPopup";
import SettingsModal from "../settings/SettingsModal";
import ConfirmModal from "../ui/ConfirmModal";
import RenameModal from "../ui/RenameModal";
import CreateProjectModal from "./CreateProjectModal";
import Sidebar from "./Sidebar";

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
  closeMobile: () => void;
  isMobile: boolean;
}

const DEFAULT_SIDEBAR_CONTEXT: SidebarContextValue = {
  collapsed: false,
  toggle: () => {},
  closeMobile: () => useUIStore.getState().closeMobileSidebar(),
  isMobile: typeof window !== "undefined" ? window.innerWidth < 768 : false,
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  return ctx ?? DEFAULT_SIDEBAR_CONTEXT;
}

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();

  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);
  const closeMobileSidebar = useUIStore((s) => s.closeMobileSidebar);

  const isCollapsed = isMobile ? !mobileSidebarOpen : sidebarCollapsed;
  const handleToggle = useCallback(() => {
    if (isMobile) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  }, [isMobile, toggleMobileSidebar, toggleSidebar]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [projectCreationOpen, setProjectCreationOpen] = useState(false);
  const [projectRenameTarget, setProjectRenameTarget] = useState<string | null>(
    null,
  );
  const [projectDeleteTarget, setProjectDeleteTarget] = useState<string | null>(
    null,
  );
  const [tagCreationOpen, setTagCreationOpen] = useState(false);
  const [tagRenameTarget, setTagRenameTarget] = useState<string | null>(null);
  const [tagDeleteTarget, setTagDeleteTarget] = useState<string | null>(null);

  const createProject = useTaskStore((s) => s.createProject);
  const renameProject = useTaskStore((s) => s.renameProject);
  const deleteProject = useTaskStore((s) => s.deleteProject);
  const renameTagInAllTasks = useTaskStore((s) => s.renameTagInAllTasks);
  const removeTagFromAllTasks = useTaskStore((s) => s.removeTagFromAllTasks);
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useWorkspaceStore((s) => s.settings);
  const addTag = useWorkspaceStore((s) => s.addTag);
  const renameTagInSettings = useWorkspaceStore((s) => s.renameTag);
  const removeTagFromSettings = useWorkspaceStore((s) => s.removeTag);
  const setProjectIcon = useWorkspaceStore((s) => s.setProjectIcon);
  const removeProjectIcon = useWorkspaceStore((s) => s.removeProjectIcon);
  const renameProjectIcon = useWorkspaceStore((s) => s.renameProjectIcon);
  const setTagIcon = useWorkspaceStore((s) => s.setTagIcon);
  const removeTagIcon = useWorkspaceStore((s) => s.removeTagIcon);
  const renamePinnedProject = useWorkspaceStore((s) => s.renamePinnedProject);
  const removePinnedProject = useWorkspaceStore((s) => s.removePinnedProject);

  const handleSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleNewTask = useCallback(() => {
    useTaskDraftStore.getState().openModal();
  }, []);

  useKeyboard({
    onSearch: handleSearch,
    onToggleSidebar: handleToggle,
    onNewTask: handleNewTask,
  });

  const handleCreateProject = async (name: string, icon?: string | null) => {
    try {
      await createProject(name);
      if (icon) {
        setProjectIcon(name, icon);
      }
      navigate(`/project/${encodeURIComponent(name)}`);
      setProjectCreationOpen(false);
      closeMobileSidebar();
    } catch (e) {
      toast.error((e as Error).message || "Failed to create project");
    }
  };

  const handleRenameProject = async (
    newName: string,
    newIcon?: string | null,
  ) => {
    if (!projectRenameTarget) return;
    const oldName = projectRenameTarget;
    try {
      if (oldName !== newName) {
        await renameProject(oldName, newName);
        renamePinnedProject(oldName, newName);
      }
      if (newIcon !== undefined) {
        if (oldName !== newName) {
          removeProjectIcon(oldName);
        }
        setProjectIcon(newName, newIcon || undefined);
      } else if (oldName !== newName) {
        renameProjectIcon(oldName, newName);
      }
      if (location.pathname === `/project/${encodeURIComponent(oldName)}`) {
        navigate(`/project/${encodeURIComponent(newName)}`, { replace: true });
      }
      setProjectRenameTarget(null);
    } catch (e) {
      toast.error((e as Error).message || "Failed to rename project");
    }
  };

  const handleDeleteProject = async () => {
    if (!projectDeleteTarget) return;
    const name = projectDeleteTarget;
    try {
      await deleteProject(name);
      removeProjectIcon(name);
      removePinnedProject(name);
      if (location.pathname === `/project/${encodeURIComponent(name)}`) {
        navigate("/all");
      }
      setProjectDeleteTarget(null);
    } catch (e) {
      toast.error((e as Error).message || "Failed to delete project");
    }
  };

  const handleCreateTag = (name: string, icon?: string | null) => {
    addTag(name);
    if (icon) {
      setTagIcon(name, icon);
    }
    navigate(`/tag/${encodeURIComponent(name)}`);
    setTagCreationOpen(false);
    closeMobileSidebar();
  };

  const handleRenameTag = async (newName: string, newIcon?: string | null) => {
    if (!tagRenameTarget) return;
    const oldName = tagRenameTarget;
    try {
      if (oldName !== newName) {
        renameTagInSettings(oldName, newName);
        await renameTagInAllTasks(oldName, newName);
        if (location.pathname === `/tag/${encodeURIComponent(oldName)}`) {
          navigate(`/tag/${encodeURIComponent(newName)}`, { replace: true });
        }
      }
      if (newIcon !== undefined) {
        if (oldName !== newName) {
          removeTagIcon(oldName);
        }
        setTagIcon(newName, newIcon || undefined);
      }
      setTagRenameTarget(null);
    } catch (e) {
      toast.error((e as Error).message || "Failed to rename tag");
    }
  };

  const handleDeleteTag = async () => {
    if (!tagDeleteTarget) return;
    const name = tagDeleteTarget;
    removeTagFromSettings(name);
    await removeTagFromAllTasks(name);
    if (location.pathname === `/tag/${encodeURIComponent(name)}`) {
      navigate("/all");
    }
    setTagDeleteTarget(null);
  };

  const handleSettingsClick = useCallback(() => {
    setSettingsOpen(true);
    closeMobileSidebar();
  }, [closeMobileSidebar]);

  const handleSearchClick = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleAddProjectClick = useCallback(() => {
    setProjectCreationOpen(true);
  }, []);

  const handleAddTagClick = useCallback(() => {
    setTagCreationOpen(true);
  }, []);

  const sidebarContextValue = useMemo(
    () => ({
      collapsed: isCollapsed,
      toggle: handleToggle,
      closeMobile: closeMobileSidebar,
      isMobile,
    }),
    [isCollapsed, handleToggle, closeMobileSidebar, isMobile],
  );

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <div className="flex h-screen w-screen overflow-hidden bg-sidebar">
        {!isCollapsed && (
          <button
            type="button"
            className="fixed inset-0 bg-black/20 z-30 md:hidden animate-in fade-in-0 duration-200 ease-out"
            onClick={handleToggle}
            aria-label="Close sidebar"
          />
        )}

        <div
          aria-hidden={sidebarCollapsed}
          className={cn(
            "relative shrink-0 h-full hidden md:block transition-[width] duration-200 ease-out",
            sidebarCollapsed ? "w-0" : "w-60",
          )}
        />

        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-68 md:w-60 h-full transition-transform duration-200 ease-out",
            isCollapsed
              ? "-translate-x-full pointer-events-none"
              : "translate-x-0",
          )}
        >
          <Sidebar
            onSettingsClick={handleSettingsClick}
            onSearchClick={handleSearchClick}
            onToggleSidebar={handleToggle}
            onAddProjectClick={handleAddProjectClick}
            onRenameProject={setProjectRenameTarget}
            onDeleteProject={setProjectDeleteTarget}
            onAddTagClick={handleAddTagClick}
            onRenameTag={setTagRenameTarget}
            onDeleteTag={setTagDeleteTarget}
          />
        </div>

        <main
          className={cn(
            "flex-1 flex flex-col min-w-0 bg-background overflow-hidden transition-[margin] duration-200 ease-out",
            "md:rounded-xl md:border md:border-border/80 md:shadow-xs",
            sidebarCollapsed ? "md:m-2" : "md:my-2 md:mr-2 md:ml-0",
          )}
        >
          {children || <Outlet />}
        </main>

        {settingsOpen && (
          <SettingsModal onClose={() => setSettingsOpen(false)} />
        )}

        {searchOpen && <SearchPopup onClose={() => setSearchOpen(false)} />}

        {projectCreationOpen && (
          <CreateProjectModal
            title="New Project"
            placeholder="Project name"
            icon={Folder}
            defaultIconId="folder"
            onClose={() => setProjectCreationOpen(false)}
            onCreate={handleCreateProject}
          />
        )}

        {projectRenameTarget && (
          <RenameModal
            title="Edit Project"
            currentName={projectRenameTarget}
            currentIcon={settings?.projectIcons?.[projectRenameTarget]}
            icon={Folder}
            defaultIconId="folder"
            submitLabel="Save"
            onClose={() => setProjectRenameTarget(null)}
            onRename={handleRenameProject}
          />
        )}

        {projectDeleteTarget && (
          <ConfirmModal
            title="Delete Project"
            message={`Are you sure you want to delete "${projectDeleteTarget}"? This will permanently remove the project and all its tasks.`}
            onClose={() => setProjectDeleteTarget(null)}
            onConfirm={handleDeleteProject}
          />
        )}

        {tagCreationOpen && (
          <CreateProjectModal
            title="New Tag"
            placeholder="Tag name"
            icon={Tag}
            defaultIconId="tag"
            onClose={() => setTagCreationOpen(false)}
            onCreate={handleCreateTag}
          />
        )}

        {tagRenameTarget && (
          <RenameModal
            title="Edit Tag"
            currentName={tagRenameTarget}
            currentIcon={settings?.tagIcons?.[tagRenameTarget]}
            icon={Tag}
            defaultIconId="tag"
            submitLabel="Save"
            onClose={() => setTagRenameTarget(null)}
            onRename={handleRenameTag}
          />
        )}

        {tagDeleteTarget && (
          <ConfirmModal
            title="Delete Tag"
            message={`Are you sure you want to delete the tag "${tagDeleteTarget}"? This will remove the tag from all tasks.`}
            confirmLabel="Delete"
            onClose={() => setTagDeleteTarget(null)}
            onConfirm={handleDeleteTag}
          />
        )}
      </div>
    </SidebarContext.Provider>
  );
}

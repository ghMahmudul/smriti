import {
  Archive,
  Calendar,
  Check,
  ChevronDown,
  CircleCheckBig,
  ClipboardCheck,
  Clock,
  Download,
  Folder,
  FolderPlus,
  Inbox,
  PanelLeft,
  Search,
  Settings,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getProjectIcon, getTagIcon } from "@/core/icons";
import { cn } from "@/lib/utils";
import { usePWAStore } from "../../store/pwa-store";
import { useTaskStore } from "../../store/task-store";
import { useWorkspaceStore } from "../../store/workspace-store";
import { useSidebar } from "./Layout";
import SidebarSection from "./SidebarSection";
import SidebarSectionItem from "./SidebarSectionItem";
import SidebarView from "./SidebarView";

const VIEWS = [
  { id: "all", label: "All", icon: ClipboardCheck, path: "/all" },
  { id: "inbox", label: "Inbox", icon: Inbox, path: "/inbox" },
  { id: "today", label: "Today", icon: Calendar, path: "/today" },
  { id: "upcoming", label: "Upcoming", icon: Clock, path: "/upcoming" },
  {
    id: "completed",
    label: "Completed",
    icon: CircleCheckBig,
    path: "/completed",
  },
  { id: "archived", label: "Archived", icon: Archive, path: "/archived" },
  { id: "trash", label: "Trash", icon: Trash2, path: "/trash" },
];

const MAIN_VIEW_IDS = new Set(["all", "today", "upcoming", "inbox"]);

interface SidebarProps {
  onSettingsClick: () => void;
  onSearchClick: () => void;
  onToggleSidebar: () => void;
  onAddProjectClick: () => void;
  onRenameProject: (name: string) => void;
  onDeleteProject: (name: string) => void;
  onAddTagClick: () => void;
  onRenameTag: (name: string) => void;
  onDeleteTag: (name: string) => void;
}

function safeDecode(val: string): string {
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

function getActiveViewFromPath(pathname: string, defaultView = "all"): string {
  const segment = pathname.split("/")[1];
  if (segment === "project") {
    const name = pathname.split("/")[2];
    return name ? `project:${safeDecode(name)}` : defaultView;
  }
  if (segment === "tag") {
    const name = pathname.split("/")[2];
    return name ? `tag:${safeDecode(name)}` : defaultView;
  }
  return segment || defaultView;
}

export default function Sidebar({
  onSettingsClick,
  onSearchClick,
  onToggleSidebar,
  onAddProjectClick,
  onRenameProject,
  onDeleteProject,
  onAddTagClick,
  onRenameTag,
  onDeleteTag,
}: SidebarProps) {
  const { closeMobile } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    settings,
    workspaceName,
    workspaces,
    currentWorkspaceId,
    switchWorkspace,
    setView,
    togglePinProject,
    togglePinTag,
  } = useWorkspaceStore();
  const { getTasksByView, getProjects, getAllTags, loadFiles } = useTaskStore();
  const { isInstallable, isInstalled, installApp } = usePWAStore();

  const activeView = getActiveViewFromPath(
    location.pathname,
    settings?.defaultView || "all",
  );

  const workspaceTags = Array.isArray(settings?.tags) ? settings.tags : [];
  const projects = getProjects();
  const tags = getAllTags(workspaceTags);

  const pinnedProjects = Array.isArray(settings?.pinnedProjects)
    ? settings.pinnedProjects
    : [];
  const pinnedTags = Array.isArray(settings?.pinnedTags)
    ? settings.pinnedTags
    : [];

  const validPinnedProjects = pinnedProjects.filter((name) =>
    projects.includes(name),
  );
  const validPinnedTags = pinnedTags.filter((name) => tags.includes(name));
  const hasPinned =
    validPinnedProjects.length > 0 || validPinnedTags.length > 0;

  const validPinnedProjectsSet = new Set(validPinnedProjects);
  const validPinnedTagsSet = new Set(validPinnedTags);

  const unpinnedProjects = projects.filter(
    (name) => !validPinnedProjectsSet.has(name),
  );
  const unpinnedTags = tags.filter((name) => !validPinnedTagsSet.has(name));
  const handleManageWorkspaces = () => {
    closeMobile();
    setView("picker");
    navigate("/workspaces");
  };

  const handleSelectWorkspace = async (id: string) => {
    if (id === currentWorkspaceId) return;
    try {
      closeMobile();
      const adapter = await switchWorkspace(id);
      if (adapter) {
        const defaultView =
          useWorkspaceStore.getState().settings.defaultView || "all";
        navigate(`/${defaultView}`);
        const wsId = useWorkspaceStore.getState().currentWorkspaceId;
        await loadFiles(adapter, wsId);
      }
    } catch {
      // Switch cancelled or failed
    }
  };

  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);

  const checkScroll = () => {
    const el = scrollViewportRef.current;
    if (el) {
      setHasScroll(el.scrollHeight > el.clientHeight + 1);
    }
  };

  useEffect(() => {
    const el = scrollViewportRef.current;
    if (!el) return;

    checkScroll();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(checkScroll);
      ro.observe(el);
      if (el.firstElementChild) {
        ro.observe(el.firstElementChild);
      }
      return () => {
        ro.disconnect();
      };
    }
  }, [projects, tags, settings]);

  return (
    <aside className="w-68 md:w-60 h-full flex flex-col bg-sidebar border-r border-sidebar-border md:border-r-0">
      <div className="px-5 md:px-4 py-3 pb-0 flex items-center justify-between shrink-0">
        <span className="text-xl font-semibold tracking-tight text-sidebar-foreground select-none">
          Smriti
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={onSearchClick}
          >
            <Search className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={onToggleSidebar}
            aria-label="Collapse sidebar"
          >
            <PanelLeft className="size-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0" viewportRef={scrollViewportRef}>
        <nav className="py-3 px-3 md:px-2">
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {VIEWS.filter((v) => MAIN_VIEW_IDS.has(v.id)).map((view) => {
              const count = getTasksByView(view.id).length;
              return (
                <SidebarView
                  key={view.id}
                  icon={view.icon}
                  label={view.label}
                  count={count}
                  layout="card"
                  isActive={activeView === view.id}
                  onClick={() => {
                    navigate(view.path);
                    closeMobile();
                  }}
                />
              );
            })}
          </div>

          <div className="space-y-0.5">
            {VIEWS.filter((v) => !MAIN_VIEW_IDS.has(v.id)).map((view) => {
              if (view.id === "trash" && !settings.showTrash) return null;
              if (view.id === "archived" && !settings.showArchived) return null;
              if (view.id === "completed" && !settings.showCompleted)
                return null;
              const count = getTasksByView(view.id).length;
              return (
                <SidebarView
                  key={view.id}
                  icon={view.icon}
                  label={view.label}
                  count={count}
                  isActive={activeView === view.id}
                  onClick={() => {
                    navigate(view.path);
                    closeMobile();
                  }}
                />
              );
            })}
          </div>

          {hasPinned && (
            <SidebarSection
              title="Pinned"
              storageKey="sidebar-pinned-collapsed"
              onToggleCollapse={checkScroll}
              className="mt-2.5"
            >
              {validPinnedProjects.map((projectName) => (
                <SidebarSectionItem
                  key={`pinned-project-${projectName}`}
                  name={projectName}
                  icon={getProjectIcon(projectName, settings?.projectIcons)}
                  count={getTasksByView(`project:${projectName}`).length}
                  isActive={activeView === `project:${projectName}`}
                  onClick={() => {
                    navigate(`/project/${encodeURIComponent(projectName)}`);
                    closeMobile();
                  }}
                  onRename={() => onRenameProject(projectName)}
                  onPin={() => togglePinProject(projectName)}
                  isPinned={true}
                  onDelete={() => onDeleteProject(projectName)}
                />
              ))}
              {validPinnedTags.map((tagName) => (
                <SidebarSectionItem
                  key={`pinned-tag-${tagName}`}
                  name={tagName}
                  icon={getTagIcon(tagName, settings?.tagIcons)}
                  count={getTasksByView(`tag:${tagName}`).length}
                  isActive={activeView === `tag:${tagName}`}
                  onClick={() => {
                    navigate(`/tag/${encodeURIComponent(tagName)}`);
                    closeMobile();
                  }}
                  onRename={() => onRenameTag(tagName)}
                  onPin={() => togglePinTag(tagName)}
                  isPinned={true}
                  onDelete={() => onDeleteTag(tagName)}
                />
              ))}
            </SidebarSection>
          )}

          <SidebarSection
            title="Projects"
            storageKey="sidebar-projects-collapsed"
            icon={Folder}
            type="project"
            items={unpinnedProjects}
            activeView={activeView}
            getItemIcon={(name) => getProjectIcon(name, settings?.projectIcons)}
            getTaskCount={(name) => getTasksByView(`project:${name}`).length}
            onNavigate={(name) => {
              navigate(`/project/${encodeURIComponent(name)}`);
              closeMobile();
            }}
            onAdd={onAddProjectClick}
            onRename={onRenameProject}
            onPin={(name) => togglePinProject(name)}
            isItemPinned={(name) => validPinnedProjectsSet.has(name)}
            onDelete={onDeleteProject}
            onToggleCollapse={checkScroll}
            className={hasPinned ? "mt-2" : "mt-2.5"}
          />

          <SidebarSection
            title="Tags"
            storageKey="sidebar-tags-collapsed"
            icon={Tag}
            type="tag"
            items={unpinnedTags}
            activeView={activeView}
            getItemIcon={(name) => getTagIcon(name, settings?.tagIcons)}
            getTaskCount={(name) => getTasksByView(`tag:${name}`).length}
            onNavigate={(name) => {
              navigate(`/tag/${encodeURIComponent(name)}`);
              closeMobile();
            }}
            onAdd={onAddTagClick}
            onRename={onRenameTag}
            onPin={(name) => togglePinTag(name)}
            isItemPinned={(name) => validPinnedTagsSet.has(name)}
            onDelete={onDeleteTag}
            onToggleCollapse={checkScroll}
            className="mt-2"
          />
        </nav>
      </ScrollArea>

      <div
        className={cn(
          "border-t px-3 py-2.5 md:p-2 transition-colors duration-150 shrink-0",
          hasScroll ? "border-sidebar-border" : "border-transparent",
        )}
      >
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="flex-1 justify-start gap-1.5 truncate h-8 text-sm rounded-lg"
                />
              }
            >
              <span className="truncate">{workspaceName || "Workspace"}</span>
              <ChevronDown className="size-4 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="top"
              className="w-62 md:w-56 mb-2"
            >
              {workspaces.map((w) => (
                <DropdownMenuItem
                  key={w.id}
                  onClick={() => handleSelectWorkspace(w.id)}
                >
                  {w.id === currentWorkspaceId && (
                    <Check className="size-4 shrink-0" />
                  )}
                  <span className="truncate">{w.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {w.mode === "file-system" ? "FS" : "LS"}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {isInstallable && !isInstalled && (
                <DropdownMenuItem onClick={() => installApp()}>
                  <Download className="size-4" />
                  Install App
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleManageWorkspaces}>
                <FolderPlus className="size-4" />
                Manage Workspaces
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onSettingsClick}
            aria-label="Settings"
          >
            <Settings className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

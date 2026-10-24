import { CheckCircle2, Circle, CircleDashed, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getTaskCheckboxColor } from "../../core/constants";
import { getProjectIcon, getTagIcon } from "../../core/icons";
import type { TodoItem } from "../../core/types";
import { useAllTags, useProjects, useTaskStore } from "../../store/task-store";
import { useWorkspaceStore } from "../../store/workspace-store";

interface SearchPopupProps {
  onClose: () => void;
}

export default function SearchPopup({ onClose }: SearchPopupProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const files = useTaskStore((s) => s.files);
  const settings = useWorkspaceStore((s) => s.settings);
  const workspaceTags = Array.isArray(settings?.tags) ? settings.tags : [];
  const projects = useProjects();
  const tags = useAllTags(workspaceTags);
  const navigate = useNavigate();

  const isSearching = searchQuery.trim().length > 0;

  const allTasks = useMemo(() => {
    if (!isSearching) return [];
    const list: TodoItem[] = [];
    for (const file of files.values()) {
      for (const task of file.tasks.values()) {
        if (!task.metadata.trashed) {
          list.push(task);
        }
      }
    }
    return list.sort((a, b) => {
      const aArchived = !!a.metadata.archived;
      const bArchived = !!b.metadata.archived;
      const aDone = a.state === "done";
      const bDone = b.state === "done";

      if (!aArchived && bArchived) return -1;
      if (aArchived && !bArchived) return 1;
      if (!aDone && bDone) return -1;
      if (aDone && !bDone) return 1;

      return 0;
    });
  }, [files, isSearching]);

  const allProjects = useMemo(() => {
    if (!isSearching) return [];
    return ["Inbox", ...projects];
  }, [projects, isSearching]);

  const allTags = useMemo(() => {
    if (!isSearching) return [];
    return tags;
  }, [tags, isSearching]);

  const handleSelectTask = useCallback(
    (task: TodoItem) => {
      const navState = { selectedTaskId: task.id, timestamp: Date.now() };
      if (task.metadata.trashed) {
        navigate("/trash", { state: navState });
      } else if (task.metadata.archived) {
        navigate("/archived", { state: navState });
      } else if (task.state === "done") {
        navigate("/completed", { state: navState });
      } else if (task.projectId.toLowerCase() === "inbox") {
        navigate("/inbox", { state: navState });
      } else {
        navigate(`/project/${encodeURIComponent(task.projectId)}`, {
          state: navState,
        });
      }
      onClose();
    },
    [navigate, onClose],
  );

  const handleSelectProject = useCallback(
    (projectName: string) => {
      if (projectName.toLowerCase() === "inbox") {
        navigate("/inbox");
      } else {
        navigate(`/project/${encodeURIComponent(projectName)}`);
      }
      onClose();
    },
    [navigate, onClose],
  );

  const handleSelectTag = useCallback(
    (tagName: string) => {
      navigate(`/tag/${encodeURIComponent(tagName)}`);
      onClose();
    },
    [navigate, onClose],
  );

  return (
    <CommandDialog
      open
      onOpenChange={(open) => !open && onClose()}
      className="sm:max-w-xl"
    >
      <CommandInput
        placeholder="Search tasks, projects, tags..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList className="min-h-80">
        {!isSearching && (
          <div className="flex flex-col items-center justify-center h-80 text-center text-muted-foreground select-none">
            <Search className="size-8 mb-2.5 opacity-40" />
            <p className="text-sm font-medium">Enter keywords to search</p>
          </div>
        )}
        {isSearching && (
          <>
            <CommandEmpty className="py-12 text-center text-sm text-muted-foreground">
              No results found
            </CommandEmpty>
            <CommandGroup heading="Tasks">
              {allTasks.map((task) => {
                const isArchived = !!task.metadata.archived;
                const isDone = task.state === "done";
                const CheckboxIcon = isDone
                  ? CheckCircle2
                  : isArchived
                    ? CircleDashed
                    : Circle;
                const checkboxColor = getTaskCheckboxColor(
                  task.metadata.priority,
                  task.state,
                );
                const isInbox = task.projectId.toLowerCase() === "inbox";
                const projectName = isInbox ? "Inbox" : task.projectId;
                const ProjectIcon = getProjectIcon(
                  task.projectId,
                  settings?.projectIcons,
                );

                return (
                  <CommandItem
                    key={task.id}
                    value={`${task.title || "No Title"} ${task.body ? task.body : ""} ${projectName} ${task.id}`}
                    keywords={[
                      ...(task.metadata.tags ?? []),
                      ...(task.body ? [task.body] : []),
                    ]}
                    onSelect={() => handleSelectTask(task)}
                  >
                    <CheckboxIcon
                      className={`size-4 shrink-0 ${checkboxColor}`}
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm truncate block ${
                          isDone ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {task.title || (
                          <span className="text-muted-foreground">
                            No Title
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
                      <span className="text-xs truncate max-w-25">
                        {projectName}
                      </span>
                      <ProjectIcon className="size-3 shrink-0" />
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading="Projects">
              {allProjects.map((project) => {
                const ProjectIcon = getProjectIcon(
                  project,
                  settings?.projectIcons,
                );
                return (
                  <CommandItem
                    key={`project-${project}`}
                    value={`${project} (Project)`}
                    onSelect={() => handleSelectProject(project)}
                  >
                    <ProjectIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-foreground truncate flex-1">
                      {project}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading="Tags">
              {allTags.map((tag) => {
                const TagIcon = getTagIcon(tag, settings?.tagIcons);
                return (
                  <CommandItem
                    key={`tag-${tag}`}
                    value={`${tag} (Tag)`}
                    onSelect={() => handleSelectTag(tag)}
                  >
                    <TagIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-foreground truncate flex-1">
                      {tag}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

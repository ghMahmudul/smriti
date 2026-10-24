import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Calendar,
  CircleCheckBig,
  ClipboardCheck,
  Clock,
  Inbox,
  Menu,
  Plus,
  Trash2,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useLocation, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getProjectIcon, getTagIcon } from "../../core/icons";
import { getNextDueDate } from "../../core/repeat-utils";
import { filterCompletedTasks } from "../../core/task-filter";
import { sortTasks } from "../../core/task-sort";
import type { Priority, TodoItem } from "../../core/types";
import { useKeyboard } from "../../hooks/useKeyboard";
import { useTaskDraftStore } from "../../store/task-draft-store";
import { useTaskStore, useTasksByView } from "../../store/task-store";
import { useUIStore } from "../../store/ui-store";
import { useWorkspaceStore } from "../../store/workspace-store";
import { useSidebar } from "../layout/Layout";
import ConfirmModal from "../ui/ConfirmModal";
import AddTaskModal from "./AddTaskModal";
import { CompletedTaskFilter } from "./CompletedTaskFilter";
import EmptyState from "./EmptyState";
import LoadingSkeleton from "./LoadingSkeleton";
import TaskDetailPanel from "./TaskDetailPanel";
import TaskList from "./TaskList";
import TaskSortMenu from "./TaskSortMenu";

const VIEW_CONFIG: Record<
  string,
  { title: string; icon: LucideIcon; emptyMessage: string }
> = {
  all: {
    title: "All Tasks",
    icon: ClipboardCheck,
    emptyMessage: "No tasks yet",
  },
  today: {
    title: "Today",
    icon: Calendar,
    emptyMessage: "Nothing due today",
  },
  upcoming: {
    title: "Upcoming",
    icon: Clock,
    emptyMessage: "No upcoming tasks",
  },
  inbox: {
    title: "Inbox",
    icon: Inbox,
    emptyMessage: "Inbox is empty",
  },
  archived: {
    title: "Archived",
    icon: Archive,
    emptyMessage: "No archived tasks",
  },
  completed: {
    title: "Completed",
    icon: CircleCheckBig,
    emptyMessage: "No completed tasks",
  },
  trash: {
    title: "Trash",
    icon: Trash2,
    emptyMessage: "Trash is empty",
  },
};

function useActiveView(): string {
  const location = useLocation();
  const params = useParams();
  const defaultView = useWorkspaceStore((s) => s.settings.defaultView) || "all";
  const path = location.pathname;

  if (params.projectName) return `project:${params.projectName}`;
  if (params.tagName) return `tag:${params.tagName}`;

  const segment = path.split("/")[1];
  return segment || defaultView;
}

function getViewConfig(
  activeView: string,
  projectIcons?: Record<string, string>,
  tagIcons?: Record<string, string>,
) {
  if (activeView.startsWith("project:")) {
    const name = activeView.slice(8);
    return {
      title: name,
      icon: getProjectIcon(name, projectIcons),
      emptyMessage: "No tasks here",
    };
  }
  if (activeView.startsWith("tag:")) {
    const name = activeView.slice(4);
    return {
      title: name,
      icon: getTagIcon(name, tagIcons),
      emptyMessage: "No tasks with this tag",
    };
  }
  return (
    VIEW_CONFIG[activeView] ?? {
      title: "Tasks",
      icon: ClipboardCheck,
      emptyMessage: "No tasks here",
    }
  );
}

export default function TaskViewContent() {
  const location = useLocation();
  const activeView = useActiveView();
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const bulkDeleteTasks = useTaskStore((s) => s.bulkDeleteTasks);
  const bulkUpdateTasks = useTaskStore((s) => s.bulkUpdateTasks);
  const getTask = useTaskStore((s) => s.getTask);
  const isLoaded = useTaskStore((s) => s.isLoaded);
  const { collapsed, toggle: toggleSidebar, isMobile } = useSidebar();

  const isAddModalOpen = useTaskDraftStore((s) => s.isOpen);
  const openAddModal = useTaskDraftStore((s) => s.openModal);
  const closeAddModal = useTaskDraftStore((s) => s.closeModal);
  const syncView = useTaskDraftStore((s) => s.syncView);
  const resetDraft = useTaskDraftStore((s) => s.resetDraft);

  const settings = useWorkspaceStore((s) => s.settings);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [lastTask, setLastTask] = useState<TodoItem | null>(null);
  const [hasExitingTasks, setHasExitingTasks] = useState(false);

  const prevWorkspaceIdRef = useRef(currentWorkspaceId);
  useEffect(() => {
    if (prevWorkspaceIdRef.current !== currentWorkspaceId) {
      prevWorkspaceIdRef.current = currentWorkspaceId;
      setLastTask(null);
      setSelectedTaskId(null);
      setHasExitingTasks(false);
      setCompletedProjectFilter("all");
      setCompletedDateRange(undefined);
      closeAddModal();
      resetDraft();
    }
  }, [currentWorkspaceId, closeAddModal, resetDraft]);

  useEffect(() => {
    const stateTaskId = (location.state as { selectedTaskId?: string } | null)
      ?.selectedTaskId;
    const queryTaskId = new URLSearchParams(location.search).get("task");
    const targetTaskId = stateTaskId || queryTaskId;
    if (targetTaskId) {
      setSelectedTaskId(targetTaskId);
    } else {
      setSelectedTaskId(null);
    }
  }, [location.pathname, location.state, location.search]);

  useEffect(() => {
    syncView(activeView);
  }, [activeView, syncView]);

  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);
  const [showTrashCompletedConfirm, setShowTrashCompletedConfirm] =
    useState(false);

  const [completedProjectFilter, setCompletedProjectFilter] =
    useState<string>("all");
  const [completedDateRange, setCompletedDateRange] = useState<
    DateRange | undefined
  >(undefined);

  const rawTasks = useTasksByView(activeView);
  const taskSortBy = useUIStore((s) => s.taskSortBy);
  const taskSortOrder = useUIStore((s) => s.taskSortOrder);

  const isActiveTasksView = !["completed", "archived", "trash"].includes(
    activeView,
  );

  const tasks = useMemo(() => {
    if (activeView === "completed") {
      return filterCompletedTasks(
        rawTasks,
        completedProjectFilter,
        completedDateRange,
      );
    }
    if (!isActiveTasksView) return rawTasks;
    return sortTasks(rawTasks, taskSortBy, taskSortOrder);
  }, [
    activeView,
    rawTasks,
    completedProjectFilter,
    completedDateRange,
    isActiveTasksView,
    taskSortBy,
    taskSortOrder,
  ]);

  const {
    title,
    icon,
    emptyMessage: defaultEmptyMessage,
  } = getViewConfig(activeView, settings?.projectIcons, settings?.tagIcons);
  const isCompletedFiltered =
    activeView === "completed" &&
    (completedProjectFilter !== "all" || Boolean(completedDateRange?.from));
  const emptyMessage =
    isCompletedFiltered && rawTasks.length > 0
      ? "No completed tasks match your filter"
      : defaultEmptyMessage;
  const ViewIcon = icon;
  const selectedTask = selectedTaskId ? getTask(selectedTaskId) : undefined;

  useEffect(() => {
    if (selectedTask) {
      setLastTask(selectedTask);
    }
  }, [selectedTask]);

  const displayTask = selectedTask ?? lastTask;
  const isPanelOpen = Boolean(selectedTaskId && displayTask);

  const selectedIndex = useMemo(
    () => tasks.findIndex((t) => t.id === selectedTaskId),
    [tasks, selectedTaskId],
  );

  const handleAddTask = useCallback(
    async (fields: {
      title: string;
      body: string;
      projectId: string;
      priority?: Priority;
      due?: string;
      repeat?: string;
      tags?: string[];
    }) => {
      const now = new Date().toISOString();
      const targetProject =
        fields.projectId.toLowerCase() === "inbox" ? "Inbox" : fields.projectId;
      const isArchivedView = activeView === "archived";
      const taskId = nanoid();
      const newTask: TodoItem = {
        id: taskId,
        title: fields.title,
        state: "open",
        projectId: targetProject,
        parentId: null,
        metadata: {
          id: taskId,
          created: now,
          ...(isArchivedView ? { archived: now } : {}),
          priority: fields.priority,
          due: fields.due,
          repeat: fields.repeat,
          tags: fields.tags,
        },
        body: fields.body,
        children: [],
        order: 0,
        attachments: [],
      };

      try {
        await addTask(newTask, targetProject);
        resetDraft(activeView);
        closeAddModal();
      } catch (e) {
        toast.error((e as Error).message || "Failed to add task");
      }
    },
    [addTask, resetDraft, activeView, closeAddModal],
  );

  const handleToggleState = useCallback(
    async (task: TodoItem) => {
      const now = new Date().toISOString();

      if (activeView === "archived") {
        const { archived: _, ...rest } = task.metadata;
        await updateTask(task.id, { metadata: rest });
      } else if (task.state === "done") {
        await updateTask(task.id, {
          state: "open",
          metadata: {
            ...task.metadata,
            completed: undefined,
          },
        });
      } else if (task.metadata.repeat) {
        const nextDue = getNextDueDate(task.metadata.due, task.metadata.repeat);
        const newTaskId = nanoid();
        const {
          repeat: _repeatRule,
          completed: _completed,
          archived: _archived,
          trashed: _trashed,
          ...cleanMeta
        } = task.metadata;

        const nextTask: TodoItem = {
          id: newTaskId,
          title: task.title,
          state: "open",
          projectId: task.projectId,
          parentId: task.parentId,
          metadata: {
            ...cleanMeta,
            id: newTaskId,
            created: now,
            due: nextDue,
            repeat: task.metadata.repeat,
          },
          body: task.body,
          children: [],
          order: task.order,
          attachments: [...task.attachments],
        };

        const { repeat: _r, ...completedMeta } = task.metadata;
        await updateTask(task.id, {
          state: "done",
          metadata: {
            ...completedMeta,
            completed: now,
          },
        });

        await addTask(nextTask, task.projectId);
      } else {
        await updateTask(task.id, {
          state: "done",
          metadata: {
            ...task.metadata,
            completed: now,
          },
        });
      }

      if (selectedTaskId === task.id && activeView !== "trash") {
        setSelectedTaskId(null);
      }
    },
    [activeView, selectedTaskId, updateTask, addTask],
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<TodoItem>) => {
      await updateTask(id, updates);
    },
    [updateTask],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const task = getTask(id);
      if (!task) return;

      const now = new Date().toISOString();
      await updateTask(id, {
        metadata: { ...task.metadata, trashed: now },
      });
      setSelectedTaskId(null);
    },
    [getTask, updateTask],
  );

  const handleArchive = useCallback(
    async (id: string) => {
      const task = getTask(id);
      if (!task) return;

      const now = new Date().toISOString();
      await updateTask(id, {
        metadata: { ...task.metadata, archived: now },
      });
      setSelectedTaskId(null);
    },
    [getTask, updateTask],
  );

  const handleUnarchive = useCallback(
    async (id: string) => {
      const task = getTask(id);
      if (!task) return;

      const { archived: _, ...rest } = task.metadata;
      await updateTask(id, { metadata: rest });
      setSelectedTaskId(null);
    },
    [getTask, updateTask],
  );

  const handlePermanentDelete = useCallback(
    async (id: string) => {
      await deleteTask(id);
      setSelectedTaskId(null);
    },
    [deleteTask],
  );

  const handleEmptyTrash = useCallback(async () => {
    await bulkDeleteTasks(tasks.map((t) => t.id));
    setSelectedTaskId(null);
  }, [tasks, bulkDeleteTasks]);

  const handleRestoreFromTrash = useCallback(
    async (id: string) => {
      const task = getTask(id);
      if (!task) return;

      const { trashed: _, ...rest } = task.metadata;
      await updateTask(id, { metadata: rest });
      setSelectedTaskId(null);
    },
    [getTask, updateTask],
  );

  const handleTrashCompleted = useCallback(async () => {
    const now = new Date().toISOString();
    await bulkUpdateTasks(
      tasks.map((t) => t.id),
      (task) => ({ metadata: { ...task.metadata, trashed: now } }),
    );
    setSelectedTaskId(null);
  }, [tasks, bulkUpdateTasks]);

  const handleNavigateUp = useCallback(() => {
    if (selectedIndex > 0) {
      const task = tasks[selectedIndex - 1];
      if (task) setSelectedTaskId(task.id);
    } else if (tasks.length > 0) {
      const task = tasks[0];
      if (task) setSelectedTaskId(task.id);
    }
  }, [tasks, selectedIndex]);

  const handleNavigateDown = useCallback(() => {
    if (selectedIndex < tasks.length - 1) {
      const task = tasks[selectedIndex + 1];
      if (task) setSelectedTaskId(task.id);
    } else if (tasks.length > 0) {
      const task = tasks[tasks.length - 1];
      if (task) setSelectedTaskId(task.id);
    }
  }, [tasks, selectedIndex]);

  const handleNewTask = useCallback(() => {
    openAddModal();
  }, [openAddModal]);

  const handleDeleteTask = useCallback(() => {
    if (selectedTaskId) {
      if (activeView === "trash") {
        handlePermanentDelete(selectedTaskId);
      } else {
        handleDelete(selectedTaskId);
      }
    }
  }, [selectedTaskId, activeView, handleDelete, handlePermanentDelete]);

  const handleArchiveTask = useCallback(() => {
    if (selectedTaskId) {
      if (activeView === "trash") {
        handleRestoreFromTrash(selectedTaskId);
      } else if (activeView === "archived") {
        handleUnarchive(selectedTaskId);
      } else {
        handleArchive(selectedTaskId);
      }
    }
  }, [
    selectedTaskId,
    activeView,
    handleArchive,
    handleUnarchive,
    handleRestoreFromTrash,
  ]);

  const handleClosePanel = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  useKeyboard({
    onNewTask: handleNewTask,
    onDeleteTask: handleDeleteTask,
    onArchiveTask: handleArchiveTask,
    onNavigateUp: handleNavigateUp,
    onNavigateDown: handleNavigateDown,
    onClosePanel: handleClosePanel,
  });

  return (
    <div className="h-full flex relative overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0 select-none">
              {isMobile || collapsed ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="size-5 p-0 border-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
                  aria-label="Toggle sidebar"
                >
                  <Menu className="size-5" />
                </Button>
              ) : (
                <ViewIcon className="size-5 text-muted-foreground shrink-0" />
              )}
              <h1 className="text-xl md:text-2xl font-semibold text-foreground truncate select-none">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {activeView === "completed" && (
                <CompletedTaskFilter
                  projectFilter={completedProjectFilter}
                  onProjectChange={setCompletedProjectFilter}
                  dateRange={completedDateRange}
                  onDateRangeChange={setCompletedDateRange}
                  disabled={rawTasks.length === 0}
                />
              )}
              {isActiveTasksView && (
                <TaskSortMenu disabled={rawTasks.length === 0} />
              )}
              {!isMobile && activeView === "trash" ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowEmptyTrashConfirm(true)}
                  disabled={tasks.length === 0}
                  className="gap-1"
                >
                  <Trash2 className="size-4" />
                  Empty
                </Button>
              ) : !isMobile && activeView === "completed" ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowTrashCompletedConfirm(true)}
                  disabled={tasks.length === 0}
                  className="gap-1"
                >
                  <Trash2 className="size-4" />
                  Trash
                </Button>
              ) : (
                !isMobile && (
                  <Button onClick={openAddModal} className="gap-1">
                    <Plus className="size-4" />
                    Add task
                  </Button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 md:px-6 py-2">
          {!isLoaded ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-3">
              <TaskList
                key={`${currentWorkspaceId ?? ""}-${activeView}`}
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
                onToggleState={handleToggleState}
                onExitingChange={setHasExitingTasks}
              />
            </div>
          )}
        </div>

        {isLoaded &&
          tasks.length === 0 &&
          !hasExitingTasks &&
          !selectedTaskId && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <EmptyState icon={icon} message={emptyMessage} />
            </div>
          )}

        {isMobile && activeView !== "trash" && activeView !== "completed" && (
          <Button
            size="icon"
            aria-label="Add task"
            onClick={openAddModal}
            className="fixed bottom-12 right-8 z-20 size-12 rounded-full shadow-lg active:scale-95 transition-transform duration-100 ease-out"
          >
            <Plus className="size-6" />
          </Button>
        )}
        {isMobile && activeView === "completed" && (
          <Button
            size="icon"
            variant="destructive"
            aria-label="Trash completed tasks"
            onClick={() => setShowTrashCompletedConfirm(true)}
            disabled={tasks.length === 0}
            className="fixed bottom-12 right-8 z-20 size-12 rounded-full shadow-lg active:scale-95 transition-transform duration-100 ease-out"
          >
            <Trash2 className="size-5" />
          </Button>
        )}
        {isMobile && activeView === "trash" && (
          <Button
            size="icon"
            variant="destructive"
            aria-label="Empty trash"
            onClick={() => setShowEmptyTrashConfirm(true)}
            disabled={tasks.length === 0}
            className="fixed bottom-12 right-8 z-20 size-12 rounded-full shadow-lg active:scale-95 transition-transform duration-100 ease-out"
          >
            <Trash2 className="size-5" />
          </Button>
        )}
      </div>

      {displayTask && (
        <TaskDetailPanel
          task={displayTask}
          isOpen={isPanelOpen}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleUpdate}
          onDelete={
            activeView === "trash" ? handlePermanentDelete : handleDelete
          }
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
          onRestore={handleRestoreFromTrash}
          onToggleState={handleToggleState}
        />
      )}

      {isAddModalOpen && (
        <AddTaskModal onClose={closeAddModal} onAdd={handleAddTask} />
      )}

      {showEmptyTrashConfirm && (
        <ConfirmModal
          title="Empty Trash"
          message={`Are you sure you want to permanently delete ${tasks.length} task${tasks.length !== 1 ? "s" : ""}? This action cannot be undone.`}
          confirmLabel="Empty"
          onClose={() => setShowEmptyTrashConfirm(false)}
          onConfirm={async () => {
            await handleEmptyTrash();
            setShowEmptyTrashConfirm(false);
          }}
        />
      )}

      {showTrashCompletedConfirm && (
        <ConfirmModal
          title="Trash Completed"
          message={`Are you sure you want to move ${tasks.length} completed task${tasks.length !== 1 ? "s" : ""} to trash?`}
          confirmLabel="Trash"
          onClose={() => setShowTrashCompletedConfirm(false)}
          onConfirm={async () => {
            await handleTrashCompleted();
            setShowTrashCompletedConfirm(false);
          }}
        />
      )}
    </div>
  );
}

import {
  CheckCircle2,
  Circle,
  CircleDashed,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getDueDateColor, getTaskCheckboxColor } from "../../core/constants";
import { getInitialDueDate } from "../../core/repeat-utils";
import type { TodoItem } from "../../core/types";
import { useDebouncedEffect } from "../../hooks/useDebouncedEffect";
import { useResizablePanel } from "../../hooks/useResizablePanel";
import { useSprinkleStore } from "../../store/sprinkle-store";
import { useAllTags, useProjects } from "../../store/task-store";
import { useWorkspaceStore } from "../../store/workspace-store";
import { useSidebar } from "../layout/Layout";
import PrioritySelect from "./PrioritySelect";
import ProjectSelect from "./ProjectSelect";
import TagSelect from "./TagSelect";

interface TaskDetailPanelProps {
  task: TodoItem;
  isOpen?: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<TodoItem>) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onToggleState: (task: TodoItem) => void;
}

export default function TaskDetailPanel({
  task,
  isOpen = true,
  onClose,
  onUpdate,
  onDelete,
  onArchive,
  onUnarchive,
  onRestore,
  onToggleState,
}: TaskDetailPanelProps) {
  const { isMobile } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showOpen = isOpen && mounted;
  const settings = useWorkspaceStore((s) => s.settings);
  const workspaceTags = Array.isArray(settings?.tags) ? settings.tags : [];
  const projects = useProjects();
  const availableTags = useAllTags(workspaceTags);

  const [prevTaskId, setPrevTaskId] = useState(task.id);
  const [title, setTitle] = useState(task.title);
  const [body, setBody] = useState(task.body);

  const taskIdRef = useRef(task.id);
  taskIdRef.current = task.id;

  if (prevTaskId !== task.id) {
    setPrevTaskId(task.id);
    setTitle(task.title);
    setBody(task.body);
  }

  useDebouncedEffect(
    () => {
      if (taskIdRef.current === task.id && title !== task.title) {
        onUpdate(task.id, { title });
      }
    },
    500,
    [title, task.id, task.title, onUpdate],
  );

  useDebouncedEffect(
    () => {
      if (taskIdRef.current === task.id && body !== task.body) {
        onUpdate(task.id, { body });
      }
    },
    500,
    [body, task.id, task.body, onUpdate],
  );

  const handlePriorityChange = useCallback(
    (priority: import("../../core/types").Priority | undefined) => {
      onUpdate(task.id, {
        metadata: { ...task.metadata, priority },
      });
    },
    [task.id, task.metadata, onUpdate],
  );

  const handleDateAndRepeatChange = useCallback(
    (date: string, repeat: string) => {
      onUpdate(task.id, {
        metadata: {
          ...task.metadata,
          due: date || undefined,
          repeat: repeat || undefined,
        },
      });
    },
    [task.id, task.metadata, onUpdate],
  );

  const handleDateChange = useCallback(
    (value: string) => {
      onUpdate(task.id, {
        metadata: {
          ...task.metadata,
          due: value || undefined,
          ...(!value ? { repeat: undefined } : {}),
        },
      });
    },
    [task.id, task.metadata, onUpdate],
  );

  const handleRepeatChange = useCallback(
    (value: string) => {
      const nextDue =
        value && !task.metadata.due
          ? getInitialDueDate(value)
          : task.metadata.due;
      onUpdate(task.id, {
        metadata: {
          ...task.metadata,
          repeat: value || undefined,
          due: nextDue || undefined,
        },
      });
    },
    [task.id, task.metadata, onUpdate],
  );

  const handleProjectChange = useCallback(
    (projectId: string) => {
      onUpdate(task.id, { projectId });
    },
    [task.id, onUpdate],
  );

  const handleTagsChange = useCallback(
    (tags: string[]) => {
      onUpdate(task.id, {
        metadata: {
          ...task.metadata,
          tags: tags.length > 0 ? tags : undefined,
        },
      });
    },
    [task.id, task.metadata, onUpdate],
  );

  const currentTags = task.metadata.tags ?? [];

  const {
    width,
    isDragging,
    handlePointerDown,
    handleDoubleClick,
    handleKeyDown,
    minWidth,
    maxWidth,
  } = useResizablePanel({ disabled: isMobile });

  const isArchived = !!task.metadata.archived;
  const isTrashed = !!task.metadata.trashed;
  const isDone = task.state === "done";
  const checkboxColor = getTaskCheckboxColor(
    task.metadata.priority,
    task.state,
  );

  const handleCheckboxClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (task.state !== "done") {
      const isSprinkleEnabled = settings?.sprinkleEffect ?? true;
      if (isSprinkleEnabled) {
        const buttonRect = e.currentTarget.getBoundingClientRect();
        const x = Math.round(buttonRect.left + buttonRect.width / 2);
        const y = Math.round(buttonRect.top + buttonRect.height / 2);

        useSprinkleStore.getState?.()?.triggerSprinkle({
          x,
          y,
          priority: task.metadata.priority,
        });
      }
    }
    onToggleState(task);
  };

  return (
    <>
      {isMobile && (
        <button
          type="button"
          aria-label="Close task details"
          onClick={onClose}
          className={cn(
            "fixed inset-0 bg-black/20 z-40 md:hidden transition-opacity duration-200 ease-out",
            showOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        />
      )}

      {!isMobile && (
        <div
          aria-hidden={!showOpen}
          className={cn(
            "relative shrink-0 h-full hidden md:block",
            !isDragging && "transition-[width] duration-200 ease-out",
          )}
          style={{ width: showOpen ? `${width}px` : 0 }}
        />
      )}

      <div
        aria-hidden={!showOpen}
        style={!isMobile ? { width: `${width}px` } : undefined}
        className={cn(
          "flex flex-col bg-background",
          isMobile
            ? "fixed inset-0 z-50"
            : "absolute inset-y-0 right-0 z-20 border-l border-border",
          !isDragging && "transition-transform duration-200 ease-out",
          showOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
        )}
      >
        {!isMobile && (
          // biome-ignore lint/a11y/useSemanticElements: interactive resizable splitter handle requires role="separator" with aria-valuenow
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize task details panel"
            aria-valuenow={Math.round(width)}
            aria-valuemin={minWidth}
            aria-valuemax={maxWidth}
            tabIndex={0}
            title="Drag to resize • Double-click to reset"
            onPointerDown={handlePointerDown}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            className="absolute -left-1.5 top-0 bottom-0 w-3 z-30 cursor-col-resize select-none flex items-center justify-center group focus:outline-none"
          >
            <div
              className={`w-0.5 h-full transition-colors duration-150 ${
                isDragging
                  ? "bg-primary/50"
                  : "bg-transparent group-hover:bg-primary/50 group-focus-visible:bg-primary/50"
              }`}
            />
          </div>
        )}

        {/* Top Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 p-0 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95"
              onClick={handleCheckboxClick}
              aria-label={
                task.state === "done" ? "Mark as not done" : "Mark as done"
              }
            >
              {isDone ? (
                <CheckCircle2 className={`size-5 ${checkboxColor}`} />
              ) : isArchived ? (
                <CircleDashed className={`size-5 ${checkboxColor}`} />
              ) : (
                <Circle className={`size-5 ${checkboxColor}`} />
              )}
            </Button>

            <span className="pl-2 text-muted-foreground/30 select-none">|</span>

            <DatePicker
              value={task.metadata.due ?? ""}
              onChange={handleDateChange}
              repeat={task.metadata.repeat ?? ""}
              onRepeatChange={handleRepeatChange}
              onDateAndRepeatChange={handleDateAndRepeatChange}
              variant="ghost"
              placeholder="Date"
              triggerClassName={`h-8 gap-1.5 ${
                task.metadata.due
                  ? isDone
                    ? "text-muted-foreground"
                    : getDueDateColor(task.metadata.due)
                  : "text-muted-foreground"
              }`}
            />
          </div>

          <div className="flex items-center gap-1">
            <PrioritySelect
              value={task.metadata.priority}
              onChange={handlePriorityChange}
              variant="toolbar"
              isDone={isDone}
            />

            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-4 flex flex-col">
          <div className="flex-1 flex flex-col">
            <Textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="No Title"
              aria-label="Task title"
              rows={1}
              className={`w-full text-xl md:text-xl font-medium leading-7 bg-transparent outline-none resize-none border-0 rounded-none px-0 py-0 min-h-0 placeholder:text-muted-foreground/60 transition-colors duration-200 ease-out ${
                isDone ? "text-muted-foreground" : "text-foreground"
              }`}
            />

            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Description"
              aria-label="Task description"
              rows={6}
              className={`w-full text-base md:text-base bg-transparent outline-none resize-none border-0 rounded-none px-0 pt-2 pb-0 min-h-12 placeholder:text-muted-foreground/60 flex-1 transition-colors duration-200 ease-out ${
                isDone ? "text-muted-foreground" : "text-foreground"
              }`}
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-3.5 py-2.5 flex items-center justify-between">
          <ProjectSelect
            value={task.projectId}
            onChange={handleProjectChange}
            projects={projects}
            isDone={isDone}
          />

          <div className="flex items-center gap-1">
            <TagSelect
              value={currentTags}
              onChange={handleTagsChange}
              availableTags={availableTags}
              variant="toolbar"
              isDone={isDone}
            />

            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="More options"
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {isTrashed ? (
                  <DropdownMenuItem
                    onClick={() =>
                      onRestore ? onRestore(task.id) : onArchive(task.id)
                    }
                  >
                    <span>Restore</span>
                  </DropdownMenuItem>
                ) : isArchived ? (
                  <DropdownMenuItem
                    onClick={() =>
                      onUnarchive ? onUnarchive(task.id) : onArchive(task.id)
                    }
                  >
                    <span>Unarchive</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onArchive(task.id)}>
                    <span>Archive</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(task.id)}
                >
                  <span>{isTrashed ? "Delete permanently" : "Delete"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}

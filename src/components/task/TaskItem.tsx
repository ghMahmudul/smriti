import {
  Calendar,
  CheckCircle2,
  Circle,
  CircleDashed,
  Repeat,
} from "lucide-react";
import { memo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  formatDate,
  getDueDateColor,
  getTaskCheckboxColor,
} from "../../core/constants";
import { getProjectIcon, getTagIcon } from "../../core/icons";
import type { TodoItem } from "../../core/types";
import { useSprinkleStore } from "../../store/sprinkle-store";
import { useWorkspaceStore } from "../../store/workspace-store";

export const MAX_PREVIEW_WORDS = 15;

export function getTaskDescriptionPreview(
  body: string | undefined,
  maxWords = MAX_PREVIEW_WORDS,
): string | undefined {
  if (!body || maxWords <= 0) return undefined;
  const trimmed = body.trim();
  if (!trimmed) return undefined;

  const words: string[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null = regex.exec(trimmed);

  while (match !== null) {
    words.push(match[0]);
    if (words.length > maxWords) {
      break;
    }
    match = regex.exec(trimmed);
  }

  if (words.length === 0) return undefined;

  if (words.length <= maxWords) {
    return words.join(" ");
  }

  const truncated = words
    .slice(0, maxWords)
    .join(" ")
    .replace(/[.,;:!?]+$/, "");
  return `${truncated}...`;
}

interface TaskItemProps {
  task: TodoItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleState: (task: TodoItem) => void;
  showSeparator?: boolean;
  isCompleting?: boolean;
}

function TaskItemComponent({
  task,
  isSelected,
  onSelect,
  onToggleState,
  showSeparator = false,
  isCompleting = false,
}: TaskItemProps) {
  const settings = useWorkspaceStore((s) => s.settings);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected) {
      itemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isSelected]);

  const isArchived = !!task.metadata.archived;
  const isTrashed = !!task.metadata.trashed;
  const isDone =
    task.state === "done" || (isCompleting && !isArchived && !isTrashed);
  const Icon = isDone ? CheckCircle2 : isArchived ? CircleDashed : Circle;
  const iconColor = isDone
    ? getTaskCheckboxColor(task.metadata.priority, "done")
    : getTaskCheckboxColor(task.metadata.priority, task.state);
  const preview = getTaskDescriptionPreview(task.body);

  const hasMeta = !!(
    task.metadata.due ||
    task.metadata.repeat ||
    (task.metadata.tags && task.metadata.tags.length > 0)
  );
  const isDescriptionLast = !hasMeta && !!preview;
  const isTitleLast = !hasMeta && !preview;

  const isInbox = task.projectId.toLowerCase() === "inbox";
  const projectName = isInbox ? "Inbox" : task.projectId;
  const ProjectIcon = getProjectIcon(task.projectId, settings?.projectIcons);

  const projectBadge = (
    <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground min-h-6 self-end">
      <span className="text-xs truncate max-w-25" title={projectName}>
        {projectName}
      </span>
      <ProjectIcon className="size-3.5" />
    </div>
  );

  const handleCheckboxClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isCompleting) return;
    if (task.state !== "done") {
      const isSprinkleEnabled =
        useWorkspaceStore.getState().settings?.sprinkleEffect ?? true;
      if (isSprinkleEnabled) {
        const buttonRect = e.currentTarget.getBoundingClientRect();
        const x = Math.round(buttonRect.left + buttonRect.width / 2);
        const y = Math.round(buttonRect.top + buttonRect.height / 2);

        useSprinkleStore.getState().triggerSprinkle({
          x,
          y,
          priority: task.metadata.priority,
        });
      }
    }
    onToggleState(task);
  };

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-out",
        isCompleting ? "grid-rows-[0fr] delay-100" : "grid-rows-[1fr]",
      )}
    >
      <div className="overflow-hidden">
        {showSeparator && (
          <div className="px-3">
            <Separator className="bg-border/50 dark:bg-border/60" />
          </div>
        )}
        {/* biome-ignore lint/a11y/useSemanticElements: task row contains a nested checkbox button which cannot be inside a native <button> */}
        <div
          ref={itemRef}
          role="button"
          tabIndex={0}
          data-testid="task-item"
          onClick={() => onSelect(task.id)}
          onKeyDown={(e) => {
            if (
              e.target === e.currentTarget &&
              (e.key === "Enter" || e.key === " ")
            ) {
              e.preventDefault();
              onSelect(task.id);
            }
          }}
          className={cn(
            "group flex items-start gap-3 py-2.5 pl-2.5 pr-3.5 rounded-lg cursor-pointer select-none",
            "transition-all duration-300 ease-out w-full text-left",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-transparent origin-center",
            isSelected ? "bg-muted" : "bg-transparent hover:bg-muted/60",
            isCompleting &&
              "scale-[0.88] opacity-0 delay-75 pointer-events-none",
            task.parentId && "ml-6 pl-3 border-l-2 border-muted-foreground/20",
          )}
        >
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCheckboxClick}
            disabled={isCompleting}
            aria-label={
              task.state === "done" ? "Mark as not done" : "Mark as done"
            }
            className="size-6 p-0 rounded-full shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-transform active:scale-95"
          >
            <Icon
              className={cn(
                `size-5 ${iconColor}`,
                isCompleting && "animate-in zoom-in-75 duration-200 ease-out",
              )}
            />
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between min-h-6 gap-2">
              <span
                title={task.title || undefined}
                className={`text-sm truncate transition-colors duration-200 ease-out flex-1 min-w-0 ${
                  isDone ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {task.title || (
                  <span className="text-muted-foreground">No Title</span>
                )}
              </span>
              {isTitleLast && projectBadge}
            </div>

            {preview && (
              <div
                className={cn(
                  "mt-0.5",
                  isDescriptionLast &&
                    "flex items-center justify-between gap-2 min-h-6",
                )}
              >
                <p
                  title={task.body?.trim() || undefined}
                  className="text-xs text-muted-foreground truncate flex-1 min-w-0"
                >
                  {preview}
                </p>
                {isDescriptionLast && projectBadge}
              </div>
            )}

            {hasMeta && (
              <div className="flex items-center justify-between gap-3 mt-1.5 min-h-6">
                <div className="flex items-center gap-3 flex-wrap min-w-0 flex-1">
                  {task.metadata.due && (
                    <span
                      className={`flex items-center gap-1 text-xs tabular-nums ${
                        isDone
                          ? "text-muted-foreground"
                          : getDueDateColor(task.metadata.due)
                      }`}
                    >
                      <Calendar className="size-3" />
                      {formatDate(task.metadata.due)}
                      {task.metadata.repeat && <Repeat className="size-3" />}
                    </span>
                  )}
                  {!task.metadata.due && task.metadata.repeat && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Repeat className="size-3" />
                      Repeats
                    </span>
                  )}
                  {task.metadata.tags &&
                    task.metadata.tags.length > 0 &&
                    task.metadata.tags.map((tag) => {
                      const TagIcon = getTagIcon(tag, settings?.tagIcons);
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                        >
                          <TagIcon className="size-2.5" />
                          {tag}
                        </span>
                      );
                    })}
                </div>
                {projectBadge}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TaskItemComponent);

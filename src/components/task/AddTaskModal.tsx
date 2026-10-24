import { SendHorizontal } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getDueDateColor } from "../../core/constants";
import { getInitialDueDate } from "../../core/repeat-utils";
import type { Priority } from "../../core/types";
import { useTaskDraftStore } from "../../store/task-draft-store";
import { useAllTags, useProjects, useTaskStore } from "../../store/task-store";
import { useWorkspaceStore } from "../../store/workspace-store";
import { useSidebar } from "../layout/Layout";
import PrioritySelect from "./PrioritySelect";
import ProjectSelect from "./ProjectSelect";
import TagSelect from "./TagSelect";
import TaskShortcutDropdown from "./TaskShortcutDropdown";
import { useTaskShortcuts } from "./useTaskShortcuts";

export interface AddTaskModalProps {
  onClose?: () => void;
  onAdd: (task: {
    title: string;
    body: string;
    projectId: string;
    priority?: Priority;
    due?: string;
    repeat?: string;
    tags?: string[];
  }) => void;
  defaultProject?: string;
  project?: string;
  onProjectChange?: (project: string) => void;
  onCreateProject?: (name: string) => void | Promise<void>;
  onCreateTag?: (name: string) => void | Promise<void>;
  title?: string;
  onTitleChange?: (title: string) => void;
  description?: string;
  onDescriptionChange?: (description: string) => void;
  priority?: Priority;
  onPriorityChange?: (priority: Priority | undefined) => void;
  due?: string;
  onDueChange?: (due: string) => void;
  repeat?: string;
  onRepeatChange?: (repeat: string) => void;
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;
}

export default function AddTaskModal({
  onClose,
  onAdd,
  defaultProject,
  project: propProject,
  onProjectChange: propOnProjectChange,
  onCreateProject: propOnCreateProject,
  onCreateTag: propOnCreateTag,
  title: propTitle,
  onTitleChange: propOnTitleChange,
  description: propDescription,
  onDescriptionChange: propOnDescriptionChange,
  priority: propPriority,
  onPriorityChange: propOnPriorityChange,
  due: propDue,
  onDueChange: propOnDueChange,
  repeat: propRepeat,
  onRepeatChange: propOnRepeatChange,
  selectedTags: propSelectedTags,
  onTagsChange: propOnTagsChange,
}: AddTaskModalProps) {
  const storeDraft = useTaskDraftStore((s) => s.draft);
  const setDraftField = useTaskDraftStore((s) => s.setDraftField);
  const setDraft = useTaskDraftStore((s) => s.setDraft);
  const storeCloseModal = useTaskDraftStore((s) => s.closeModal);
  const storeCreateProject = useTaskStore((s) => s.createProject);
  const handleCreateProject = propOnCreateProject ?? storeCreateProject;
  const storeAddTag = useWorkspaceStore((s) => s.addTag);
  const handleCreateTag = propOnCreateTag ?? storeAddTag;

  const title = propTitle !== undefined ? propTitle : storeDraft.title;
  const onTitleChange =
    propOnTitleChange ?? ((v: string) => setDraftField("title", v));

  const description =
    propDescription !== undefined ? propDescription : storeDraft.description;
  const onDescriptionChange =
    propOnDescriptionChange ?? ((v: string) => setDraftField("description", v));

  const priority =
    propPriority !== undefined ? propPriority : storeDraft.priority;
  const onPriorityChange =
    propOnPriorityChange ??
    ((v: Priority | undefined) => setDraftField("priority", v));

  const due = propDue !== undefined ? propDue : (storeDraft.due ?? "");
  const onDueChange =
    propOnDueChange ?? ((v: string) => setDraftField("due", v));

  const repeat =
    propRepeat !== undefined ? propRepeat : (storeDraft.repeat ?? "");
  const onRepeatChange =
    propOnRepeatChange ??
    ((v: string) => setDraftField("repeat", v || undefined));

  const handleDateAndRepeatChange = (newDue: string, newRepeat: string) => {
    if (propOnDueChange || propOnRepeatChange) {
      propOnDueChange?.(newDue);
      propOnRepeatChange?.(newRepeat);
    } else {
      setDraft({
        due: newDue || undefined,
        repeat: newRepeat || undefined,
      });
    }
  };

  const handleDueChange = (v: string) => {
    if (!v && repeat) {
      handleDateAndRepeatChange("", "");
    } else {
      onDueChange(v);
    }
  };

  const handleRepeatChange = (v: string) => {
    if (v && !due) {
      handleDateAndRepeatChange(getInitialDueDate(v), v);
    } else {
      onRepeatChange(v);
    }
  };

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isProjectSelectOpen, setIsProjectSelectOpen] = useState(false);
  const [isPrioritySelectOpen, setIsPrioritySelectOpen] = useState(false);
  const [isTagSelectOpen, setIsTagSelectOpen] = useState(false);

  const selectedTags =
    propSelectedTags !== undefined ? propSelectedTags : storeDraft.tags;
  const onTagsChange =
    propOnTagsChange ?? ((v: string[]) => setDraftField("tags", v));

  const [internalProjectId, setInternalProjectId] = useState(
    defaultProject ?? storeDraft.projectId ?? "Inbox",
  );
  const projectId =
    propProject !== undefined
      ? propProject
      : storeDraft.projectId || internalProjectId;
  const setProjectId =
    propOnProjectChange ??
    ((v: string) => {
      setDraftField("projectId", v);
      setInternalProjectId(v);
    });

  const handleClose = onClose ?? storeCloseModal;

  const settings = useWorkspaceStore((s) => s.settings);
  const workspaceTags = Array.isArray(settings?.tags) ? settings.tags : [];
  const projects = useProjects();
  const availableTags = useAllTags(workspaceTags);
  const allAvailableTags = Array.from(
    new Set([...availableTags, ...selectedTags]),
  ).sort();
  const { isMobile } = useSidebar();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);

  const shortcuts = useTaskShortcuts({
    title,
    onTitleChange,
    onPriorityChange,
    onDueChange: handleDueChange,
    onRepeatChange: handleRepeatChange,
    setProjectId,
    onCreateProject: handleCreateProject,
    onCreateTag: handleCreateTag,
    selectedTags,
    onTagsChange,
    projects,
    availableTags: allAvailableTags,
    projectIcons: settings?.projectIcons,
    tagIcons: settings?.tagIcons,
    textareaRef: titleRef,
    containerRef: titleContainerRef,
  });

  const isChildOverlayOpen =
    isDatePickerOpen ||
    isProjectSelectOpen ||
    isPrioritySelectOpen ||
    isTagSelectOpen ||
    shortcuts.isOpen;

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (!trimmedTitle && !trimmedDescription) return;
    onAdd({
      title: trimmedTitle,
      body: trimmedDescription,
      projectId,
      priority,
      due: due || undefined,
      repeat: repeat || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });
    handleClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (shortcuts.handleKeyDown(e)) {
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      descriptionRef.current?.focus();
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    const cursorPos = e.target.selectionEnd;
    onTitleChange(newTitle);
    shortcuts.checkShortcuts(newTitle, cursorPos);
  };

  const handleTitleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    shortcuts.checkShortcuts(target.value, target.selectionEnd);
  };

  const handleTitleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "Home" ||
      e.key === "End"
    ) {
      const target = e.currentTarget;
      shortcuts.checkShortcuts(target.value, target.selectionEnd);
    }
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog
      open
      disablePointerDismissal={isChildOverlayOpen}
      onOpenChange={(open, eventDetails) => {
        if (!open) {
          if (
            isChildOverlayOpen &&
            (eventDetails.reason === "outside-press" ||
              eventDetails.reason === "escape-key")
          ) {
            eventDetails.cancel();
            return;
          }
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 md:px-6 pt-4 md:pt-5 sr-only">
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>

        <div className="px-5 md:px-6 pt-4 md:pt-5">
          <div ref={titleContainerRef} className="relative">
            <Textarea
              ref={titleRef}
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleKeyDown}
              onKeyUp={handleTitleKeyUp}
              onClick={handleTitleClick}
              placeholder="Next thing to do"
              rows={1}
              autoFocus
              aria-expanded={shortcuts.isOpen}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-controls={
                shortcuts.isOpen ? "task-shortcut-dropdown" : undefined
              }
              aria-activedescendant={shortcuts.activeDescendantId}
              className="w-full text-xl md:text-xl font-medium leading-7 bg-transparent outline-none resize-none border-0 rounded-none px-0 py-0 min-h-0 placeholder:text-muted-foreground/60"
            />
            {shortcuts.isOpen && shortcuts.activeShortcut && (
              <TaskShortcutDropdown
                isOpen={shortcuts.isOpen}
                items={shortcuts.items}
                activeIndex={shortcuts.activeIndex}
                onSelectIndex={(index) => {
                  shortcuts.items[index]?.action();
                }}
                onHoverIndex={shortcuts.setActiveIndex}
                onClose={shortcuts.closeShortcut}
                position={shortcuts.position}
                textareaRef={titleRef}
              />
            )}
          </div>
        </div>

        <div className="px-5 md:px-6 pt-2 flex-1 overflow-y-auto">
          <Textarea
            value={description}
            ref={descriptionRef}
            onChange={(e) => onDescriptionChange(e.target.value)}
            onKeyDown={handleDescriptionKeyDown}
            placeholder="Description"
            rows={2}
            className="w-full text-base md:text-base bg-transparent outline-none resize-none border-0 rounded-none px-0 py-0 min-h-12 placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="px-4 md:px-3 py-3 md:py-4 flex items-center gap-2 md:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-0 overflow-x-auto [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max items-center gap-0">
              <ProjectSelect
                value={projectId}
                onChange={setProjectId}
                projects={projects}
                variant="inline"
                open={isProjectSelectOpen}
                onOpenChange={setIsProjectSelectOpen}
              />

              <DatePicker
                value={due}
                onChange={handleDueChange}
                repeat={repeat}
                onRepeatChange={handleRepeatChange}
                onDateAndRepeatChange={handleDateAndRepeatChange}
                open={isDatePickerOpen}
                onOpenChange={setIsDatePickerOpen}
                triggerClassName={
                  due ? `h-8 gap-1.5 ${getDueDateColor(due)}` : "h-8"
                }
              />

              <PrioritySelect
                value={priority}
                onChange={onPriorityChange}
                variant="inline"
                open={isPrioritySelectOpen}
                onOpenChange={setIsPrioritySelectOpen}
              />

              <TagSelect
                value={selectedTags}
                onChange={onTagsChange}
                availableTags={allAvailableTags}
                variant="inline"
                open={isTagSelectOpen}
                onOpenChange={setIsTagSelectOpen}
              />
            </div>
          </div>

          <Button
            aria-label="Add"
            onClick={handleSubmit}
            disabled={!title.trim() && !description.trim()}
            size="sm"
            className="h-8 shrink-0 px-4"
          >
            {isMobile ? <SendHorizontal className="size-5" /> : "Add"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

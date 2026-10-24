import {
  Ban,
  CalendarDays,
  Calendar as CalendarIcon,
  Flag,
  Folder,
  Inbox,
  Plus,
  Repeat,
  Sun,
  Sunrise,
  Tag,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PRIORITY_OPTIONS } from "@/core/constants";
import {
  getFutureLocalDateString,
  getTodayLocalDateString,
} from "@/core/date-utils";
import { getProjectIcon, getTagIcon } from "@/core/icons";
import { REPEAT_PRESETS } from "@/core/repeat-utils";
import type { Priority } from "@/core/types";
import { type CaretCoordinates, getCaretCoordinates } from "@/lib/caret";
import {
  type ActiveShortcut,
  detectShortcutToken,
  removeTokenFromText,
  type ShortcutItem,
  type ShortcutTrigger,
} from "./task-shortcut-types";

export interface UseTaskShortcutsOptions {
  title: string;
  onTitleChange: (title: string) => void;
  onPriorityChange: (priority: Priority | undefined) => void;
  onDueChange: (due: string) => void;
  onRepeatChange?: (repeat: string) => void;
  setProjectId: (projectId: string) => void;
  onCreateProject?: (name: string) => void | Promise<void>;
  onCreateTag?: (name: string) => void | Promise<void>;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  projects: string[];
  availableTags: string[];
  projectIcons?: Record<string, string>;
  tagIcons?: Record<string, string>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useTaskShortcuts({
  title,
  onTitleChange,
  onPriorityChange,
  onDueChange,
  onRepeatChange,
  setProjectId,
  onCreateProject,
  onCreateTag,
  selectedTags,
  onTagsChange,
  projects,
  availableTags,
  projectIcons,
  tagIcons,
  textareaRef,
  containerRef,
}: UseTaskShortcutsOptions) {
  const [activeShortcut, setActiveShortcut] = useState<ActiveShortcut | null>(
    null,
  );
  const [caretCoords, setCaretCoords] = useState<CaretCoordinates>({
    top: 0,
    left: 0,
    height: 24,
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const checkShortcuts = useCallback(
    (text: string, cursorPos: number) => {
      const detected = detectShortcutToken(text, cursorPos);
      if (detected) {
        setActiveShortcut((prev) => {
          if (
            prev?.trigger === "*" &&
            prev?.subMode === "repeat" &&
            detected.trigger === "*" &&
            detected.startIndex === prev.startIndex
          ) {
            return {
              ...detected,
              subMode: "repeat",
            };
          }
          return detected;
        });
        setActiveIndex(0);
        if (textareaRef.current) {
          const coords = getCaretCoordinates(textareaRef.current, cursorPos);
          setCaretCoords(coords);
        }
      } else {
        setActiveShortcut(null);
      }
    },
    [textareaRef],
  );

  const removeCurrentToken = useCallback(() => {
    if (!activeShortcut) return;
    const { startIndex, endIndex, text: shortcutText } = activeShortcut;
    const currentText = shortcutText || textareaRef.current?.value || title;
    const { newText, newCursorPos } = removeTokenFromText(
      currentText,
      startIndex,
      endIndex,
    );

    onTitleChange(newText);
    setActiveShortcut(null);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  }, [activeShortcut, title, onTitleChange, textareaRef]);

  const replaceWithTrigger = useCallback(
    (nextTrigger: ShortcutTrigger) => {
      if (!activeShortcut) return;
      const { startIndex, endIndex, text: shortcutText } = activeShortcut;
      const currentText = shortcutText || textareaRef.current?.value || title;
      const newText =
        currentText.slice(0, startIndex) +
        nextTrigger +
        currentText.slice(endIndex);
      const newCursor = startIndex + nextTrigger.length;

      onTitleChange(newText);

      const nextShortcut: ActiveShortcut = {
        trigger: nextTrigger,
        query: "",
        startIndex,
        endIndex: newCursor,
        text: newText,
      };
      setActiveShortcut(nextShortcut);
      setActiveIndex(0);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursor, newCursor);
          const coords = getCaretCoordinates(textareaRef.current, newCursor);
          setCaretCoords(coords);
        }
      });
    },
    [activeShortcut, title, onTitleChange, textareaRef],
  );

  const switchToRepeat = useCallback(() => {
    if (!activeShortcut) return;
    const { startIndex, endIndex, text: shortcutText } = activeShortcut;
    const currentText = shortcutText || textareaRef.current?.value || title;
    const newText = `${currentText.slice(0, startIndex)}*${currentText.slice(endIndex)}`;
    const newCursor = startIndex + 1;

    onTitleChange(newText);

    const nextShortcut: ActiveShortcut = {
      trigger: "*",
      subMode: "repeat",
      query: "",
      startIndex,
      endIndex: newCursor,
      text: newText,
    };
    setActiveShortcut(nextShortcut);
    setActiveIndex(0);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursor, newCursor);
        const coords = getCaretCoordinates(textareaRef.current, newCursor);
        setCaretCoords(coords);
      }
    });
  }, [activeShortcut, title, onTitleChange, textareaRef]);

  const items = useMemo<ShortcutItem[]>(() => {
    if (!activeShortcut) return [];
    const { trigger, query } = activeShortcut;
    const q = query.toLowerCase().trim();

    if (trigger === "/") {
      const rootOptions: ShortcutItem[] = [
        {
          id: "date",
          label: "Date",
          icon: CalendarIcon,
          action: () => replaceWithTrigger("*"),
        },
        {
          id: "priority",
          label: "Priority",
          icon: Flag,
          action: () => replaceWithTrigger("!"),
        },
        {
          id: "project",
          label: "Project",
          icon: Folder,
          action: () => replaceWithTrigger("+"),
        },
        {
          id: "tag",
          label: "Tag",
          icon: Tag,
          action: () => replaceWithTrigger("#"),
        },
      ];

      if (!q) return rootOptions;
      return rootOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          (q === "*" && opt.id === "date") ||
          (q === "!" && opt.id === "priority") ||
          (q === "+" && opt.id === "project") ||
          (q === "#" && opt.id === "tag"),
      );
    }

    if (trigger === "!") {
      const priorityOptions: ShortcutItem[] = [
        ...PRIORITY_OPTIONS.map((opt) => ({
          id: opt.value,
          label: opt.label,
          color: opt.color,
          icon: Flag,
          action: () => {
            onPriorityChange(opt.value);
            removeCurrentToken();
          },
        })),
        {
          id: "none",
          label: "None",
          color: "text-muted-foreground",
          icon: Flag,
          action: () => {
            onPriorityChange(undefined);
            removeCurrentToken();
          },
        },
      ];

      if (!q) return priorityOptions;
      return priorityOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          (q === "1" && opt.id === "high") ||
          (q === "2" && opt.id === "medium") ||
          (q === "3" && opt.id === "low"),
      );
    }

    if (trigger === "*") {
      const repeatOptions: ShortcutItem[] = [
        ...REPEAT_PRESETS.map((preset) => ({
          id: preset.value,
          label: preset.label,
          icon: Repeat,
          action: () => {
            onRepeatChange?.(preset.value);
            removeCurrentToken();
          },
        })),
        {
          id: "none",
          label: "None",
          color: "text-muted-foreground",
          icon: Ban,
          action: () => {
            onRepeatChange?.("");
            removeCurrentToken();
          },
        },
      ];

      if (activeShortcut.subMode === "repeat") {
        if (!q) return repeatOptions;
        return repeatOptions.filter((opt) =>
          opt.label.toLowerCase().includes(q),
        );
      }

      const baseDateOptions: ShortcutItem[] = [
        {
          id: "today",
          label: "Today",
          icon: Sun,
          action: () => {
            onDueChange(getTodayLocalDateString());
            removeCurrentToken();
          },
        },
        {
          id: "tomorrow",
          label: "Tomorrow",
          icon: Sunrise,
          action: () => {
            onDueChange(getFutureLocalDateString(1));
            removeCurrentToken();
          },
        },
        {
          id: "next-week",
          label: "Next Week",
          icon: CalendarDays,
          action: () => {
            onDueChange(getFutureLocalDateString(7));
            removeCurrentToken();
          },
        },
        {
          id: "repeat",
          label: "Repeat",
          icon: Repeat,
          action: () => {
            switchToRepeat();
          },
        },
        {
          id: "no-date",
          label: "No Date",
          icon: Ban,
          action: () => {
            onDueChange("");
            removeCurrentToken();
          },
        },
      ];

      if (!q) return baseDateOptions;

      const filtered = baseDateOptions.filter((opt) =>
        opt.label.toLowerCase().includes(q),
      );
      if (filtered.length > 0) return filtered;

      return repeatOptions.filter((opt) => opt.label.toLowerCase().includes(q));
    }

    if (trigger === "+") {
      const projectOptions: ShortcutItem[] = [
        {
          id: "inbox",
          label: "Inbox",
          icon: Inbox,
          action: () => {
            setProjectId("Inbox");
            removeCurrentToken();
          },
        },
        ...projects.map((p) => ({
          id: p,
          label: p,
          icon: getProjectIcon(p, projectIcons),
          action: () => {
            setProjectId(p);
            removeCurrentToken();
          },
        })),
      ];

      const filtered = q
        ? projectOptions.filter((opt) => opt.label.toLowerCase().includes(q))
        : projectOptions;

      const rawProject = query.trim();
      const isInbox = q === "inbox";
      const matchesExisting =
        isInbox || projects.some((p) => p.toLowerCase() === q);

      if (rawProject && !matchesExisting) {
        filtered.push({
          id: `create-project-${q}`,
          label: `Create Project "${rawProject}"`,
          icon: Plus,
          action: async () => {
            try {
              await onCreateProject?.(rawProject);
              setProjectId(rawProject);
              removeCurrentToken();
            } catch (e) {
              toast.error((e as Error).message || "Failed to create project");
            }
          },
        });
      }

      return filtered;
    }

    if (trigger === "#") {
      const tagOptions: ShortcutItem[] = availableTags.map((t) => ({
        id: t,
        label: t,
        icon: getTagIcon(t, tagIcons),
        action: () => {
          if (!selectedTags.includes(t)) {
            onTagsChange([...selectedTags, t]);
          }
          removeCurrentToken();
        },
      }));

      const filtered = q
        ? tagOptions.filter((opt) => opt.label.toLowerCase().includes(q))
        : tagOptions;

      const rawTag = query.trim().replace(/,/g, "");
      if (rawTag && !availableTags.some((t) => t.toLowerCase() === q)) {
        filtered.push({
          id: `create-tag-${q}`,
          label: `Create Tag "${rawTag}"`,
          icon: Plus,
          action: async () => {
            try {
              await onCreateTag?.(rawTag);
              if (!selectedTags.includes(rawTag)) {
                onTagsChange([...selectedTags, rawTag]);
              }
              removeCurrentToken();
            } catch (e) {
              toast.error((e as Error).message || "Failed to create tag");
            }
          },
        });
      }

      return filtered;
    }

    return [];
  }, [
    activeShortcut,
    projects,
    selectedTags,
    availableTags,
    projectIcons,
    tagIcons,
    replaceWithTrigger,
    switchToRepeat,
    removeCurrentToken,
    onPriorityChange,
    onDueChange,
    onRepeatChange,
    setProjectId,
    onCreateProject,
    onCreateTag,
    onTagsChange,
  ]);

  useEffect(() => {
    setActiveIndex((prev) => (prev >= items.length ? 0 : prev));
  }, [items.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!activeShortcut) return false;

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setActiveShortcut(null);
        return true;
      }

      if (
        e.key === "Backspace" &&
        activeShortcut.subMode === "repeat" &&
        !activeShortcut.query
      ) {
        e.preventDefault();
        setActiveShortcut({
          ...activeShortcut,
          subMode: undefined,
        });
        setActiveIndex(3);
        return true;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (items.length > 0) {
          setActiveIndex((prev) => (prev + 1) % items.length);
        }
        return true;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (items.length > 0) {
          setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
        }
        return true;
      }

      if (e.key === "Enter" || e.key === "Tab") {
        if (items.length > 0 && items[activeIndex]) {
          e.preventDefault();
          items[activeIndex].action();
          return true;
        }
        setActiveShortcut(null);
        return false;
      }

      return false;
    },
    [activeShortcut, items, activeIndex],
  );

  const position = useMemo(() => {
    const containerWidth = containerRef.current?.offsetWidth ?? 350;
    const dropdownWidth = 200;
    const maxLeft = Math.max(0, containerWidth - dropdownWidth);
    const left = Math.max(0, Math.min(caretCoords.left, maxLeft));
    const top = caretCoords.top + caretCoords.height + 4;

    return { top, left };
  }, [caretCoords, containerRef]);

  const activeDescendantId = useMemo(() => {
    if (!activeShortcut || items.length === 0 || !items[activeIndex]) {
      return undefined;
    }
    return `shortcut-opt-${items[activeIndex].id}`;
  }, [activeShortcut, items, activeIndex]);

  const closeShortcut = useCallback(() => {
    setActiveShortcut(null);
  }, []);

  return {
    isOpen: !!activeShortcut,
    activeShortcut,
    items,
    activeIndex,
    activeDescendantId,
    setActiveIndex,
    position,
    handleKeyDown,
    checkShortcuts,
    closeShortcut,
  };
}

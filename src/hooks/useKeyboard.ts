import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";

const VIEW_ROUTES: Record<string, string> = {
  "1": "/all",
  "2": "/inbox",
  "3": "/today",
  "4": "/upcoming",
  "5": "/completed",
  "6": "/archived",
  "7": "/trash",
};

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "textarea" || tag === "select") return true;
  if (tag === "input") {
    const type = (el as HTMLInputElement).type;
    return !["checkbox", "radio", "button", "submit", "reset"].includes(type);
  }
  return (
    (el as HTMLElement).isContentEditable ||
    el.getAttribute("contenteditable") === "true" ||
    el.getAttribute("role") === "textbox"
  );
}

function isModalOpen(): boolean {
  const dialogs = document.querySelectorAll(
    '[role="dialog"], [data-slot="dialog-content"], [data-slot="alert-dialog-content"]',
  );
  for (const dialog of dialogs) {
    if (dialog.getAttribute("aria-hidden") === "true") continue;
    if (
      dialog.getAttribute("data-state") === "closed" ||
      dialog.hasAttribute("data-closed")
    ) {
      continue;
    }
    if ((dialog as HTMLElement).hidden) continue;
    return true;
  }
  return false;
}

interface UseKeyboardOptions {
  onNewTask?: () => void;
  onDeleteTask?: () => void;
  onArchiveTask?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onClosePanel?: () => void;
  onSearch?: () => void;
  onToggleSidebar?: () => void;
}

export function useKeyboard(options: UseKeyboardOptions = {}) {
  const navigate = useNavigate();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;

      const key = e.key;
      const opts = optionsRef.current;

      if (opts.onSearch && (e.ctrlKey || e.metaKey) && key === "k") {
        e.preventDefault();
        opts.onSearch();
        return;
      }

      if (opts.onClosePanel && key === "Escape") {
        if (!isModalOpen()) {
          opts.onClosePanel();
          return;
        }
      }

      if (isInputFocused() || isModalOpen()) return;

      if (opts.onToggleSidebar && key === "\\") {
        e.preventDefault();
        opts.onToggleSidebar();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (opts.onNewTask && (key === "n" || key === "N")) {
        e.preventDefault();
        opts.onNewTask();
        return;
      }

      if (opts.onArchiveTask && key === "e") {
        e.preventDefault();
        opts.onArchiveTask();
        return;
      }

      if (opts.onDeleteTask && key === "Delete") {
        e.preventDefault();
        opts.onDeleteTask();
        return;
      }

      if (opts.onNavigateUp && (key === "ArrowUp" || key === "k")) {
        e.preventDefault();
        opts.onNavigateUp();
        return;
      }

      if (opts.onNavigateDown && (key === "ArrowDown" || key === "j")) {
        e.preventDefault();
        opts.onNavigateDown();
        return;
      }

      const route = VIEW_ROUTES[key];
      if (route) {
        e.preventDefault();
        navigate(route);
        return;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [navigate]);
}

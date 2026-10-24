import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useKeyboard } from "../useKeyboard";

const mockNavigate = vi.fn();
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

describe("useKeyboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("navigates to /completed when 5 is pressed", () => {
    renderHook(() => useKeyboard());

    const event = new KeyboardEvent("keydown", {
      key: "5",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(mockNavigate).toHaveBeenCalledWith("/completed");
  });

  it("navigates to /archived when 6 is pressed", () => {
    renderHook(() => useKeyboard());

    const event = new KeyboardEvent("keydown", {
      key: "6",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(mockNavigate).toHaveBeenCalledWith("/archived");
  });

  it("navigates to correct routes for all numeric shortcuts", () => {
    renderHook(() => useKeyboard());

    const expectedRoutes: Record<string, string> = {
      "1": "/all",
      "2": "/inbox",
      "3": "/today",
      "4": "/upcoming",
      "5": "/completed",
      "6": "/archived",
      "7": "/trash",
    };

    for (const [key, route] of Object.entries(expectedRoutes)) {
      mockNavigate.mockClear();
      const event = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(event);
      expect(mockNavigate).toHaveBeenCalledWith(route);
    }
  });

  it("does not navigate if an input element is focused", () => {
    renderHook(() => useKeyboard());

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent("keydown", {
      key: "5",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(mockNavigate).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("does not toggle sidebar when backslash is typed in an input element", () => {
    const onToggleSidebar = vi.fn();
    renderHook(() => useKeyboard({ onToggleSidebar }));

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.focus();

    const event = new KeyboardEvent("keydown", {
      key: "\\",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(onToggleSidebar).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it("ignores keydown events when defaultPrevented is true", () => {
    const onClosePanel = vi.fn();
    renderHook(() => useKeyboard({ onClosePanel }));

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    event.preventDefault();
    document.dispatchEvent(event);

    expect(onClosePanel).not.toHaveBeenCalled();
  });

  it("does not block onNewTask when an instance without onNewTask (like Layout) is registered first", () => {
    const onToggleSidebar = vi.fn();
    const onNewTask = vi.fn();

    // Simulates Layout mounting first or surviving route changes
    renderHook(() => useKeyboard({ onToggleSidebar }));
    // Simulates TaskViewContent mounting after route changes
    renderHook(() => useKeyboard({ onNewTask }));

    const event = new KeyboardEvent("keydown", {
      key: "n",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(onNewTask).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not block onSearch when an instance without onSearch is registered first", () => {
    const onNewTask = vi.fn();
    const onSearch = vi.fn();

    renderHook(() => useKeyboard({ onNewTask }));
    renderHook(() => useKeyboard({ onSearch }));

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not trigger onNewTask when a modal is open", () => {
    const onNewTask = vi.fn();
    renderHook(() => useKeyboard({ onNewTask }));

    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    document.body.appendChild(dialog);

    const event = new KeyboardEvent("keydown", {
      key: "n",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(onNewTask).not.toHaveBeenCalled();

    document.body.removeChild(dialog);
  });
});

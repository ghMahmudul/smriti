import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_STORAGE_KEY,
  getMaxPanelWidth,
  getResponsiveDefaultWidth,
  MIN_MAIN_WIDTH,
  MIN_PANEL_WIDTH,
  useResizablePanel,
} from "../useResizablePanel";

describe("useResizablePanel utilities", () => {
  it("computes responsive default widths according to screen resolution", () => {
    expect(getResponsiveDefaultWidth(2560)).toBe(560);
    expect(getResponsiveDefaultWidth(1920)).toBe(560);
    expect(getResponsiveDefaultWidth(1680)).toBe(520);
    expect(getResponsiveDefaultWidth(1440)).toBe(460);
    expect(getResponsiveDefaultWidth(1280)).toBe(420);
    expect(getResponsiveDefaultWidth(1024)).toBe(380);
    expect(getResponsiveDefaultWidth(800)).toBe(340);
  });

  it("computes maximum panel width preserving space for main view", () => {
    expect(getMaxPanelWidth(1024)).toBe(1024 - MIN_MAIN_WIDTH);
    expect(getMaxPanelWidth(1920)).toBe(800); // capped at 800
    expect(getMaxPanelWidth(500)).toBe(MIN_PANEL_WIDTH); // clamped to min
  });
});

describe("useResizablePanel hook", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1280,
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("initializes with responsive default width when no storage is present", () => {
    const { result } = renderHook(() => useResizablePanel());
    expect(result.current.width).toBe(420);
    expect(result.current.isCustom).toBe(false);
  });

  it("initializes with saved width from localStorage if valid", () => {
    localStorage.setItem(DEFAULT_STORAGE_KEY, "500");
    const { result } = renderHook(() => useResizablePanel());
    expect(result.current.width).toBe(500);
    expect(result.current.isCustom).toBe(true);
  });

  it("clamps saved width within min and max constraints", () => {
    localStorage.setItem(DEFAULT_STORAGE_KEY, "200"); // below min
    const { result } = renderHook(() => useResizablePanel());
    expect(result.current.width).toBe(MIN_PANEL_WIDTH);

    localStorage.setItem(DEFAULT_STORAGE_KEY, "1200"); // above max
    const { result: resultMax } = renderHook(() => useResizablePanel());
    expect(resultMax.current.width).toBe(800);
  });

  it("updates width on window resize when in responsive mode", () => {
    const { result } = renderHook(() => useResizablePanel());
    expect(result.current.width).toBe(420);

    act(() => {
      window.innerWidth = 1600;
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.width).toBe(520);
  });

  it("clamps width on window resize when in custom mode", () => {
    localStorage.setItem(DEFAULT_STORAGE_KEY, "600");
    const { result } = renderHook(() => useResizablePanel());
    expect(result.current.width).toBe(600);

    act(() => {
      window.innerWidth = 800; // max allowed = 800 - 360 = 440
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.width).toBe(440);
  });

  it("resets to default and clears storage on resetWidth / double click", () => {
    localStorage.setItem(DEFAULT_STORAGE_KEY, "550");
    const { result } = renderHook(() => useResizablePanel());
    expect(result.current.isCustom).toBe(true);

    act(() => {
      result.current.handleDoubleClick();
    });

    expect(result.current.isCustom).toBe(false);
    expect(result.current.width).toBe(420);
    expect(localStorage.getItem(DEFAULT_STORAGE_KEY)).toBeNull();
  });

  it("adjusts width via keyboard navigation", () => {
    const { result } = renderHook(() => useResizablePanel());
    const initialWidth = result.current.width;

    // ArrowLeft expands
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowLeft",
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLDivElement>);
    });
    expect(result.current.width).toBe(initialWidth + 16);

    // ArrowRight shrinks
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowRight",
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLDivElement>);
    });
    expect(result.current.width).toBe(initialWidth);

    // Shift + ArrowLeft expands by 50
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowLeft",
        shiftKey: true,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLDivElement>);
    });
    expect(result.current.width).toBe(initialWidth + 50);

    // Home goes to minWidth
    act(() => {
      result.current.handleKeyDown({
        key: "Home",
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLDivElement>);
    });
    expect(result.current.width).toBe(MIN_PANEL_WIDTH);

    // Enter resets to default
    act(() => {
      result.current.handleKeyDown({
        key: "Enter",
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLDivElement>);
    });
    expect(result.current.width).toBe(420);
    expect(result.current.isCustom).toBe(false);
  });
});

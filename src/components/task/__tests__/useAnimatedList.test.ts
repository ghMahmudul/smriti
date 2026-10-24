import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAnimatedList } from "../useAnimatedList";

describe("useAnimatedList", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with items marked as not exiting", () => {
    const initialItems = [
      { id: "1", title: "Task 1" },
      { id: "2", title: "Task 2" },
    ];

    const { result } = renderHook(({ items }) => useAnimatedList(items, 400), {
      initialProps: { items: initialItems },
    });

    expect(result.current).toEqual([
      { item: { id: "1", title: "Task 1" }, isExiting: false },
      { item: { id: "2", title: "Task 2" }, isExiting: false },
    ]);
  });

  it("marks removed item as exiting and removes it after exitDurationMs", () => {
    const item1 = { id: "1", title: "Task 1" };
    const item2 = { id: "2", title: "Task 2" };

    const { result, rerender } = renderHook(
      ({ items }) => useAnimatedList(items, 400),
      { initialProps: { items: [item1, item2] } },
    );

    // Remove item 1
    rerender({ items: [item2] });

    // Item 1 should immediately be marked as exiting, retaining its original position
    expect(result.current).toEqual([
      { item: item1, isExiting: true },
      { item: item2, isExiting: false },
    ]);

    // Advance timer by 399ms - should still be in exiting state
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(result.current).toEqual([
      { item: item1, isExiting: true },
      { item: item2, isExiting: false },
    ]);

    // Advance timer by 1ms (total 400ms) - item 1 should be completely unmounted
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toEqual([{ item: item2, isExiting: false }]);
  });

  it("uses getItemSnapshot to get the latest item data when exiting", () => {
    const item1 = { id: "1", title: "Task 1", state: "open" };
    const latestItem1 = { id: "1", title: "Task 1", state: "done" };

    const getSnapshot = vi.fn((id: string) => {
      if (id === "1") return latestItem1;
      return undefined;
    });

    const { result, rerender } = renderHook(
      ({ items }) => useAnimatedList(items, 400, getSnapshot),
      { initialProps: { items: [item1] } },
    );

    // Remove item 1 (task marked done)
    rerender({ items: [] });

    expect(result.current).toEqual([{ item: latestItem1, isExiting: true }]);
    expect(getSnapshot).toHaveBeenCalledWith("1");
  });

  it("cancels exit timer if an exiting item is restored / re-added before timeout", () => {
    const item1 = { id: "1", title: "Task 1" };
    const item2 = { id: "2", title: "Task 2" };

    const { result, rerender } = renderHook(
      ({ items }) => useAnimatedList(items, 400),
      { initialProps: { items: [item1, item2] } },
    );

    // Remove item 1
    rerender({ items: [item2] });
    expect(result.current[0]?.isExiting).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Re-add item 1 (e.g. uncomplete / undo)
    rerender({ items: [item1, item2] });
    expect(result.current).toEqual([
      { item: item1, isExiting: false },
      { item: item2, isExiting: false },
    ]);

    // Advance another 300ms (total 500ms from start)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Item 1 should NOT have been removed because the timer was cancelled
    expect(result.current).toEqual([
      { item: item1, isExiting: false },
      { item: item2, isExiting: false },
    ]);
  });

  it("preserves relative position when middle item exits", () => {
    const a = { id: "a" };
    const b = { id: "b" };
    const c = { id: "c" };

    const { result, rerender } = renderHook(
      ({ items }) => useAnimatedList(items, 400),
      { initialProps: { items: [a, b, c] } },
    );

    // Remove middle item b
    rerender({ items: [a, c] });

    expect(
      result.current.map((x) => ({ id: x.item.id, isExiting: x.isExiting })),
    ).toEqual([
      { id: "a", isExiting: false },
      { id: "b", isExiting: true },
      { id: "c", isExiting: false },
    ]);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current.map((x) => x.item.id)).toEqual(["a", "c"]);
  });

  it("handles last item in list exiting", () => {
    const a = { id: "a" };

    const { result, rerender } = renderHook(
      ({ items }) => useAnimatedList(items, 400),
      { initialProps: { items: [a] } },
    );

    rerender({ items: [] });

    expect(result.current).toEqual([{ item: a, isExiting: true }]);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current).toEqual([]);
  });

  it("cleans up timeouts on unmount", () => {
    const a = { id: "a" };

    const { rerender, unmount } = renderHook(
      ({ items }) => useAnimatedList(items, 400),
      { initialProps: { items: [a] } },
    );

    rerender({ items: [] });
    unmount();

    // Advancing timers should not throw or cause state updates on unmounted hook
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(500);
      });
    }).not.toThrow();
  });
});

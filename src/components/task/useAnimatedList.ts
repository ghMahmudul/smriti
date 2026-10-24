import { useEffect, useRef, useState } from "react";

export interface AnimatedListItem<T> {
  item: T;
  isExiting: boolean;
}

function mergeListWithExiting<T extends { id: string }>(
  prevList: AnimatedListItem<T>[],
  currentItems: T[],
  getItemSnapshot?: (id: string) => T | undefined,
): AnimatedListItem<T>[] {
  const currentMap = new Map(currentItems.map((item) => [item.id, item]));
  const nextList: AnimatedListItem<T>[] = [];
  const addedIds = new Set<string>();

  const pendingAfter = new Map<string, AnimatedListItem<T>[]>();
  const pendingBeforeFirst: AnimatedListItem<T>[] = [];

  let lastRetainedId: string | null = null;

  for (const prevEntry of prevList) {
    const id = prevEntry.item.id;
    if (currentMap.has(id)) {
      lastRetainedId = id;
    } else {
      const snapshot = getItemSnapshot?.(id) ?? prevEntry.item;
      const exitingEntry: AnimatedListItem<T> = {
        item: snapshot,
        isExiting: true,
      };
      if (lastRetainedId === null) {
        pendingBeforeFirst.push(exitingEntry);
      } else {
        const afterList = pendingAfter.get(lastRetainedId) ?? [];
        afterList.push(exitingEntry);
        pendingAfter.set(lastRetainedId, afterList);
      }
    }
  }

  for (const entry of pendingBeforeFirst) {
    nextList.push(entry);
    addedIds.add(entry.item.id);
  }

  for (const item of currentItems) {
    nextList.push({ item, isExiting: false });
    addedIds.add(item.id);

    const exitingAfter = pendingAfter.get(item.id);
    if (exitingAfter) {
      for (const entry of exitingAfter) {
        nextList.push(entry);
        addedIds.add(entry.item.id);
      }
    }
  }

  for (const prevEntry of prevList) {
    if (!addedIds.has(prevEntry.item.id)) {
      const snapshot = getItemSnapshot?.(prevEntry.item.id) ?? prevEntry.item;
      nextList.push({ item: snapshot, isExiting: true });
    }
  }

  return nextList;
}

export function useAnimatedList<T extends { id: string }>(
  items: T[],
  exitDurationMs = 400,
  getItemSnapshot?: (id: string) => T | undefined,
): AnimatedListItem<T>[] {
  const [prevItems, setPrevItems] = useState<T[]>(items);
  const [renderedList, setRenderedList] = useState<AnimatedListItem<T>[]>(() =>
    items.map((item) => ({ item, isExiting: false })),
  );

  const exitTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  if (items !== prevItems) {
    setPrevItems(items);
    const nextList = mergeListWithExiting(renderedList, items, getItemSnapshot);
    setRenderedList(nextList);
  }

  useEffect(() => {
    const currentExitingIds = new Set(
      renderedList
        .filter((entry) => entry.isExiting)
        .map((entry) => entry.item.id),
    );

    for (const [id, timeout] of exitTimeoutsRef.current.entries()) {
      if (!currentExitingIds.has(id)) {
        clearTimeout(timeout);
        exitTimeoutsRef.current.delete(id);
      }
    }

    for (const id of currentExitingIds) {
      if (!exitTimeoutsRef.current.has(id)) {
        const timeout = setTimeout(() => {
          exitTimeoutsRef.current.delete(id);
          setRenderedList((current) =>
            current.filter((entry) => entry.item.id !== id),
          );
        }, exitDurationMs);
        exitTimeoutsRef.current.set(id, timeout);
      }
    }
  }, [renderedList, exitDurationMs]);

  useEffect(() => {
    return () => {
      for (const timeout of exitTimeoutsRef.current.values()) {
        clearTimeout(timeout);
      }
      exitTimeoutsRef.current.clear();
    };
  }, []);

  return renderedList;
}

import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../../core/types";
import { useSprinkleStore } from "../sprinkle-store";
import { useWorkspaceStore } from "../workspace-store";

describe("sprinkle-store", () => {
  beforeEach(() => {
    useSprinkleStore.setState({ latestBurst: null });
    useWorkspaceStore.setState({
      settings: {
        ...DEFAULT_SETTINGS,
        sprinkleEffect: true,
      },
    });
  });

  it("initializes with null latestBurst", () => {
    expect(useSprinkleStore.getState().latestBurst).toBeNull();
  });

  it("triggers sprinkle when sprinkleEffect is enabled", () => {
    useSprinkleStore.getState().triggerSprinkle({
      x: 100,
      y: 200,
      priority: "high",
    });

    const burst = useSprinkleStore.getState().latestBurst;
    expect(burst).not.toBeNull();
    expect(burst?.x).toBe(100);
    expect(burst?.y).toBe(200);
    expect(burst?.priority).toBe("high");
    expect(burst?.id).toMatch(/^sprinkle-\d+$/);
  });

  it("does not trigger sprinkle when sprinkleEffect is disabled in settings", () => {
    useWorkspaceStore.setState({
      settings: {
        ...DEFAULT_SETTINGS,
        sprinkleEffect: false,
      },
    });

    useSprinkleStore.getState().triggerSprinkle({
      x: 100,
      y: 200,
      priority: "medium",
    });

    expect(useSprinkleStore.getState().latestBurst).toBeNull();
  });

  it("does not trigger sprinkle when prefers-reduced-motion matches", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    useSprinkleStore.getState().triggerSprinkle({
      x: 50,
      y: 50,
    });

    expect(useSprinkleStore.getState().latestBurst).toBeNull();

    window.matchMedia = originalMatchMedia;
  });
});

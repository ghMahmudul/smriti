import { beforeEach, describe, expect, it } from "vitest";
import { useUIStore } from "../ui-store";

describe("useUIStore sorting state", () => {
  beforeEach(() => {
    useUIStore.setState({
      taskSortBy: "default",
      taskSortOrder: "smart",
    });
  });

  it("initializes with default sort and smart order", () => {
    const state = useUIStore.getState();
    expect(state.taskSortBy).toBe("default");
    expect(state.taskSortOrder).toBe("smart");
  });

  it("automatically sets default order to desc when selecting priority", () => {
    useUIStore.getState().setTaskSortBy("priority");
    expect(useUIStore.getState().taskSortBy).toBe("priority");
    expect(useUIStore.getState().taskSortOrder).toBe("desc");
  });

  it("automatically sets default order to asc when selecting due", () => {
    useUIStore.getState().setTaskSortBy("priority");
    useUIStore.getState().setTaskSortBy("due");
    expect(useUIStore.getState().taskSortBy).toBe("due");
    expect(useUIStore.getState().taskSortOrder).toBe("asc");
  });

  it("automatically sets default order to asc when selecting title", () => {
    useUIStore.getState().setTaskSortBy("title");
    expect(useUIStore.getState().taskSortBy).toBe("title");
    expect(useUIStore.getState().taskSortOrder).toBe("asc");
  });

  it("automatically sets default order to desc when selecting created", () => {
    useUIStore.getState().setTaskSortBy("created");
    expect(useUIStore.getState().taskSortBy).toBe("created");
    expect(useUIStore.getState().taskSortOrder).toBe("desc");
  });

  it("automatically sets default order to smart when selecting default", () => {
    useUIStore.getState().setTaskSortBy("priority");
    expect(useUIStore.getState().taskSortOrder).toBe("desc");
    useUIStore.getState().setTaskSortBy("default");
    expect(useUIStore.getState().taskSortBy).toBe("default");
    expect(useUIStore.getState().taskSortOrder).toBe("smart");
  });

  it("safely resets to default when given an invalid sort field", () => {
    useUIStore.getState().setTaskSortBy("priority");
    // @ts-expect-error Testing runtime resilience
    useUIStore.getState().setTaskSortBy("invalid-field");
    expect(useUIStore.getState().taskSortBy).toBe("default");
    expect(useUIStore.getState().taskSortOrder).toBe("smart");
  });

  it("allows setting sort order manually", () => {
    useUIStore.getState().setTaskSortBy("priority");
    expect(useUIStore.getState().taskSortOrder).toBe("desc");
    useUIStore.getState().setTaskSortOrder("asc");
    expect(useUIStore.getState().taskSortOrder).toBe("asc");

    useUIStore.getState().setTaskSortBy("default");
    expect(useUIStore.getState().taskSortOrder).toBe("smart");
    useUIStore.getState().setTaskSortOrder("normal");
    expect(useUIStore.getState().taskSortOrder).toBe("normal");
  });
});

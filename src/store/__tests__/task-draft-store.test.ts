import { beforeEach, describe, expect, it } from "vitest";
import { getTodayLocalDateString } from "../../core/date-utils";
import {
  createDefaultDraft,
  getDefaultDue,
  getDefaultTags,
  getTargetProject,
  useTaskDraftStore,
} from "../task-draft-store";

describe("useTaskDraftStore", () => {
  beforeEach(() => {
    useTaskDraftStore.getState().resetAll();
  });

  it("has correct initial state", () => {
    const state = useTaskDraftStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.currentView).toBeNull();
    expect(state.draft.title).toBe("");
    expect(state.draft.description).toBe("");
  });

  it("opens and closes modal", () => {
    useTaskDraftStore.getState().openModal();
    expect(useTaskDraftStore.getState().isOpen).toBe(true);

    useTaskDraftStore.getState().closeModal();
    expect(useTaskDraftStore.getState().isOpen).toBe(false);
  });

  it("updates individual draft fields with setDraftField", () => {
    useTaskDraftStore.getState().setDraftField("title", "My Task");
    useTaskDraftStore.getState().setDraftField("description", "Details");
    useTaskDraftStore.getState().setDraftField("priority", "high");

    const draft = useTaskDraftStore.getState().draft;
    expect(draft.title).toBe("My Task");
    expect(draft.description).toBe("Details");
    expect(draft.priority).toBe("high");
  });

  it("updates multiple fields with setDraft", () => {
    useTaskDraftStore
      .getState()
      .setDraft({ title: "Updated", priority: "low" });
    const draft = useTaskDraftStore.getState().draft;
    expect(draft.title).toBe("Updated");
    expect(draft.priority).toBe("low");
  });

  it("initializes draft defaults on view change via syncView", () => {
    const todayStr = getTodayLocalDateString();
    useTaskDraftStore.getState().syncView("today");

    expect(useTaskDraftStore.getState().currentView).toBe("today");
    expect(useTaskDraftStore.getState().draft.due).toBe(todayStr);

    // If syncView is called with the SAME view, it preserves existing edits
    useTaskDraftStore.getState().setDraftField("title", "Work in progress");
    useTaskDraftStore.getState().syncView("today");
    expect(useTaskDraftStore.getState().draft.title).toBe("Work in progress");

    // If syncView is called with a DIFFERENT view, it resets
    useTaskDraftStore.getState().syncView("tag:urgent");
    expect(useTaskDraftStore.getState().currentView).toBe("tag:urgent");
    expect(useTaskDraftStore.getState().draft.title).toBe("");
    expect(useTaskDraftStore.getState().draft.tags).toEqual(["urgent"]);
  });

  it("resets draft to view defaults via resetDraft", () => {
    useTaskDraftStore.getState().syncView("today");
    useTaskDraftStore.getState().setDraftField("title", "Finished task");
    useTaskDraftStore.getState().resetDraft("today");

    const draft = useTaskDraftStore.getState().draft;
    expect(draft.title).toBe("");
    expect(draft.due).toBe(getTodayLocalDateString());
  });

  it("helpers compute correct view defaults", () => {
    expect(getTargetProject("today")).toBe("Inbox");
    expect(getTargetProject("project:MyProject")).toBe("MyProject");
    expect(getDefaultDue("today")).toBe(getTodayLocalDateString());
    expect(getDefaultTags("tag:backend")).toEqual(["backend"]);
    expect(getDefaultTags("today")).toEqual([]);

    const draft = createDefaultDraft("tag:backend");
    expect(draft.tags).toEqual(["backend"]);
    expect(draft.projectId).toBe("Inbox");
  });
});

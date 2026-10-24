import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "@/core/types";
import { useWorkspaceStore } from "../workspace-store";

describe("workspace-store icon actions", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      settings: {
        ...DEFAULT_SETTINGS,
        tags: ["work", "personal", "urgent"],
        projectIcons: {},
        tagIcons: {},
      },
    });
  });

  describe("project icons", () => {
    it("sets and updates a project icon", () => {
      useWorkspaceStore.getState().setProjectIcon("Project A", "rocket");
      expect(
        useWorkspaceStore.getState().settings.projectIcons?.["Project A"],
      ).toBe("rocket");

      useWorkspaceStore.getState().setProjectIcon("Project A", "star");
      expect(
        useWorkspaceStore.getState().settings.projectIcons?.["Project A"],
      ).toBe("star");
    });

    it("clears a project icon when icon is undefined", () => {
      useWorkspaceStore.getState().setProjectIcon("Project A", "rocket");
      expect(
        useWorkspaceStore.getState().settings.projectIcons?.["Project A"],
      ).toBe("rocket");

      useWorkspaceStore.getState().setProjectIcon("Project A", undefined);
      expect(
        useWorkspaceStore.getState().settings.projectIcons?.["Project A"],
      ).toBeUndefined();
    });

    it("removes a project icon using removeProjectIcon", () => {
      useWorkspaceStore.getState().setProjectIcon("Project A", "rocket");
      useWorkspaceStore.getState().setProjectIcon("Project B", "code");

      useWorkspaceStore.getState().removeProjectIcon("Project A");

      const icons = useWorkspaceStore.getState().settings.projectIcons;
      expect(icons?.["Project A"]).toBeUndefined();
      expect(icons?.["Project B"]).toBe("code");
    });

    it("renames a project icon with the same icon", () => {
      useWorkspaceStore.getState().setProjectIcon("Old Project", "rocket");
      useWorkspaceStore
        .getState()
        .renameProjectIcon("Old Project", "New Project");

      const icons = useWorkspaceStore.getState().settings.projectIcons;
      expect(icons?.["Old Project"]).toBeUndefined();
      expect(icons?.["New Project"]).toBe("rocket");
    });

    it("renames a project icon and assigns a new icon", () => {
      useWorkspaceStore.getState().setProjectIcon("Old Project", "rocket");
      useWorkspaceStore
        .getState()
        .renameProjectIcon("Old Project", "New Project", "star");

      const icons = useWorkspaceStore.getState().settings.projectIcons;
      expect(icons?.["Old Project"]).toBeUndefined();
      expect(icons?.["New Project"]).toBe("star");
    });
  });

  describe("tag icons", () => {
    it("sets and updates a tag icon", () => {
      useWorkspaceStore.getState().setTagIcon("urgent", "flame");
      expect(useWorkspaceStore.getState().settings.tagIcons?.urgent).toBe(
        "flame",
      );

      useWorkspaceStore.getState().setTagIcon("urgent", "bell");
      expect(useWorkspaceStore.getState().settings.tagIcons?.urgent).toBe(
        "bell",
      );
    });

    it("clears a tag icon when icon is undefined", () => {
      useWorkspaceStore.getState().setTagIcon("urgent", "flame");
      useWorkspaceStore.getState().setTagIcon("urgent", undefined);
      expect(
        useWorkspaceStore.getState().settings.tagIcons?.urgent,
      ).toBeUndefined();
    });

    it("removes a tag icon using removeTagIcon", () => {
      useWorkspaceStore.getState().setTagIcon("urgent", "flame");
      useWorkspaceStore.getState().setTagIcon("work", "briefcase");

      useWorkspaceStore.getState().removeTagIcon("urgent");

      const icons = useWorkspaceStore.getState().settings.tagIcons;
      expect(icons?.urgent).toBeUndefined();
      expect(icons?.work).toBe("briefcase");
    });

    it("renames a tag icon with renameTagIcon", () => {
      useWorkspaceStore.getState().setTagIcon("work", "briefcase");
      useWorkspaceStore.getState().renameTagIcon("work", "job");

      const icons = useWorkspaceStore.getState().settings.tagIcons;
      expect(icons?.work).toBeUndefined();
      expect(icons?.job).toBe("briefcase");
    });

    it("automatically cascades tag icon when renameTag is called", () => {
      useWorkspaceStore.getState().setTagIcon("work", "briefcase");
      useWorkspaceStore.getState().renameTag("work", "career");

      const state = useWorkspaceStore.getState();
      expect(state.settings.tags).toContain("career");
      expect(state.settings.tags).not.toContain("work");
      expect(state.settings.tagIcons?.work).toBeUndefined();
      expect(state.settings.tagIcons?.career).toBe("briefcase");
    });

    it("automatically removes tag icon when removeTag is called", () => {
      useWorkspaceStore.getState().setTagIcon("urgent", "flame");
      useWorkspaceStore.getState().removeTag("urgent");

      const state = useWorkspaceStore.getState();
      expect(state.settings.tags).not.toContain("urgent");
      expect(state.settings.tagIcons?.urgent).toBeUndefined();
    });
  });

  describe("pinned projects and tags", () => {
    it("toggles pin status of a project", () => {
      useWorkspaceStore.getState().togglePinProject("Project A");
      expect(useWorkspaceStore.getState().settings.pinnedProjects).toContain(
        "Project A",
      );

      useWorkspaceStore.getState().togglePinProject("Project A");
      expect(
        useWorkspaceStore.getState().settings.pinnedProjects,
      ).not.toContain("Project A");
    });

    it("removes a pinned project", () => {
      useWorkspaceStore.getState().togglePinProject("Project A");
      useWorkspaceStore.getState().togglePinProject("Project B");
      useWorkspaceStore.getState().removePinnedProject("Project A");

      const pinned = useWorkspaceStore.getState().settings.pinnedProjects;
      expect(pinned).not.toContain("Project A");
      expect(pinned).toContain("Project B");
    });

    it("renames a pinned project while preserving order", () => {
      useWorkspaceStore.getState().togglePinProject("Project A");
      useWorkspaceStore.getState().togglePinProject("Project B");
      useWorkspaceStore
        .getState()
        .renamePinnedProject("Project A", "Renamed A");

      const pinned = useWorkspaceStore.getState().settings.pinnedProjects;
      expect(pinned).toEqual(["Renamed A", "Project B"]);
    });

    it("toggles pin status of a tag", () => {
      useWorkspaceStore.getState().togglePinTag("work");
      expect(useWorkspaceStore.getState().settings.pinnedTags).toContain(
        "work",
      );

      useWorkspaceStore.getState().togglePinTag("work");
      expect(useWorkspaceStore.getState().settings.pinnedTags).not.toContain(
        "work",
      );
    });

    it("removes a pinned tag", () => {
      useWorkspaceStore.getState().togglePinTag("work");
      useWorkspaceStore.getState().togglePinTag("personal");
      useWorkspaceStore.getState().removePinnedTag("work");

      const pinned = useWorkspaceStore.getState().settings.pinnedTags;
      expect(pinned).not.toContain("work");
      expect(pinned).toContain("personal");
    });

    it("renames a pinned tag while preserving order", () => {
      useWorkspaceStore.getState().togglePinTag("work");
      useWorkspaceStore.getState().togglePinTag("personal");
      useWorkspaceStore.getState().renamePinnedTag("work", "job");

      const pinned = useWorkspaceStore.getState().settings.pinnedTags;
      expect(pinned).toEqual(["job", "personal"]);
    });

    it("automatically cascades pinned tag when renameTag is called", () => {
      useWorkspaceStore.getState().togglePinTag("work");
      useWorkspaceStore.getState().renameTag("work", "career");

      const state = useWorkspaceStore.getState();
      expect(state.settings.pinnedTags).toContain("career");
      expect(state.settings.pinnedTags).not.toContain("work");
    });

    it("automatically removes pinned tag when removeTag is called", () => {
      useWorkspaceStore.getState().togglePinTag("urgent");
      useWorkspaceStore.getState().removeTag("urgent");

      const state = useWorkspaceStore.getState();
      expect(state.settings.pinnedTags).not.toContain("urgent");
    });
  });
});

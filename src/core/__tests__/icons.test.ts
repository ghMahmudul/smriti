import { Folder, Inbox, Rocket, Star, Tag } from "lucide-react";
import { describe, expect, it } from "vitest";
import {
  getIconComponent,
  getIconDefinition,
  getProjectIcon,
  getTagIcon,
  ICON_REGISTRY,
  searchIcons,
} from "../icons";

describe("core/icons", () => {
  describe("ICON_REGISTRY", () => {
    it("contains registered icons with valid properties", () => {
      expect(ICON_REGISTRY.length).toBeGreaterThan(50);

      const ids = new Set<string>();
      for (const item of ICON_REGISTRY) {
        expect(item.id).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(Array.isArray(item.keywords)).toBe(true);
        expect(typeof item.icon).toBe("object"); // Lucide icon forwardRef/object
        expect(ids.has(item.id)).toBe(false);
        ids.add(item.id);
      }
    });
  });

  describe("getIconDefinition", () => {
    it("retrieves icon definition by exact ID", () => {
      const def = getIconDefinition("rocket");
      expect(def).toBeDefined();
      expect(def?.id).toBe("rocket");
      expect(def?.name).toBe("Rocket");
    });

    it("retrieves icon definition case-insensitively and with trimming", () => {
      const def = getIconDefinition("  ROCKET  ");
      expect(def).toBeDefined();
      expect(def?.id).toBe("rocket");
    });

    it("retrieves icon definition with special characters stripped if needed", () => {
      const def = getIconDefinition("check-square");
      expect(def).toBeDefined();
      expect(def?.id).toBe("check-square");
    });

    it("returns undefined for null, undefined, or unknown IDs", () => {
      expect(getIconDefinition(undefined)).toBeUndefined();
      expect(getIconDefinition(null)).toBeUndefined();
      expect(getIconDefinition("nonexistent-icon-id")).toBeUndefined();
    });
  });

  describe("getIconComponent", () => {
    it("returns the corresponding Lucide component for valid id", () => {
      const icon = getIconComponent("rocket");
      expect(icon).toBe(Rocket);
    });

    it("falls back to default Folder when id is undefined or unknown", () => {
      expect(getIconComponent(undefined)).toBe(Folder);
      expect(getIconComponent("unknown-id")).toBe(Folder);
    });

    it("allows custom fallback icon", () => {
      expect(getIconComponent(undefined, Star)).toBe(Star);
      expect(getIconComponent("unknown-id", Star)).toBe(Star);
    });
  });

  describe("getProjectIcon", () => {
    it("returns Inbox icon for 'inbox' regardless of case and handles .todo suffix", () => {
      expect(getProjectIcon("inbox")).toBe(Inbox);
      expect(getProjectIcon("Inbox")).toBe(Inbox);
      expect(getProjectIcon("INBOX")).toBe(Inbox);
      expect(getProjectIcon("Inbox.todo")).toBe(Inbox);
      expect(getProjectIcon("inbox.todo")).toBe(Inbox);
    });

    it("returns custom icon from projectIcons map if set, including with .todo suffix", () => {
      const icons = { "Work Projects": "rocket", Personal: "star" };
      expect(getProjectIcon("Work Projects", icons)).toBe(Rocket);
      expect(getProjectIcon("Work Projects.todo", icons)).toBe(Rocket);
      expect(getProjectIcon("Personal", icons)).toBe(Star);
    });

    it("falls back to Folder icon when no custom icon is set", () => {
      expect(getProjectIcon("Work Projects")).toBe(Folder);
      expect(getProjectIcon("Work Projects", {})).toBe(Folder);
      expect(getProjectIcon("Work Projects", { Other: "rocket" })).toBe(Folder);
    });

    it("respects custom fallback when provided", () => {
      expect(getProjectIcon("Unknown", undefined, Star)).toBe(Star);
    });
  });

  describe("getTagIcon", () => {
    it("returns custom icon from tagIcons map if set, including with # prefix", () => {
      const icons = { urgent: "flame", work: "briefcase" };
      const icon = getTagIcon("urgent", icons);
      expect(icon).toBeDefined();
      expect(icon).not.toBe(Tag);

      const hashIcon = getTagIcon("#urgent", icons);
      expect(hashIcon).toBe(icon);
    });

    it("falls back to Tag icon when no custom icon is set", () => {
      expect(getTagIcon("urgent")).toBe(Tag);
      expect(getTagIcon("urgent", {})).toBe(Tag);
      expect(getTagIcon("urgent", { work: "rocket" })).toBe(Tag);
    });

    it("respects custom fallback when provided", () => {
      expect(getTagIcon("urgent", undefined, Star)).toBe(Star);
    });
  });

  describe("searchIcons", () => {
    it("returns all icons when query is empty", () => {
      const results = searchIcons("");
      expect(results.length).toBe(ICON_REGISTRY.length);
    });

    it("filters icons by search query matching name or keywords", () => {
      const results = searchIcons("rocket");
      expect(results.some((item) => item.id === "rocket")).toBe(true);

      const codeResults = searchIcons("code");
      expect(codeResults.length).toBeGreaterThan(0);
    });

    it("returns empty array when query does not match", () => {
      const results = searchIcons("nonexistentquerythatmatchesnothing12345");
      expect(results.length).toBe(0);
    });
  });
});

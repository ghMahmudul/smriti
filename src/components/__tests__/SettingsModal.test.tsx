import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../../core/types";
import { useWorkspaceStore } from "../../store/workspace-store";
import SettingsModal from "../settings/SettingsModal";

const mockUseSidebar = vi.fn();
vi.mock("../layout/Layout", () => ({
  useSidebar: () => mockUseSidebar(),
}));

describe("SettingsModal", () => {
  beforeEach(() => {
    mockUseSidebar.mockReturnValue({ isMobile: false });
    useWorkspaceStore.setState({
      mode: "local-storage",
      workspaceName: "Test Workspace",
      currentWorkspaceId: "ws-1",
      settings: {
        ...DEFAULT_SETTINGS,
        showCompleted: false,
        showArchived: false,
        showTrash: false,
      },
    });
  });

  it("renders General, Appearance, and Views sections in navigation", () => {
    render(<SettingsModal onClose={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /^general$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^appearance$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^views$/i }),
    ).toBeInTheDocument();
  });

  it("renders Workspace name and Default view in General settings", () => {
    render(<SettingsModal onClose={vi.fn()} />);

    expect(screen.getByText("Workspace name")).toBeInTheDocument();
    expect(screen.getByText("Default view")).toBeInTheDocument();
  });

  it("renders view toggles inside Views section", async () => {
    const user = userEvent.setup();
    render(<SettingsModal onClose={vi.fn()} />);

    expect(screen.getByText("Workspace name")).toBeInTheDocument();
    expect(screen.getByText("Default view")).toBeInTheDocument();
    expect(
      screen.queryByRole("switch", { name: "Show Completed" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^views$/i }));

    expect(
      screen.getByRole("switch", { name: "Show Completed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Show Archived" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Show Trash" }),
    ).toBeInTheDocument();
  });

  it("updates store when view toggles are switched", async () => {
    const user = userEvent.setup();
    render(<SettingsModal onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /^views$/i }));

    const completedSwitch = screen.getByRole("switch", {
      name: "Show Completed",
    });
    const archivedSwitch = screen.getByRole("switch", {
      name: "Show Archived",
    });
    const trashSwitch = screen.getByRole("switch", { name: "Show Trash" });

    expect(completedSwitch).toHaveAttribute("aria-checked", "false");
    expect(archivedSwitch).toHaveAttribute("aria-checked", "false");
    expect(trashSwitch).toHaveAttribute("aria-checked", "false");

    await user.click(completedSwitch);
    expect(useWorkspaceStore.getState().settings.showCompleted).toBe(true);

    await user.click(archivedSwitch);
    expect(useWorkspaceStore.getState().settings.showArchived).toBe(true);

    await user.click(trashSwitch);
    expect(useWorkspaceStore.getState().settings.showTrash).toBe(true);
  });

  it("renders Task completion sprinkles toggle inside Appearance section", async () => {
    const user = userEvent.setup();
    render(<SettingsModal onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /^appearance$/i }));

    const sprinkleSwitch = screen.getByRole("switch", {
      name: "Task completion sprinkles",
    });
    expect(sprinkleSwitch).toBeInTheDocument();
    expect(sprinkleSwitch).toHaveAttribute("aria-checked", "true");

    await user.click(sprinkleSwitch);
    expect(useWorkspaceStore.getState().settings.sprinkleEffect).toBe(false);

    await user.click(sprinkleSwitch);
    expect(useWorkspaceStore.getState().settings.sprinkleEffect).toBe(true);
  });

  describe("mobile screen", () => {
    beforeEach(() => {
      mockUseSidebar.mockReturnValue({ isMobile: true });
    });

    it("renders all settings sections in one page without navigation options", () => {
      render(<SettingsModal onClose={vi.fn()} />);

      // No navigation buttons
      expect(
        screen.queryByRole("button", { name: /^general$/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^appearance$/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^views$/i }),
      ).not.toBeInTheDocument();

      // All settings sections are visible simultaneously on the page
      expect(screen.getByText("Workspace name")).toBeInTheDocument();
      expect(screen.getByText("Default view")).toBeInTheDocument();
      expect(screen.getByText("Theme")).toBeInTheDocument();
      expect(
        screen.getByRole("switch", { name: "Task completion sprinkles" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("switch", { name: "Show Completed" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("switch", { name: "Show Archived" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("switch", { name: "Show Trash" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Dark" })).toBeInTheDocument();
    });
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import WorkspaceListItem from "@/components/workspace/WorkspaceListItem";
import type { WorkspaceEntry } from "@/core/types";

describe("WorkspaceListItem", () => {
  const fsWorkspace: WorkspaceEntry = {
    id: "ws-1",
    name: "My Projects",
    mode: "file-system",
    path: "/home/user/projects",
  };

  const lsWorkspace: WorkspaceEntry = {
    id: "ws-2",
    name: "Browser Workspace",
    mode: "local-storage",
  };

  it("renders workspace name, file-system path, and does not show checkmark when inactive", () => {
    render(
      <WorkspaceListItem
        workspace={fsWorkspace}
        isActive={false}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("My Projects")).toBeInTheDocument();
    expect(screen.getByText("/home/user/projects")).toBeInTheDocument();
    expect(screen.queryByTestId("check-icon")).not.toBeInTheDocument();
  });

  it("renders 'Local Storage' subtitle for local-storage workspace", () => {
    render(
      <WorkspaceListItem
        workspace={lsWorkspace}
        isActive={false}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Browser Workspace")).toBeInTheDocument();
    expect(screen.getByText("Local Storage")).toBeInTheDocument();
  });

  it("renders active checkmark when isActive is true", () => {
    const { container } = render(
      <WorkspaceListItem
        workspace={fsWorkspace}
        isActive={true}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("My Projects")).toBeInTheDocument();
    const checkIcon = container.querySelector(".text-primary");
    expect(checkIcon).toBeInTheDocument();
  });

  it("calls onClick when clicked anywhere on the row", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <WorkspaceListItem
        workspace={fsWorkspace}
        isActive={false}
        onClick={onClick}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText("My Projects"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders options button with accessible label and opens context menu", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    const onDelete = vi.fn();

    render(
      <WorkspaceListItem
        workspace={lsWorkspace}
        isActive={false}
        onClick={vi.fn()}
        onRename={onRename}
        onDelete={onDelete}
      />,
    );

    const optionsBtn = screen.getByRole("button", {
      name: "Options for Browser Workspace",
    });
    expect(optionsBtn).toBeInTheDocument();

    await user.click(optionsBtn);

    const editItem = await screen.findByRole("menuitem", { name: "Edit" });
    const deleteItem = screen.getByRole("menuitem", { name: "Delete" });
    expect(editItem).toBeInTheDocument();
    expect(deleteItem).toBeInTheDocument();

    await user.click(editItem);
    expect(onRename).toHaveBeenCalledTimes(1);
  });

  it("renders only Delete option when onRename is not provided", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <WorkspaceListItem
        workspace={fsWorkspace}
        isActive={false}
        onClick={vi.fn()}
        onDelete={onDelete}
      />,
    );

    const optionsBtn = screen.getByRole("button", {
      name: "Options for My Projects",
    });
    await user.click(optionsBtn);

    expect(
      screen.queryByRole("menuitem", { name: "Edit" }),
    ).not.toBeInTheDocument();
    const deleteItem = await screen.findByRole("menuitem", { name: "Delete" });
    expect(deleteItem).toBeInTheDocument();

    await user.click(deleteItem);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("does not trigger onClick when options button or menu item is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onDelete = vi.fn();

    render(
      <WorkspaceListItem
        workspace={fsWorkspace}
        isActive={false}
        onClick={onClick}
        onDelete={onDelete}
      />,
    );

    const optionsBtn = screen.getByRole("button", {
      name: "Options for My Projects",
    });
    await user.click(optionsBtn);

    const deleteItem = await screen.findByRole("menuitem", { name: "Delete" });
    await user.click(deleteItem);

    expect(onClick).not.toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("keeps options button visible when menu is open", async () => {
    const user = userEvent.setup();

    render(
      <WorkspaceListItem
        workspace={lsWorkspace}
        isActive={false}
        onClick={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const optionsBtn = screen.getByRole("button", {
      name: "Options for Browser Workspace",
    });
    const buttonParent = optionsBtn.parentElement;
    expect(buttonParent?.className).toContain("opacity-0");

    await user.click(optionsBtn);
    expect(buttonParent?.className).toContain("opacity-100");
  });
});

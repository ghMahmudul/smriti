import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Folder, Tag } from "lucide-react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SidebarSection from "@/components/layout/SidebarSection";
import SidebarSectionItem from "@/components/layout/SidebarSectionItem";

describe("SidebarSectionItem", () => {
  it("renders name, icon, and count badge", () => {
    render(
      <SidebarSectionItem
        name="Personal"
        icon={Folder}
        count={5}
        isActive={false}
        onClick={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("does not render count when count is 0 or undefined", () => {
    const { rerender } = render(
      <SidebarSectionItem
        name="Personal"
        icon={Folder}
        count={0}
        isActive={false}
        onClick={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByText("0")).not.toBeInTheDocument();

    rerender(
      <SidebarSectionItem
        name="Personal"
        icon={Folder}
        isActive={false}
        onClick={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <SidebarSectionItem
        name="Personal"
        icon={Folder}
        isActive={false}
        onClick={onClick}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Personal"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders options button and opens context menu for rename and delete", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    const onDelete = vi.fn();

    render(
      <SidebarSectionItem
        name="Personal"
        icon={Folder}
        count={3}
        isActive={false}
        onClick={vi.fn()}
        onRename={onRename}
        onDelete={onDelete}
      />,
    );

    const optionsBtn = screen.getByRole("button", {
      name: "Options for Personal",
    });
    expect(optionsBtn).toBeInTheDocument();

    await user.click(optionsBtn);

    const editItem = await screen.findByRole("menuitem", { name: "Edit" });
    const deleteItem = screen.getByRole("menuitem", { name: "Delete" });
    expect(editItem).toBeInTheDocument();
    expect(deleteItem).toBeInTheDocument();

    const countBadge = screen.getByText("3");
    expect(countBadge.className).toContain("opacity-0");

    await user.click(editItem);
    expect(onRename).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete when Delete menu item is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <SidebarSectionItem
        name="Personal"
        icon={Folder}
        isActive={false}
        onClick={vi.fn()}
        onRename={vi.fn()}
        onDelete={onDelete}
      />,
    );

    const optionsBtn = screen.getByRole("button", {
      name: "Options for Personal",
    });
    await user.click(optionsBtn);

    const deleteItem = await screen.findByRole("menuitem", { name: "Delete" });
    await user.click(deleteItem);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("renders Pin option after Edit when not pinned and calls onPin on click", async () => {
    const user = userEvent.setup();
    const onPin = vi.fn();

    render(
      <SidebarSectionItem
        name="Personal"
        icon={Folder}
        isActive={false}
        onClick={vi.fn()}
        onRename={vi.fn()}
        onPin={onPin}
        isPinned={false}
        onDelete={vi.fn()}
      />,
    );

    const optionsBtn = screen.getByRole("button", {
      name: "Options for Personal",
    });
    await user.click(optionsBtn);

    const menuItems = await screen.findAllByRole("menuitem");
    expect(menuItems.map((m) => m.textContent?.trim())).toEqual([
      "Edit",
      "Pin",
      "Delete",
    ]);

    const pinItem = screen.getByRole("menuitem", { name: "Pin" });
    await user.click(pinItem);
    expect(onPin).toHaveBeenCalledTimes(1);
  });

  it("renders Unpin option after Edit when pinned and calls onPin on click", async () => {
    const user = userEvent.setup();
    const onPin = vi.fn();

    render(
      <SidebarSectionItem
        name="Personal"
        icon={Folder}
        isActive={false}
        onClick={vi.fn()}
        onRename={vi.fn()}
        onPin={onPin}
        isPinned={true}
        onDelete={vi.fn()}
      />,
    );

    const optionsBtn = screen.getByRole("button", {
      name: "Options for Personal",
    });
    await user.click(optionsBtn);

    const menuItems = await screen.findAllByRole("menuitem");
    expect(menuItems.map((m) => m.textContent?.trim())).toEqual([
      "Edit",
      "Unpin",
      "Delete",
    ]);

    const unpinItem = screen.getByRole("menuitem", { name: "Unpin" });
    await user.click(unpinItem);
    expect(onPin).toHaveBeenCalledTimes(1);
  });

  it("shows count and keeps options button hidden when project is selected", () => {
    render(
      <SidebarSectionItem
        name="Personal"
        icon={Folder}
        count={5}
        isActive={true}
        onClick={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const countBadge = screen.getByText("5");
    expect(countBadge).toBeInTheDocument();
    expect(countBadge.classList.contains("opacity-0")).toBe(false);

    const optionsBtn = screen.getByRole("button", {
      name: "Options for Personal",
    });
    expect(optionsBtn.parentElement?.classList.contains("opacity-0")).toBe(
      true,
    );
    expect(
      optionsBtn.parentElement?.classList.contains("pointer-events-none"),
    ).toBe(true);
  });

  it("keeps options button hidden and count visible when options button has focus without hover", () => {
    render(
      <SidebarSectionItem
        name="Personal"
        icon={Folder}
        count={5}
        isActive={false}
        onClick={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const optionsBtn = screen.getByRole("button", {
      name: "Options for Personal",
    });
    optionsBtn.focus();
    expect(document.activeElement).toBe(optionsBtn);

    const countBadge = screen.getByText("5");
    expect(countBadge.classList.contains("opacity-0")).toBe(false);
    expect(countBadge.className).not.toContain("focus-within");
    expect(optionsBtn.parentElement?.classList.contains("opacity-0")).toBe(
      true,
    );
    expect(
      optionsBtn.parentElement?.classList.contains("pointer-events-none"),
    ).toBe(true);
    expect(optionsBtn.parentElement?.className).not.toContain("focus-within");
    expect(optionsBtn.parentElement?.className).toContain(
      "has-[:focus-visible]",
    );
    expect(optionsBtn.className).toContain("focus-visible:ring-2");
  });
});

describe("SidebarSection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders section header and items", () => {
    render(
      <SidebarSection
        title="Projects"
        storageKey="sidebar-projects-collapsed"
        icon={Folder}
        type="project"
        items={["Work", "Personal"]}
        activeView="project:Work"
        getTaskCount={(name) => (name === "Work" ? 4 : 0)}
        onNavigate={vi.fn()}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("calls onAdd when plus button is clicked", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    render(
      <SidebarSection
        title="Projects"
        onAdd={onAdd}
        items={[]}
        type="project"
        icon={Folder}
      />,
    );

    const addButton = screen.getByRole("button", { name: "Add project" });
    await user.click(addButton);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("toggles collapse and updates localStorage", async () => {
    const user = userEvent.setup();
    const onToggleCollapse = vi.fn();

    render(
      <SidebarSection
        title="Projects"
        storageKey="sidebar-projects-test"
        icon={Folder}
        type="project"
        items={["Project 1"]}
        onToggleCollapse={onToggleCollapse}
      />,
    );

    expect(screen.getByText("Project 1")).toBeInTheDocument();

    const toggleButton = screen.getByRole("button", {
      name: "Collapse projects",
    });
    await user.click(toggleButton);

    expect(screen.queryByText("Project 1")).not.toBeInTheDocument();
    expect(localStorage.getItem("sidebar-projects-test")).toBe("true");
    expect(onToggleCollapse).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole("button", { name: "Expand projects" }));
    expect(screen.getByText("Project 1")).toBeInTheDocument();
    expect(localStorage.getItem("sidebar-projects-test")).toBe("false");
    expect(onToggleCollapse).toHaveBeenCalledWith(false);
  });

  it("navigates when an item is clicked", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <SidebarSection
        title="Tags"
        icon={Tag}
        type="tag"
        items={["work"]}
        onNavigate={onNavigate}
      />,
    );

    await user.click(screen.getByText("work"));
    expect(onNavigate).toHaveBeenCalledWith("work");
  });

  it("forwards onPin and isItemPinned to items", async () => {
    const user = userEvent.setup();
    const onPin = vi.fn();

    render(
      <SidebarSection
        title="Projects"
        icon={Folder}
        type="project"
        items={["Pinned Project", "Unpinned Project"]}
        onPin={onPin}
        isItemPinned={(name) => name === "Pinned Project"}
      />,
    );

    const pinnedOptionsBtn = screen.getByRole("button", {
      name: "Options for Pinned Project",
    });
    await user.click(pinnedOptionsBtn);
    expect(
      await screen.findByRole("menuitem", { name: "Unpin" }),
    ).toBeInTheDocument();

    // Close and open unpinned options
    await user.click(pinnedOptionsBtn); // toggle off

    const unpinnedOptionsBtn = screen.getByRole("button", {
      name: "Options for Unpinned Project",
    });
    await user.click(unpinnedOptionsBtn);
    const pinItem = await screen.findByRole("menuitem", { name: "Pin" });
    expect(pinItem).toBeInTheDocument();
    await user.click(pinItem);
    expect(onPin).toHaveBeenCalledWith("Unpinned Project");
  });
});

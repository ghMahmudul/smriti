import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TodoItem } from "../../core/types";
import { useSprinkleStore } from "../../store/sprinkle-store";
import TaskDetailPanel from "../task/TaskDetailPanel";

vi.mock("../../store/task-store", () => ({
  useTaskStore: (selector: (state: unknown) => unknown) =>
    selector({
      getProjects: () => ["Project Alpha", "Project Beta"],
      getAllTags: () => ["work", "personal"],
    }),
  useProjects: () => ["Project Alpha", "Project Beta"],
  useAllTags: () => ["work", "personal"],
}));

const mockUseSidebar = vi.fn();
vi.mock("../layout/Layout", () => ({
  useSidebar: () => mockUseSidebar(),
}));

const mockTask: TodoItem = {
  id: "task-1",
  title: "Test Task",
  state: "open",
  projectId: "inbox",
  parentId: null,
  metadata: {
    id: "task-1",
    created: "2026-03-15",
    tags: ["work"],
    due: "2026-03-20",
    priority: "high",
  },
  body: "Task description goes here",
  children: [],
  order: 0,
  attachments: [],
};

describe("TaskDetailPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseSidebar.mockReturnValue({ isMobile: false });
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1280,
    });
  });

  it("renders task title and description", () => {
    render(
      <TaskDetailPanel
        task={mockTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const titleInput = screen.getByDisplayValue("Test Task");
    const descInput = screen.getByDisplayValue("Task description goes here");
    expect(titleInput).toBeInTheDocument();
    expect(titleInput).toHaveClass("text-xl", "md:text-xl");
    expect(descInput).toBeInTheDocument();
    expect(descInput).toHaveClass("text-base", "md:text-base");
  });

  it("renders the resize separator handle on desktop with correct initial width", () => {
    render(
      <TaskDetailPanel
        task={mockTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const separator = screen.getByRole("separator", {
      name: /resize task details panel/i,
    });
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute("aria-valuenow", "420"); // 1280px default is 420
  });

  it("allows resizing via keyboard arrow keys on the separator", () => {
    render(
      <TaskDetailPanel
        task={mockTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const separator = screen.getByRole("separator", {
      name: /resize task details panel/i,
    });

    fireEvent.keyDown(separator, { key: "ArrowLeft" });
    expect(separator).toHaveAttribute("aria-valuenow", "436");

    fireEvent.keyDown(separator, { key: "ArrowRight" });
    expect(separator).toHaveAttribute("aria-valuenow", "420");
  });

  it("resets to default width on double-clicking the separator", async () => {
    const user = userEvent.setup();
    localStorage.setItem("smriti_detail_panel_width", "550");

    render(
      <TaskDetailPanel
        task={mockTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const separator = screen.getByRole("separator", {
      name: /resize task details panel/i,
    });
    expect(separator).toHaveAttribute("aria-valuenow", "550");

    await user.dblClick(separator);
    expect(separator).toHaveAttribute("aria-valuenow", "420");
    expect(localStorage.getItem("smriti_detail_panel_width")).toBeNull();
  });

  it("does not render the resize separator on mobile", () => {
    mockUseSidebar.mockReturnValue({ isMobile: true });

    render(
      <TaskDetailPanel
        task={mockTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("separator", { name: /resize task details panel/i }),
    ).not.toBeInTheDocument();
  });

  it("renders regular priority color for regular open task checkbox", () => {
    render(
      <TaskDetailPanel
        task={mockTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const checkbox = screen.getByRole("button", { name: "Mark as done" });
    const icon = checkbox.querySelector("svg");
    expect(icon).toHaveClass("text-red-500");
    expect(icon).toHaveClass("lucide-circle");
  });

  it("renders regular priority color and CircleDashed for archived open task checkbox", () => {
    const archivedTask: TodoItem = {
      ...mockTask,
      metadata: { ...mockTask.metadata, archived: "2026-03-20" },
    };

    render(
      <TaskDetailPanel
        task={archivedTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const checkbox = screen.getByRole("button", { name: "Mark as done" });
    const icon = checkbox.querySelector("svg");
    expect(icon).toHaveClass("text-red-500");
    expect(icon).toHaveClass("lucide-circle-dashed");
  });

  it("renders muted priority color and CheckCircle2 for completed task checkbox", () => {
    const doneTask: TodoItem = {
      ...mockTask,
      state: "done",
    };

    render(
      <TaskDetailPanel
        task={doneTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const checkbox = screen.getByRole("button", { name: "Mark as not done" });
    const icon = checkbox.querySelector("svg");
    expect(icon).toHaveClass("text-red-500/50");
    expect(icon).toHaveClass("lucide-check-circle-2");
  });

  it("renders muted title and muted date when task is completed", () => {
    const doneTask: TodoItem = {
      ...mockTask,
      state: "done",
    };

    render(
      <TaskDetailPanel
        task={doneTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const titleInput = screen.getByDisplayValue("Test Task");
    expect(titleInput).toHaveClass("text-muted-foreground");

    const dueDateButton = screen.getByRole("button", { name: /mar 20/i });
    expect(dueDateButton).toHaveClass("text-muted-foreground");
    expect(dueDateButton).not.toHaveClass("text-emerald-600");
    expect(dueDateButton).not.toHaveClass("text-red-500");
    const dateIcon = dueDateButton.querySelector("svg");
    expect(dateIcon).toHaveClass("size-4");
  });

  it("renders top and bottom bars with 10px vertical and 14px horizontal padding", () => {
    const { container } = render(
      <TaskDetailPanel
        task={mockTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const bars = container.querySelectorAll(".px-3\\.5.py-2\\.5");
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveClass("border-b", "border-border");
    expect(bars[1]).not.toHaveClass("border-b");
  });

  it("retains bg-primary/50 for the resize dragger during drag", () => {
    render(
      <TaskDetailPanel
        task={mockTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const separator = screen.getByRole("separator", {
      name: /resize task details panel/i,
    });
    const draggerBar = separator.firstElementChild;
    expect(draggerBar).toHaveClass("group-hover:bg-primary/50");

    fireEvent.pointerDown(separator, { button: 0, clientX: 500 });
    expect(draggerBar).toHaveClass("bg-primary/50");
    expect(draggerBar).not.toHaveClass("bg-primary");
  });

  it("renders 'Archive' and 'Delete' in more menu for regular open task", async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    const onDelete = vi.fn();

    render(
      <TaskDetailPanel
        task={mockTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
        onArchive={onArchive}
        onToggleState={vi.fn()}
      />,
    );

    const moreButton = screen.getByRole("button", { name: "More options" });
    await user.click(moreButton);
    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("menuitem", { name: "Archive" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Delete" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Archive" }));
    expect(onArchive).toHaveBeenCalledWith("task-1");
  });

  it("renders 'Unarchive' in more menu for archived task", async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    const archivedTask: TodoItem = {
      ...mockTask,
      metadata: { ...mockTask.metadata, archived: "2026-03-20" },
    };

    render(
      <TaskDetailPanel
        task={archivedTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onArchive={onArchive}
        onToggleState={vi.fn()}
      />,
    );

    const moreButton = screen.getByRole("button", { name: "More options" });
    await user.click(moreButton);
    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("menuitem", { name: "Unarchive" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Archive" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Unarchive" }));
    expect(onArchive).toHaveBeenCalledWith("task-1");
  });

  it("renders 'Restore' instead of 'Archive' in more menu for trashed task", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    const onDelete = vi.fn();
    const trashedTask: TodoItem = {
      ...mockTask,
      metadata: { ...mockTask.metadata, trashed: "2026-03-20" },
    };

    render(
      <TaskDetailPanel
        task={trashedTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
        onArchive={vi.fn()}
        onRestore={onRestore}
        onToggleState={vi.fn()}
      />,
    );

    const moreButton = screen.getByRole("button", { name: "More options" });
    await user.click(moreButton);
    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("menuitem", { name: "Restore" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Archive" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Unarchive" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Delete permanently" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Restore" }));
    expect(onRestore).toHaveBeenCalledWith("task-1");
  });

  it("triggers a sprinkle and calls onToggleState when marking open task as done", async () => {
    const user = userEvent.setup();
    const onToggleState = vi.fn();
    useSprinkleStore.setState({ latestBurst: null });

    render(
      <TaskDetailPanel
        task={mockTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
        onToggleState={onToggleState}
      />,
    );

    const checkbox = screen.getByRole("button", { name: "Mark as done" });
    await user.click(checkbox);

    expect(onToggleState).toHaveBeenCalledWith(mockTask);
    const burst = useSprinkleStore.getState().latestBurst;
    expect(burst).not.toBeNull();
    expect(burst?.priority).toBe("high");
  });

  it("does not trigger a sprinkle when unmarking a done task", async () => {
    const user = userEvent.setup();
    const onToggleState = vi.fn();
    useSprinkleStore.setState({ latestBurst: null });

    const doneTask: TodoItem = {
      ...mockTask,
      state: "done",
    };

    render(
      <TaskDetailPanel
        task={doneTask}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
        onToggleState={onToggleState}
      />,
    );

    const checkbox = screen.getByRole("button", { name: "Mark as not done" });
    await user.click(checkbox);

    expect(onToggleState).toHaveBeenCalledWith(doneTask);
    expect(useSprinkleStore.getState().latestBurst).toBeNull();
  });

  it("automatically sets due date when repeat is selected on an undated task", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();

    const undatedTask: TodoItem = {
      ...mockTask,
      metadata: {
        ...mockTask.metadata,
        due: undefined,
        repeat: undefined,
      },
    };

    render(
      <TaskDetailPanel
        task={undatedTask}
        onClose={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const dateButton = screen.getByRole("button", { name: /^date$/i });
    await user.click(dateButton);

    const repeatButton = await screen.findByRole("button", {
      name: /^repeat$/i,
    });
    await user.click(repeatButton);

    const dailyItem = await screen.findByRole("menuitemradio", {
      name: /daily/i,
    });
    await user.click(dailyItem);

    expect(onUpdate).toHaveBeenCalledWith(
      "task-1",
      expect.objectContaining({
        metadata: expect.objectContaining({
          repeat: "daily",
          due: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      }),
    );
  });

  it("clears repeat when due date is removed via No Date", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();

    const repeatingTask: TodoItem = {
      ...mockTask,
      metadata: {
        ...mockTask.metadata,
        due: "2026-10-22",
        repeat: "daily",
      },
    };

    render(
      <TaskDetailPanel
        task={repeatingTask}
        onClose={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        onArchive={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const dateButton = screen.getByRole("button", {
      name: /repeats daily/i,
    });
    await user.click(dateButton);

    const noDateOption = await screen.findByRole("button", {
      name: /no date/i,
    });
    await user.click(noDateOption);

    expect(onUpdate).toHaveBeenCalledWith(
      "task-1",
      expect.objectContaining({
        metadata: expect.objectContaining({
          due: undefined,
          repeat: undefined,
        }),
      }),
    );
  });
});

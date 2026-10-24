import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TodoItem } from "../../core/types";
import TaskItem, {
  getTaskDescriptionPreview,
  MAX_PREVIEW_WORDS,
} from "../task/TaskItem";

const mockTask: TodoItem = {
  id: "task-1",
  title: "Test task item",
  state: "open",
  projectId: "inbox",
  parentId: null,
  metadata: {
    id: "task-1",
    created: "2026-03-15",
    tags: ["work"],
    due: "2026-03-20",
  },
  body: "This is a body preview",
  children: [],
  order: 0,
  attachments: [],
};

describe("TaskItem", () => {
  it("renders without background by default and includes hover class", () => {
    render(
      <TaskItem
        task={mockTask}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const taskRow = screen.getByTestId("task-item");
    expect(taskRow).toBeInTheDocument();
    expect(taskRow.className).toContain("bg-transparent");
    expect(taskRow.className).toContain("hover:bg-muted/60");
    expect(taskRow.className).not.toContain("bg-muted/50");
  });

  it("renders with 10px 14px 10px 10px padding (py-2.5 pl-2.5 pr-3.5)", () => {
    render(
      <TaskItem
        task={mockTask}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const taskRow = screen.getByTestId("task-item");
    expect(taskRow).toHaveClass("py-2.5", "pl-2.5", "pr-3.5");
  });

  it("renders with bg-muted without border when selected", () => {
    render(
      <TaskItem
        task={mockTask}
        isSelected={true}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const taskRow = screen.getByTestId("task-item");
    expect(taskRow).toBeInTheDocument();
    expect(taskRow.className).toContain("bg-muted");
    expect(taskRow.className).not.toContain("border-border");
  });

  it("calls onSelect when row is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        isSelected={false}
        onSelect={onSelect}
        onToggleState={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Test task item"));
    expect(onSelect).toHaveBeenCalledWith("task-1");
  });

  it("calls onToggleState when checkbox button is clicked without triggering onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onToggleState = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        isSelected={false}
        onSelect={onSelect}
        onToggleState={onToggleState}
      />,
    );

    const checkbox = screen.getByRole("button", { name: "Mark as done" });
    await user.click(checkbox);

    await waitFor(() => {
      expect(onToggleState).toHaveBeenCalledWith(mockTask);
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders priority color for regular open task checkbox", () => {
    const highTask: TodoItem = {
      ...mockTask,
      metadata: { ...mockTask.metadata, priority: "high" },
    };
    render(
      <TaskItem
        task={highTask}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );
    const checkbox = screen.getByRole("button", { name: "Mark as done" });
    const icon = checkbox.querySelector("svg");
    expect(icon).toHaveClass("text-red-500");
  });

  it("renders regular priority color for archived open task checkbox", () => {
    const archivedHighTask: TodoItem = {
      ...mockTask,
      metadata: {
        ...mockTask.metadata,
        priority: "high",
        archived: "2026-03-20",
      },
    };
    render(
      <TaskItem
        task={archivedHighTask}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );
    const checkbox = screen.getByRole("button", { name: "Mark as done" });
    const icon = checkbox.querySelector("svg");
    expect(icon).toHaveClass("text-red-500");
    expect(icon).toHaveClass("lucide-circle-dashed");
  });

  it("renders muted priority color for completed task checkbox", () => {
    const doneHighTask: TodoItem = {
      ...mockTask,
      state: "done",
      metadata: { ...mockTask.metadata, priority: "high" },
    };
    render(
      <TaskItem
        task={doneHighTask}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );
    const checkbox = screen.getByRole("button", { name: "Mark as not done" });
    const icon = checkbox.querySelector("svg");
    expect(icon).toHaveClass("text-red-500/50");
    expect(icon).toHaveClass("lucide-check-circle-2");
  });

  it("renders title with text-muted-foreground and no line-through when done", () => {
    const doneTask: TodoItem = {
      ...mockTask,
      state: "done",
    };
    render(
      <TaskItem
        task={doneTask}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );
    const title = screen.getByText("Test task item");
    expect(title).toHaveClass("text-muted-foreground");
    expect(title).not.toHaveClass("line-through");
  });

  it("renders date with text-muted-foreground when done", () => {
    const doneTaskWithDue: TodoItem = {
      ...mockTask,
      state: "done",
      metadata: { ...mockTask.metadata, due: "2026-03-20" },
    };
    render(
      <TaskItem
        task={doneTaskWithDue}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );
    const dueDate = screen.getByText("Mar 20");
    expect(dueDate).toHaveClass("text-muted-foreground");
    expect(dueDate).not.toHaveClass("text-emerald-600");
    expect(dueDate).not.toHaveClass("text-red-500");
  });

  it("applies completion animation styling and disables button when isCompleting is true", () => {
    render(
      <TaskItem
        task={mockTask}
        isSelected={false}
        isCompleting={true}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const taskRow = screen.getByTestId("task-item");
    expect(taskRow).toHaveClass(
      "scale-[0.88]",
      "opacity-0",
      "pointer-events-none",
    );

    const checkbox = screen.getByRole("button", { name: "Mark as done" });
    expect(checkbox).toBeDisabled();

    const icon = checkbox.querySelector("svg");
    expect(icon).toHaveClass("lucide-check-circle-2", "animate-in");
  });

  it("does not apply done styling when isCompleting is true for trashed or archived tasks", () => {
    const trashedTask: TodoItem = {
      ...mockTask,
      metadata: { ...mockTask.metadata, trashed: "2026-03-20T00:00:00.000Z" },
    };

    const { rerender } = render(
      <TaskItem
        task={trashedTask}
        isSelected={false}
        isCompleting={true}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    expect(screen.getByText("Test task item")).not.toHaveClass("line-through");
    const checkbox = screen.getByRole("button", { name: "Mark as done" });
    const icon = checkbox.querySelector("svg");
    expect(icon).not.toHaveClass("lucide-check-circle-2");

    const archivedTask: TodoItem = {
      ...mockTask,
      metadata: { ...mockTask.metadata, archived: "2026-03-20T00:00:00.000Z" },
    };

    rerender(
      <TaskItem
        task={archivedTask}
        isSelected={false}
        isCompleting={true}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    expect(screen.getByText("Test task item")).not.toHaveClass("line-through");
    const archivedIcon = screen
      .getByRole("button", { name: "Mark as done" })
      .querySelector("svg");
    expect(archivedIcon).toHaveClass("lucide-circle-dashed");
  });

  it("triggers onSelect on Enter key on the row", () => {
    const onSelect = vi.fn();
    render(
      <TaskItem
        task={mockTask}
        isSelected={false}
        onSelect={onSelect}
        onToggleState={vi.fn()}
      />,
    );

    const taskRow = screen.getByTestId("task-item");
    fireEvent.keyDown(taskRow, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(mockTask.id);
  });

  it("renders description preview when body is present", () => {
    render(
      <TaskItem
        task={mockTask}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    expect(screen.getByText("This is a body preview")).toBeInTheDocument();
  });

  it("truncates description by word limit with ellipsis and without cutting words in half", () => {
    const longDescTask: TodoItem = {
      ...mockTask,
      body: "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen",
    };

    render(
      <TaskItem
        task={longDescTask}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen...",
      ),
    ).toBeInTheDocument();
  });

  it("does not render description preview paragraph when body is empty or whitespace", () => {
    const emptyBodyTask: TodoItem = {
      ...mockTask,
      body: "   \n\t  ",
    };

    render(
      <TaskItem
        task={emptyBodyTask}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    expect(
      screen.queryByText("This is a body preview"),
    ).not.toBeInTheDocument();
    const taskRow = screen.getByTestId("task-item");
    expect(taskRow.querySelector("p")).toBeNull();
  });

  it("aligns project badge with title row when task has only title", () => {
    const titleOnlyTask: TodoItem = {
      ...mockTask,
      projectId: "project-alpha",
      body: "",
      metadata: { id: "task-1", created: "2026-03-15" },
    };

    render(
      <TaskItem
        task={titleOnlyTask}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const titleEl = screen.getByText("Test task item");
    const projectBadge = screen.getByText("project-alpha");
    expect(titleEl.closest("div")).toContainElement(projectBadge);
  });

  it("aligns project badge with description row when task has description and no meta", () => {
    const descTask: TodoItem = {
      ...mockTask,
      projectId: "project-alpha",
      body: "Some description text",
      metadata: { id: "task-1", created: "2026-03-15" },
    };

    render(
      <TaskItem
        task={descTask}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const titleEl = screen.getByText("Test task item");
    const descEl = screen.getByText("Some description text");
    const projectBadge = screen.getByText("project-alpha");

    expect(titleEl.closest("div")).not.toContainElement(projectBadge);
    expect(descEl.closest("div")).toContainElement(projectBadge);
  });

  it("aligns project badge with meta row when metadata is present", () => {
    const metaTask: TodoItem = {
      ...mockTask,
      projectId: "project-alpha",
      body: "Some description text",
      metadata: { id: "task-1", created: "2026-03-15", tags: ["dev"] },
    };

    render(
      <TaskItem
        task={metaTask}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const titleEl = screen.getByText("Test task item");
    const descEl = screen.getByText("Some description text");
    const projectBadge = screen.getByText("project-alpha");

    expect(titleEl.closest("div")).not.toContainElement(projectBadge);
    expect(descEl.closest("div")).not.toContainElement(projectBadge);
    expect(screen.getByTestId("task-item")).toContainElement(projectBadge);
  });

  it("aligns project badge with meta row when title and meta exist without description", () => {
    const titleAndMetaTask: TodoItem = {
      ...mockTask,
      projectId: "project-alpha",
      body: "",
      metadata: { id: "task-1", created: "2026-03-15", due: "2026-03-20" },
    };

    render(
      <TaskItem
        task={titleAndMetaTask}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    const titleEl = screen.getByText("Test task item");
    const projectBadge = screen.getByText("project-alpha");
    expect(titleEl.closest("div")).not.toContainElement(projectBadge);
    expect(screen.getByTestId("task-item")).toContainElement(projectBadge);
  });

  it("renders tooltip title attributes for title, description, and project badge", () => {
    render(
      <TaskItem
        task={mockTask}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    expect(screen.getByText("Test task item")).toHaveAttribute(
      "title",
      "Test task item",
    );
    expect(screen.getByText("This is a body preview")).toHaveAttribute(
      "title",
      "This is a body preview",
    );
    expect(screen.getByText("Inbox")).toHaveAttribute("title", "Inbox");
  });
});

describe("getTaskDescriptionPreview", () => {
  it("returns undefined for undefined, empty, whitespace-only body, or non-positive maxWords", () => {
    expect(getTaskDescriptionPreview(undefined)).toBeUndefined();
    expect(getTaskDescriptionPreview("")).toBeUndefined();
    expect(getTaskDescriptionPreview("   \n\t  ")).toBeUndefined();
    expect(getTaskDescriptionPreview("Valid text", 0)).toBeUndefined();
    expect(getTaskDescriptionPreview("Valid text", -1)).toBeUndefined();
  });

  it("returns exact text when word count is within limit", () => {
    expect(getTaskDescriptionPreview("SingleWord")).toBe("SingleWord");
    expect(getTaskDescriptionPreview("One two three four five")).toBe(
      "One two three four five",
    );
  });

  it("truncates by word limit and appends ellipsis without cutting off words", () => {
    const text =
      "Alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu";
    expect(getTaskDescriptionPreview(text, 5)).toBe(
      "Alpha beta gamma delta epsilon...",
    );
    expect(getTaskDescriptionPreview(text, 10)).toBe(
      "Alpha beta gamma delta epsilon zeta eta theta iota kappa...",
    );
  });

  it("normalizes newlines and multiple whitespace characters", () => {
    const multiline = "Line one\n  line two\n\nline   three";
    expect(getTaskDescriptionPreview(multiline, 10)).toBe(
      "Line one line two line three",
    );
  });

  it("strips trailing punctuation before adding ellipsis", () => {
    const punctuated = "First, second, third, fourth, fifth. Sixth";
    expect(getTaskDescriptionPreview(punctuated, 5)).toBe(
      "First, second, third, fourth, fifth...",
    );
  });

  it("uses MAX_PREVIEW_WORDS by default", () => {
    expect(MAX_PREVIEW_WORDS).toBe(15);
    const fifteenWords =
      "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen";
    expect(getTaskDescriptionPreview(fifteenWords)).toBe(fifteenWords);
    expect(getTaskDescriptionPreview(`${fifteenWords} sixteen`)).toBe(
      `${fifteenWords}...`,
    );
  });

  it("handles very large body efficiently without processing all words", () => {
    const hugeBody = "word ".repeat(50000);
    const start = performance.now();
    const result = getTaskDescriptionPreview(hugeBody);
    const duration = performance.now() - start;

    expect(result).toBe(`${"word ".repeat(15).trim()}...`);
    expect(duration).toBeLessThan(20);
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TodoItem } from "../../core/types";
import TaskList from "../task/TaskList";

const task1: TodoItem = {
  id: "task-1",
  title: "First Task",
  state: "open",
  projectId: "inbox",
  parentId: null,
  metadata: { id: "task-1", created: "2026-03-15" },
  body: "",
  children: [],
  order: 0,
  attachments: [],
};

const task2: TodoItem = {
  id: "task-2",
  title: "Second Task",
  state: "open",
  projectId: "inbox",
  parentId: null,
  metadata: { id: "task-2", created: "2026-03-15" },
  body: "",
  children: [],
  order: 1,
  attachments: [],
};

describe("TaskList animated presence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders tasks and passes isCompleting=false initially", () => {
    render(
      <TaskList
        tasks={[task1, task2]}
        selectedTaskId={null}
        onSelectTask={vi.fn()}
        onToggleState={vi.fn()}
      />,
    );

    expect(screen.getByText("First Task")).toBeInTheDocument();
    expect(screen.getByText("Second Task")).toBeInTheDocument();

    const items = screen.getAllByTestId("task-item");
    expect(items[0]).not.toHaveClass("scale-[0.88]");
    expect(items[1]).not.toHaveClass("scale-[0.88]");
  });

  it("calls onToggleState immediately when checkbox is clicked", () => {
    const onToggleState = vi.fn();

    render(
      <TaskList
        tasks={[task1]}
        selectedTaskId={null}
        onSelectTask={vi.fn()}
        onToggleState={onToggleState}
      />,
    );

    const checkbox = screen.getByRole("button", { name: "Mark as done" });
    fireEvent.click(checkbox);

    expect(onToggleState).toHaveBeenCalledTimes(1);
    expect(onToggleState).toHaveBeenCalledWith(task1);
  });

  it("retains removed task with isCompleting=true for 400ms then unmounts it", () => {
    const onExitingChange = vi.fn();

    const { rerender } = render(
      <TaskList
        tasks={[task1, task2]}
        selectedTaskId={null}
        onSelectTask={vi.fn()}
        onToggleState={vi.fn()}
        onExitingChange={onExitingChange}
      />,
    );

    expect(screen.getByText("First Task")).toBeInTheDocument();
    expect(screen.getByText("Second Task")).toBeInTheDocument();

    // Now task1 is completed and filtered out of tasks
    rerender(
      <TaskList
        tasks={[task2]}
        selectedTaskId={null}
        onSelectTask={vi.fn()}
        onToggleState={vi.fn()}
        onExitingChange={onExitingChange}
      />,
    );

    // Both tasks are still in DOM
    expect(screen.getByText("First Task")).toBeInTheDocument();
    expect(screen.getByText("Second Task")).toBeInTheDocument();

    // First task now has completion animation classes
    const items = screen.getAllByTestId("task-item");
    expect(items[0]).toHaveClass(
      "scale-[0.88]",
      "opacity-0",
      "pointer-events-none",
    );
    expect(items[1]).not.toHaveClass("scale-[0.88]");

    // onExitingChange should have reported true
    expect(onExitingChange).toHaveBeenCalledWith(true);

    // Advance by 399ms
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(screen.getByText("First Task")).toBeInTheDocument();

    // Advance by 1ms (total 400ms)
    act(() => {
      vi.advanceTimersByTime(1);
    });

    // First task should now be completely removed from the DOM
    expect(screen.queryByText("First Task")).not.toBeInTheDocument();
    expect(screen.getByText("Second Task")).toBeInTheDocument();
    expect(onExitingChange).toHaveBeenLastCalledWith(false);
  });
});

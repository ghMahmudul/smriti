import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getFutureLocalDateString,
  getTodayLocalDateString,
} from "../../core/date-utils";
import type { TodoItem } from "../../core/types";
import { useTaskDraftStore } from "../../store/task-draft-store";
import { useUIStore } from "../../store/ui-store";
import TaskViewContent from "../task/TaskViewContent";

const mockAddTask = vi.fn();
const mockUpdateTask = vi.fn();
const mockGetTask = vi.fn();
let mockActivePath = "/today";
let mockParams: Record<string, string | undefined> = {};
let mockTasksByView: TodoItem[] = [];

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: mockActivePath, search: "", state: null }),
    useParams: () => mockParams,
  };
});

vi.mock("../layout/Layout", () => ({
  useSidebar: () => ({ collapsed: false, toggle: vi.fn(), isMobile: false }),
}));

vi.mock("../../store/workspace-store", () => ({
  useWorkspaceStore: (selector: (state: unknown) => unknown) =>
    selector({
      settings: { defaultView: "all", tags: ["work", "design"] },
    }),
}));

vi.mock("../../store/task-store", () => ({
  useTaskStore: (selector: (state: unknown) => unknown) =>
    selector({
      addTask: mockAddTask,
      updateTask: mockUpdateTask,
      deleteTask: vi.fn(),
      bulkDeleteTasks: vi.fn(),
      bulkUpdateTasks: vi.fn(),
      getTask: (id: string) => mockGetTask(id),
      isLoaded: true,
      getProjects: () => ["Inbox"],
      getAllTags: () => ["work", "design"],
    }),
  useTasksByView: () => mockTasksByView,
  useProjects: () => ["Inbox"],
  useAllTags: () => ["work", "design"],
}));

describe("TaskViewContent modal defaults", () => {
  const todayStr = getTodayLocalDateString();
  const tomorrowStr = getFutureLocalDateString(1);

  const todayParts = todayStr.split("-").map(Number);
  const expectedFormattedDate = new Date(
    todayParts[0] ?? 0,
    (todayParts[1] ?? 1) - 1,
    todayParts[2] ?? 1,
  ).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  beforeEach(() => {
    vi.clearAllMocks();
    useTaskDraftStore.getState().resetAll();
    mockActivePath = "/today";
    mockParams = {};
    mockTasksByView = [];
    mockGetTask.mockReset();
    mockUpdateTask.mockReset();
  });

  it("sets today date on first task and retains today date when creating second task in Today view", async () => {
    const user = userEvent.setup();
    mockActivePath = "/today";
    mockParams = {};

    render(<TaskViewContent />);

    // Open Add task modal
    const addBtn = screen.getByRole("button", { name: /add task/i });
    await user.click(addBtn);

    // Verify DatePicker displays formatted date
    expect(screen.getByText(expectedFormattedDate)).toBeInTheDocument();

    // Type title and submit first task
    const titleInput = screen.getByPlaceholderText("Next thing to do");
    await user.type(titleInput, "Task 1");
    fireEvent.keyDown(titleInput, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(mockAddTask).toHaveBeenCalledTimes(1);
      expect(mockAddTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Task 1",
          metadata: expect.objectContaining({
            due: todayStr,
          }),
        }),
        "Inbox",
      );
    });

    // Open Add task modal second time
    await user.click(screen.getByRole("button", { name: /add task/i }));

    // Verify DatePicker still has today's date selected!
    expect(screen.getByText(expectedFormattedDate)).toBeInTheDocument();

    // Type title and submit second task
    const secondTitleInput = screen.getByPlaceholderText("Next thing to do");
    await user.type(secondTitleInput, "Task 2");
    fireEvent.keyDown(secondTitleInput, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(mockAddTask).toHaveBeenCalledTimes(2);
      expect(mockAddTask).toHaveBeenLastCalledWith(
        expect.objectContaining({
          title: "Task 2",
          metadata: expect.objectContaining({
            due: todayStr,
          }),
        }),
        "Inbox",
      );
    });
  });

  it("sets tomorrow date on first task and retains it when creating second task in Upcoming view", async () => {
    const user = userEvent.setup();
    mockActivePath = "/upcoming";
    mockParams = {};

    render(<TaskViewContent />);

    const addBtn = screen.getByRole("button", { name: /add task/i });
    await user.click(addBtn);

    // Type title and submit first task
    const titleInput = screen.getByPlaceholderText("Next thing to do");
    await user.type(titleInput, "Upcoming Task 1");
    fireEvent.keyDown(titleInput, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(mockAddTask).toHaveBeenCalledTimes(1);
      expect(mockAddTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Upcoming Task 1",
          metadata: expect.objectContaining({
            due: tomorrowStr,
          }),
        }),
        "Inbox",
      );
    });

    // Open Add task modal second time
    await user.click(screen.getByRole("button", { name: /add task/i }));

    const secondTitleInput = screen.getByPlaceholderText("Next thing to do");
    await user.type(secondTitleInput, "Upcoming Task 2");
    fireEvent.keyDown(secondTitleInput, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(mockAddTask).toHaveBeenCalledTimes(2);
      expect(mockAddTask).toHaveBeenLastCalledWith(
        expect.objectContaining({
          title: "Upcoming Task 2",
          metadata: expect.objectContaining({
            due: tomorrowStr,
          }),
        }),
        "Inbox",
      );
    });
  });

  it("automatically sets the tag in Tag view and retains it on second task creation", async () => {
    const user = userEvent.setup();
    mockActivePath = "/tag/work";
    mockParams = { tagName: "work" };

    render(<TaskViewContent />);

    // Open Add task modal
    const addBtn = screen.getByRole("button", { name: /add task/i });
    await user.click(addBtn);

    // Verify tag button shows 1 tag
    expect(screen.getByText("1 tag")).toBeInTheDocument();

    // Type title and submit first task
    const titleInput = screen.getByPlaceholderText("Next thing to do");
    await user.type(titleInput, "Work Task 1");
    fireEvent.keyDown(titleInput, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(mockAddTask).toHaveBeenCalledTimes(1);
      expect(mockAddTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Work Task 1",
          metadata: expect.objectContaining({
            tags: ["work"],
          }),
        }),
        "Inbox",
      );
    });

    // Open Add task modal second time
    await user.click(screen.getByRole("button", { name: /add task/i }));

    // Verify tag button still shows 1 tag
    expect(screen.getByText("1 tag")).toBeInTheDocument();

    const secondTitleInput = screen.getByPlaceholderText("Next thing to do");
    await user.type(secondTitleInput, "Work Task 2");
    fireEvent.keyDown(secondTitleInput, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(mockAddTask).toHaveBeenCalledTimes(2);
      expect(mockAddTask).toHaveBeenLastCalledWith(
        expect.objectContaining({
          title: "Work Task 2",
          metadata: expect.objectContaining({
            tags: ["work"],
          }),
        }),
        "Inbox",
      );
    });
  });

  it("preserves task draft inputs when modal is closed and reopened before submission, but resets when view changes", async () => {
    const user = userEvent.setup();
    mockActivePath = "/today";
    mockParams = {};

    const { rerender } = render(<TaskViewContent />);

    // Open Add task modal
    const addBtn = screen.getByRole("button", { name: /add task/i });
    await user.click(addBtn);

    // Type title and description
    const titleInput = screen.getByPlaceholderText("Next thing to do");
    await user.type(titleInput, "Draft Title");
    const descInput = screen.getByPlaceholderText("Description");
    await user.type(descInput, "Draft Description");

    // Close modal by pressing Escape
    await user.keyboard("{Escape}");

    // Modal is closed
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Next thing to do"),
      ).not.toBeInTheDocument();
    });

    // Reopen modal on same view
    await user.click(screen.getByRole("button", { name: /add task/i }));

    // Input values are preserved!
    expect(screen.getByPlaceholderText("Next thing to do")).toHaveValue(
      "Draft Title",
    );
    expect(screen.getByPlaceholderText("Description")).toHaveValue(
      "Draft Description",
    );

    // Close modal again
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Next thing to do"),
      ).not.toBeInTheDocument();
    });

    // Switch view / route to /upcoming
    mockActivePath = "/upcoming";
    rerender(<TaskViewContent />);

    // Open modal in the new view
    await user.click(screen.getByRole("button", { name: /add task/i }));

    // Draft is reset on view change!
    expect(screen.getByPlaceholderText("Next thing to do")).toHaveValue("");
    expect(screen.getByPlaceholderText("Description")).toHaveValue("");
  });

  it("stores task as archived when created in Archived view", async () => {
    const user = userEvent.setup();
    mockActivePath = "/archived";
    mockParams = {};

    render(<TaskViewContent />);

    // Open Add task modal
    const addBtn = screen.getByRole("button", { name: /add task/i });
    await user.click(addBtn);

    // Type title and submit task
    const titleInput = screen.getByPlaceholderText("Next thing to do");
    await user.type(titleInput, "Archived Task 1");
    fireEvent.keyDown(titleInput, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(mockAddTask).toHaveBeenCalledTimes(1);
      expect(mockAddTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Archived Task 1",
          metadata: expect.objectContaining({
            created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
            archived: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          }),
        }),
        "Inbox",
      );
    });
  });

  it("closes the detail panel when the selected task is completed from the detail panel", async () => {
    const user = userEvent.setup();
    const testTask: TodoItem = {
      id: "task-to-complete",
      title: "Task To Complete",
      state: "open",
      projectId: "Inbox",
      parentId: null,
      metadata: { id: "task-to-complete", created: todayStr },
      body: "Task detail description",
      children: [],
      order: 0,
      attachments: [],
    };

    mockActivePath = "/inbox";
    mockParams = {};
    mockTasksByView = [testTask];
    mockGetTask.mockReturnValue(testTask);

    render(<TaskViewContent />);

    // Select the task by clicking on it in the list
    const taskItem = screen.getByText("Task To Complete");
    await user.click(taskItem);

    // Detail panel is open
    expect(
      screen.getByDisplayValue("Task detail description"),
    ).toBeInTheDocument();

    // Click checkbox in detail panel to complete the task
    const markAsDoneBtns = screen.getAllByRole("button", {
      name: "Mark as done",
    });
    await user.click(markAsDoneBtns[1]!);

    // Verify updateTask was called
    expect(mockUpdateTask).toHaveBeenCalledWith(
      "task-to-complete",
      expect.objectContaining({
        state: "done",
        metadata: expect.objectContaining({
          completed: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        }),
      }),
    );

    // Detail panel is closed (hidden via translate-x-full and aria-hidden="true")
    await waitFor(() => {
      const panel = screen
        .getByDisplayValue("Task detail description")
        .closest("div[aria-hidden]");
      expect(panel).toHaveAttribute("aria-hidden", "true");
      expect(panel).toHaveClass("translate-x-full");
    });
  });

  it("renders TaskSortMenu on active task views but not on archived, completed, or trash views", () => {
    mockActivePath = "/inbox";
    mockParams = {};
    mockTasksByView = [];
    const { rerender } = render(<TaskViewContent />);

    expect(
      screen.getByRole("button", { name: "Sort tasks" }),
    ).toBeInTheDocument();

    mockActivePath = "/archived";
    rerender(<TaskViewContent />);
    expect(
      screen.queryByRole("button", { name: "Sort tasks" }),
    ).not.toBeInTheDocument();

    mockActivePath = "/completed";
    rerender(<TaskViewContent />);
    expect(
      screen.queryByRole("button", { name: "Sort tasks" }),
    ).not.toBeInTheDocument();

    mockActivePath = "/trash";
    rerender(<TaskViewContent />);
    expect(
      screen.queryByRole("button", { name: "Sort tasks" }),
    ).not.toBeInTheDocument();
  });

  it("applies sorting to active tasks when taskSortBy is set", () => {
    useUIStore.setState({
      taskSortBy: "priority",
      taskSortOrder: "desc",
    });

    const taskLow: TodoItem = {
      id: "task-low",
      title: "Low Priority Task",
      state: "open",
      projectId: "Inbox",
      parentId: null,
      metadata: { id: "task-low", created: todayStr, priority: "low" },
      body: "",
      children: [],
      order: 0,
      attachments: [],
    };
    const taskHigh: TodoItem = {
      id: "task-high",
      title: "High Priority Task",
      state: "open",
      projectId: "Inbox",
      parentId: null,
      metadata: { id: "task-high", created: todayStr, priority: "high" },
      body: "",
      children: [],
      order: 1,
      attachments: [],
    };

    mockActivePath = "/inbox";
    mockParams = {};
    mockTasksByView = [taskLow, taskHigh];

    render(<TaskViewContent />);

    const titles = screen.getAllByRole("button", { name: /priority task/i });
    expect(titles[0]).toHaveTextContent("High Priority Task");
    expect(titles[1]).toHaveTextContent("Low Priority Task");
  });

  it("renders filter button on completed view and allows filtering tasks", async () => {
    const user = userEvent.setup();
    mockActivePath = "/completed";
    mockParams = {};

    const completedTask1: TodoItem = {
      id: "c-1",
      title: "Completed Task 1",
      state: "done",
      projectId: "Inbox",
      parentId: null,
      metadata: {
        id: "c-1",
        created: todayStr,
        completed: `${todayStr}T10:00:00Z`,
      },
      body: "",
      children: [],
      order: 0,
      attachments: [],
    };
    const completedTask2: TodoItem = {
      id: "c-2",
      title: "Completed Task 2",
      state: "done",
      projectId: "work",
      parentId: null,
      metadata: {
        id: "c-2",
        created: todayStr,
        completed: "2026-01-01T10:00:00Z",
      },
      body: "",
      children: [],
      order: 1,
      attachments: [],
    };

    mockTasksByView = [completedTask1, completedTask2];

    const { rerender } = render(<TaskViewContent />);

    // Filter button is present in completed view
    const filterBtn = screen.getByRole("button", {
      name: "Filter tasks",
    });
    expect(filterBtn).toBeInTheDocument();
    expect(filterBtn).toHaveTextContent("Filter");

    // Both tasks are initially visible
    expect(screen.getByText("Completed Task 1")).toBeInTheDocument();
    expect(screen.getByText("Completed Task 2")).toBeInTheDocument();

    // Open filter popover and select "Today"
    await user.click(filterBtn);
    await user.click(screen.getByTestId("filter-quick-today"));

    // Filter button text changes to reflect the active filter
    expect(filterBtn).toHaveTextContent("Today");

    // Now only Completed Task 1 (completed today) is shown
    expect(screen.getByText("Completed Task 1")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Completed Task 2")).not.toBeInTheDocument();
    });

    // Switching tab / route preserves the filter during the session
    mockActivePath = "/inbox";
    rerender(<TaskViewContent />);

    mockActivePath = "/completed";
    rerender(<TaskViewContent />);

    // Filter remains preserved: only Completed Task 1 is shown and button still displays "Today"
    expect(
      screen.getByRole("button", { name: /filter tasks/i }),
    ).toHaveTextContent("Today");
    expect(screen.getByText("Completed Task 1")).toBeInTheDocument();
    expect(screen.queryByText("Completed Task 2")).not.toBeInTheDocument();
  });

  it("disables filter button on completed view when there are no completed tasks", () => {
    mockActivePath = "/completed";
    mockParams = {};
    mockTasksByView = [];

    render(<TaskViewContent />);

    const filterBtn = screen.getByRole("button", { name: /filter tasks/i });
    expect(filterBtn).toBeDisabled();
  });

  it("clears project filter to all projects when No Filter is clicked in completed view", async () => {
    const user = userEvent.setup();
    mockActivePath = "/completed";
    mockParams = {};

    const completedTask1: TodoItem = {
      id: "c-1",
      title: "Completed Task 1",
      state: "done",
      projectId: "work",
      parentId: null,
      metadata: {
        id: "c-1",
        created: todayStr,
        completed: todayStr,
      },
      body: "",
      children: [],
      order: 0,
      attachments: [],
    };
    const completedTask2: TodoItem = {
      id: "c-2",
      title: "Completed Task 2",
      state: "done",
      projectId: "Inbox",
      parentId: null,
      metadata: {
        id: "c-2",
        created: todayStr,
        completed: todayStr,
      },
      body: "",
      children: [],
      order: 1,
      attachments: [],
    };

    mockTasksByView = [completedTask1, completedTask2];

    render(<TaskViewContent />);

    const filterBtn = screen.getByRole("button", { name: "Filter tasks" });
    // Filter by Inbox project
    await user.click(filterBtn);
    const projectBtn = screen.getByRole("button", { name: "Select project" });
    await user.click(projectBtn);
    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: /inbox/i }),
      ).toBeInTheDocument();
    });
    const inboxOption = screen.getByRole("menuitem", { name: /inbox/i });
    fireEvent.click(inboxOption);

    // Only Task 2 (Inbox) visible
    await waitFor(() => {
      expect(screen.queryByText("Completed Task 1")).not.toBeInTheDocument();
      expect(screen.getByText("Completed Task 2")).toBeInTheDocument();
    });

    // Now click No Filter (popover is still open)
    await user.click(screen.getByTestId("filter-quick-no-filter"));

    // Both tasks are visible again
    expect(screen.getByText("Completed Task 1")).toBeInTheDocument();
    expect(screen.getByText("Completed Task 2")).toBeInTheDocument();
    expect(filterBtn).toHaveTextContent("Filter");
  });
});

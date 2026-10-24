import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { TodoFile, TodoItem } from "../../core/types";
import SearchPopup from "../search/SearchPopup";

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockTasks: TodoItem[] = [
  {
    id: "task-1",
    title: "Duplicate Title",
    state: "open",
    projectId: "inbox",
    parentId: null,
    metadata: {
      id: "task-1",
      created: "2026-03-15",
      priority: "high",
    },
    body: "",
    children: [],
    order: 0,
    attachments: [],
  },
  {
    id: "task-2",
    title: "Duplicate Title",
    state: "open",
    projectId: "inbox",
    parentId: null,
    metadata: {
      id: "task-2",
      created: "2026-03-15",
    },
    body: "",
    children: [],
    order: 1,
    attachments: [],
  },
  {
    id: "task-3",
    title: "Done Task",
    state: "done",
    projectId: "inbox",
    parentId: null,
    metadata: {
      id: "task-3",
      created: "2026-03-15",
    },
    body: "",
    children: [],
    order: 2,
    attachments: [],
  },
  {
    id: "task-4",
    title: "Archived Project Task",
    state: "open",
    projectId: "Project Alpha",
    parentId: null,
    metadata: {
      id: "task-4",
      created: "2026-03-15",
      archived: "2026-03-20",
    },
    body: "",
    children: [],
    order: 3,
    attachments: [],
  },
  {
    id: "task-5",
    title: "Project Beta Task",
    state: "open",
    projectId: "Project Beta",
    parentId: null,
    metadata: {
      id: "task-5",
      created: "2026-03-15",
      tags: ["work"],
    },
    body: "",
    children: [],
    order: 4,
    attachments: [],
  },
];

const mockFiles = new Map<string, TodoFile>([
  [
    "Inbox",
    {
      name: "Inbox",
      isSystem: true,
      tasks: new Map([
        ["task-1", mockTasks[0]!],
        ["task-2", mockTasks[1]!],
        ["task-3", mockTasks[2]!],
      ]),
    },
  ],
  [
    "Project Alpha",
    {
      name: "Project Alpha",
      isSystem: false,
      tasks: new Map([["task-4", mockTasks[3]!]]),
    },
  ],
  [
    "Project Beta",
    {
      name: "Project Beta",
      isSystem: false,
      tasks: new Map([["task-5", mockTasks[4]!]]),
    },
  ],
]);

vi.mock("../../store/task-store", () => ({
  useTaskStore: (selector: (state: unknown) => unknown) =>
    selector({
      files: mockFiles,
      getProjects: () => ["Project Alpha", "Project Beta"],
      getAllTags: () => ["work", "personal"],
    }),
  useProjects: () => ["Project Alpha", "Project Beta"],
  useAllTags: () => ["work", "personal"],
}));

describe("SearchPopup", () => {
  it("shows an instruction message with visual icon by default until user types", () => {
    render(
      <MemoryRouter>
        <SearchPopup onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.queryByText(/no results found/i)).not.toBeInTheDocument();
    expect(screen.getByText("Enter keywords to search")).toBeInTheDocument();
    expect(
      screen.queryByText("Search tasks, projects, or tags"),
    ).not.toBeInTheDocument();

    const list = screen.getByRole("listbox");
    expect(list).toHaveClass("min-h-80");
  });

  it("shows search items when user types in the search input", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SearchPopup onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Enter keywords to search")).toBeInTheDocument();

    const input = screen.getByPlaceholderText(
      "Search tasks, projects, tags...",
    );
    await user.type(input, "Project");

    expect(
      screen.queryByText("Enter keywords to search"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
  });

  it("assigns unique values to tasks with the same title to avoid duplicate hover/selection", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SearchPopup onClose={vi.fn()} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(
      "Search tasks, projects, tags...",
    );
    await user.type(input, "Duplicate");

    const duplicateItems = screen.getAllByRole("option");
    expect(duplicateItems).toHaveLength(2);

    const val0 = duplicateItems[0]?.getAttribute("data-value");
    const val1 = duplicateItems[1]?.getAttribute("data-value");
    expect(val0).not.toBe(val1);
  });

  it("shows completed tasks and archived tasks in search results", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SearchPopup onClose={vi.fn()} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(
      "Search tasks, projects, tags...",
    );
    await user.type(input, "Task");

    // "Done Task" (completed) and "Archived Project Task" (archived)
    expect(screen.getByText("Done Task")).toBeInTheDocument();
    expect(screen.getByText("Archived Project Task")).toBeInTheDocument();
  });

  it("searches and displays projects and tags in their own sections", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SearchPopup onClose={vi.fn()} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(
      "Search tasks, projects, tags...",
    );
    await user.type(input, "Alpha");

    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getAllByText("Project Alpha").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(
      screen.getByRole("option", { name: "Project Alpha" }),
    ).toBeInTheDocument();
  });

  it("navigates with selectedTaskId and closes when a task is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockNavigate.mockClear();

    render(
      <MemoryRouter>
        <SearchPopup onClose={onClose} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(
      "Search tasks, projects, tags...",
    );
    await user.type(input, "Beta");

    const taskItem = screen.getByText("Project Beta Task");
    await user.click(taskItem);

    expect(mockNavigate).toHaveBeenCalledWith(
      "/project/Project%20Beta",
      expect.objectContaining({
        state: expect.objectContaining({ selectedTaskId: "task-5" }),
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("navigates to completed view when a completed task is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockNavigate.mockClear();

    render(
      <MemoryRouter>
        <SearchPopup onClose={onClose} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(
      "Search tasks, projects, tags...",
    );
    await user.type(input, "Done");

    const taskItem = screen.getByText("Done Task");
    await user.click(taskItem);

    expect(mockNavigate).toHaveBeenCalledWith(
      "/completed",
      expect.objectContaining({
        state: expect.objectContaining({ selectedTaskId: "task-3" }),
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("navigates to tag view when a tag is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockNavigate.mockClear();

    render(
      <MemoryRouter>
        <SearchPopup onClose={onClose} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(
      "Search tasks, projects, tags...",
    );
    await user.type(input, "personal");

    const tagItem = screen.getByText("personal");
    await user.click(tagItem);

    expect(mockNavigate).toHaveBeenCalledWith("/tag/personal");
    expect(onClose).toHaveBeenCalled();
  });

  it("prioritizes Tasks group over Projects and Tags, and open tasks over completed ones", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SearchPopup onClose={vi.fn()} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(
      "Search tasks, projects, tags...",
    );
    await user.type(input, "Beta");

    const commandGroups = document.querySelectorAll<HTMLElement>(
      '[data-slot="command-group"]',
    );
    expect(commandGroups[0]).toHaveTextContent("Tasks");
    expect(commandGroups[1]).toHaveTextContent("Projects");
    expect(commandGroups[2]).toHaveTextContent("Tags");

    const options = screen.getAllByRole("option");
    // Task option should come before Project option
    expect(options[0]).toHaveTextContent("Project Beta Task");
    expect(options[1]).toHaveTextContent("Project Beta");
  });
});

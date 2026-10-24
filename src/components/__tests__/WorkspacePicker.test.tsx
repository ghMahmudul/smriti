import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StorageAdapter } from "@/services/workspace";
import { useTaskStore } from "@/store/task-store";
import { useWorkspaceStore } from "@/store/workspace-store";
import WorkspacePicker from "../workspace/WorkspacePicker";

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockAdapter: StorageAdapter = {
  readFile: vi.fn().mockResolvedValue(""),
  writeFile: vi.fn().mockResolvedValue(undefined),
  listFiles: vi.fn().mockResolvedValue(["Inbox.todo"]),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  renameFile: vi.fn().mockResolvedValue(undefined),
  ensureInbox: vi.fn().mockResolvedValue(undefined),
  readSettings: vi.fn().mockResolvedValue({
    showTrash: true,
    showArchived: true,
    showCompleted: true,
    defaultView: "all",
    theme: "system",
    tags: [],
  }),
  writeSettings: vi.fn().mockResolvedValue(undefined),
  createProject: vi.fn().mockResolvedValue(undefined),
  deleteProject: vi.fn().mockResolvedValue(undefined),
  renameProject: vi.fn().mockResolvedValue(undefined),
};

describe("WorkspacePicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.setState({
      workspaces: [],
      currentWorkspaceId: null,
      mode: null,
      view: "picker",
    });
    useTaskStore.setState({
      loadFiles: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("renders Smriti branding and 3 options without back button or default name input", () => {
    render(<WorkspacePicker />);

    expect(screen.getByRole("img", { name: "Smriti" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Smriti", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A task management app powered by .todo files"),
    ).toBeInTheDocument();

    expect(screen.queryByText(/back to app/i)).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Workspace name"),
    ).not.toBeInTheDocument();

    expect(screen.getByText("Create new workspace")).toBeInTheDocument();
    expect(screen.getByText("Open folder as workspace")).toBeInTheDocument();
    expect(screen.getByText("Use local storage")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quick Start" }),
    ).toBeInTheDocument();
  });

  it("shows informative message when File System Access API is not supported", () => {
    delete (window as unknown as { showDirectoryPicker?: unknown })
      .showDirectoryPicker;
    render(<WorkspacePicker />);

    expect(
      screen.getByText(/Folder access requires a Chromium browser/i),
    ).toBeInTheDocument();
  });

  it("does not show non-chromium message when File System Access API is supported", () => {
    window.showDirectoryPicker = vi.fn();
    render(<WorkspacePicker />);

    expect(
      screen.queryByText(/Folder access requires a Chromium browser/i),
    ).not.toBeInTheDocument();
    delete (window as unknown as { showDirectoryPicker?: unknown })
      .showDirectoryPicker;
  });

  it("triggers Quick Start with default workspace name 'Smriti'", async () => {
    const user = userEvent.setup();
    const connectLocalStorage = vi.fn().mockResolvedValue(mockAdapter);
    useWorkspaceStore.setState({ connectLocalStorage });

    render(<WorkspacePicker />);

    const quickStartBtn = screen.getByRole("button", { name: "Quick Start" });
    await user.click(quickStartBtn);

    await waitFor(() => {
      expect(connectLocalStorage).toHaveBeenCalledWith("Smriti");
    });
  });

  it("switches to 'create-folder' subview with name and folder locate options on clicking Create", async () => {
    const user = userEvent.setup();
    window.showDirectoryPicker = vi.fn();

    render(<WorkspacePicker />);

    const createBtn = screen.getByRole("button", { name: "Create" });
    await user.click(createBtn);

    expect(
      screen.getByRole("heading", { name: "Create new workspace" }),
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Workspace name")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /choose folder/i }),
    ).toBeInTheDocument();

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelBtn);

    expect(
      screen.queryByPlaceholderText("Workspace name"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Create new workspace")).toBeInTheDocument();
  });

  it("switches to 'create-local' subview with name input and NO folder locate option on clicking Local", async () => {
    const user = userEvent.setup();
    const connectLocalStorage = vi.fn().mockResolvedValue(mockAdapter);
    useWorkspaceStore.setState({ connectLocalStorage });

    render(<WorkspacePicker />);

    const localBtn = screen.getByRole("button", { name: "Local" });
    await user.click(localBtn);

    expect(
      screen.getByRole("heading", { name: "Use local storage" }),
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Workspace name")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /choose folder/i }),
    ).not.toBeInTheDocument();

    const input = screen.getByPlaceholderText("Workspace name");
    await user.type(input, "My Local Workspace");

    const submitCreateBtn = screen.getByRole("button", { name: "Create" });
    await user.click(submitCreateBtn);

    await waitFor(() => {
      expect(connectLocalStorage).toHaveBeenCalledWith("My Local Workspace");
    });
  });

  it("disables create button when workspace name is empty", async () => {
    const user = userEvent.setup();
    render(<WorkspacePicker />);

    await user.click(screen.getByRole("button", { name: "Local" }));

    const submitCreateBtn = screen.getByRole("button", { name: "Create" });
    expect(submitCreateBtn).toBeDisabled();

    const input = screen.getByPlaceholderText("Workspace name");
    await user.type(input, "My Local Workspace");
    expect(submitCreateBtn).toBeEnabled();
  });

  it("shows local storage first and disabled file options on non-chromium browser without badge", () => {
    const originalPicker = window.showDirectoryPicker;
    // biome-ignore lint/suspicious/noExplicitAny: test environment mock
    delete (window as any).showDirectoryPicker;

    render(<WorkspacePicker />);

    expect(screen.queryByText("Chromium only")).not.toBeInTheDocument();

    const localBtn = screen.getByRole("button", { name: "Local" });
    expect(localBtn.className).toContain("bg-primary");

    const createBtn = screen.getByRole("button", { name: "Create" });
    expect(createBtn).toBeDisabled();

    // biome-ignore lint/suspicious/noExplicitAny: restore
    (window as any).showDirectoryPicker = originalPicker;
  });

  it("renders two-column layout with workspace list in sidebar when workspaces exist", async () => {
    const user = userEvent.setup();
    const setView = vi.fn();
    const switchWorkspace = vi.fn().mockResolvedValue(mockAdapter);

    useWorkspaceStore.setState({
      workspaces: [
        {
          id: "ws-1",
          name: "Workspace 1",
          mode: "file-system",
          path: "/Projects/Workspace 1",
        },
        { id: "ws-2", name: "Workspace 2", mode: "local-storage" },
      ],
      currentWorkspaceId: "ws-1",
      setView,
      switchWorkspace,
    });

    render(<WorkspacePicker />);

    expect(
      screen.queryByRole("button", { name: "Quick Start" }),
    ).not.toBeInTheDocument();

    expect(screen.getByText("Workspaces")).toBeInTheDocument();
    expect(screen.getByText("Workspace 1")).toBeInTheDocument();
    expect(screen.getByText("/Projects/Workspace 1")).toBeInTheDocument();
    expect(screen.getByText("Workspace 2")).toBeInTheDocument();
    expect(screen.getByText("Local Storage")).toBeInTheDocument();

    await user.click(screen.getByText("Workspace 1"));
    expect(setView).toHaveBeenCalledWith("main");

    await user.click(screen.getByText("Workspace 2"));
    expect(switchWorkspace).toHaveBeenCalledWith("ws-2");
  });

  it("shows full workspace path on the folder button and allows changing it", async () => {
    const user = userEvent.setup();
    const createWorkspace = vi.fn().mockResolvedValue(mockAdapter);
    useWorkspaceStore.setState({ createWorkspace });

    const fakeDirHandle1 = {
      name: "MyDocuments",
      getDirectoryHandle: vi.fn().mockResolvedValue({ name: "PersonalNotes" }),
    } as unknown as FileSystemDirectoryHandle;

    const fakeDirHandle2 = {
      name: "WorkFolder",
      getDirectoryHandle: vi.fn().mockResolvedValue({ name: "PersonalNotes" }),
    } as unknown as FileSystemDirectoryHandle;

    const showDirectoryPickerMock = vi
      .fn()
      .mockResolvedValueOnce(fakeDirHandle1)
      .mockResolvedValueOnce(fakeDirHandle2);
    window.showDirectoryPicker = showDirectoryPickerMock;

    render(<WorkspacePicker />);

    await user.click(screen.getByRole("button", { name: "Create" }));

    const nameInput = screen.getByPlaceholderText("Workspace name");
    await user.type(nameInput, "PersonalNotes");

    const chooseFolderBtn = screen.getByRole("button", {
      name: /choose folder/i,
    });
    await user.click(chooseFolderBtn);

    expect(screen.getByText("/MyDocuments/PersonalNotes")).toBeInTheDocument();

    // Clicking again changes the folder without any extra "Change" button
    const pathBtn = screen.getByRole("button", {
      name: "/MyDocuments/PersonalNotes",
    });
    await user.click(pathBtn);

    expect(screen.getByText("/WorkFolder/PersonalNotes")).toBeInTheDocument();

    const submitCreate = screen.getByRole("button", { name: "Create" });
    await user.click(submitCreate);

    await waitFor(() => {
      expect(createWorkspace).toHaveBeenCalledWith(
        "PersonalNotes",
        expect.anything(),
        "/WorkFolder/PersonalNotes",
      );
    });
  });

  it("does not remember form values when canceled and re-opened", async () => {
    const user = userEvent.setup();
    render(<WorkspacePicker />);

    // Open create-folder, type a name
    await user.click(screen.getByRole("button", { name: "Create" }));
    const nameInput = screen.getByPlaceholderText("Workspace name");
    await user.type(nameInput, "AbandonedWorkspace");

    // Click Cancel
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // Re-open create-folder
    await user.click(screen.getByRole("button", { name: "Create" }));
    const freshInput = screen.getByPlaceholderText("Workspace name");
    expect(freshInput).toHaveValue("");
    expect(screen.getByText("Choose folder...")).toBeInTheDocument();
  });

  it("navigates to '/' when clicking close button or pressing Escape with an active workspace", async () => {
    const user = userEvent.setup();
    useWorkspaceStore.setState({
      workspaces: [
        {
          id: "ws-1",
          name: "Workspace 1",
          mode: "file-system",
          path: "/Projects/Workspace 1",
        },
      ],
      currentWorkspaceId: "ws-1",
      mode: "file-system",
    });

    render(<WorkspacePicker />);

    const closeBtn = screen.getByRole("button", { name: "Close" });
    expect(closeBtn).toBeInTheDocument();

    await user.click(closeBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/all");

    mockNavigate.mockClear();

    await user.keyboard("{Escape}");
    expect(mockNavigate).toHaveBeenCalledWith("/all");
  });

  it("renders Create, Open, and Local buttons with the same width class", () => {
    (
      window as unknown as { showDirectoryPicker?: unknown }
    ).showDirectoryPicker = vi.fn();

    render(<WorkspacePicker />);

    const createBtn = screen.getByRole("button", { name: "Create" });
    const openBtn = screen.getByRole("button", { name: "Open" });
    const localBtn = screen.getByRole("button", { name: "Local" });

    expect(createBtn).toHaveClass("w-16");
    expect(openBtn).toHaveClass("w-16");
    expect(localBtn).toHaveClass("w-16");

    delete (window as unknown as { showDirectoryPicker?: unknown })
      .showDirectoryPicker;
  });

  it("does not show icon picker when renaming a workspace", async () => {
    const user = userEvent.setup();
    useWorkspaceStore.setState({
      workspaces: [
        {
          id: "ws-1",
          name: "My Local",
          mode: "local-storage",
        },
      ],
      currentWorkspaceId: "ws-1",
    });

    render(<WorkspacePicker />);

    const optionsBtn = screen.getByRole("button", {
      name: "Options for My Local",
    });
    await user.click(optionsBtn);

    const editItem = await screen.findByRole("menuitem", { name: "Edit" });
    await user.click(editItem);

    expect(
      screen.getByRole("heading", { name: "Rename Workspace" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("My Local")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Choose icon" }),
    ).not.toBeInTheDocument();
  });
});

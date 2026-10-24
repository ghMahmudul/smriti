import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AddTaskModal from "../task/AddTaskModal";

vi.mock("../../store/task-store", () => ({
  useTaskStore: (selector: (state: unknown) => unknown) =>
    selector({
      getProjects: () => ["Project Alpha"],
      getAllTags: () => ["work"],
    }),
  useProjects: () => ["Project Alpha"],
  useAllTags: () => ["work"],
}));

vi.mock("../layout/Layout", () => ({
  useSidebar: () => ({ isMobile: false }),
}));

describe("AddTaskModal", () => {
  const defaultProps = {
    onClose: vi.fn(),
    onAdd: vi.fn(),
    defaultProject: "inbox",
    title: "New Todo",
    onTitleChange: vi.fn(),
    description: "Some description",
    onDescriptionChange: vi.fn(),
    due: "",
    onDueChange: vi.fn(),
    selectedTags: [],
    onTagsChange: vi.fn(),
    onPriorityChange: vi.fn(),
  };

  it("renders title and description inputs", () => {
    render(<AddTaskModal {...defaultProps} />);

    expect(screen.getByPlaceholderText("Next thing to do")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Description")).toBeInTheDocument();
  });

  it("submits task on Enter in the title input", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<AddTaskModal {...defaultProps} onAdd={onAdd} onClose={onClose} />);

    const titleInput = screen.getByPlaceholderText("Next thing to do");
    fireEvent.keyDown(titleInput, { key: "Enter", shiftKey: false });

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Todo",
        body: "Some description",
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not submit on plain Enter in description input", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<AddTaskModal {...defaultProps} onAdd={onAdd} onClose={onClose} />);

    const descInput = screen.getByPlaceholderText("Description");
    fireEvent.keyDown(descInput, { key: "Enter", shiftKey: false });

    expect(onAdd).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("submits task on Ctrl+Enter in the description input", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<AddTaskModal {...defaultProps} onAdd={onAdd} onClose={onClose} />);

    const descInput = screen.getByPlaceholderText("Description");
    fireEvent.keyDown(descInput, { key: "Enter", ctrlKey: true });

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Todo",
        body: "Some description",
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("submits task on Cmd+Enter (metaKey) in the description input", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<AddTaskModal {...defaultProps} onAdd={onAdd} onClose={onClose} />);

    const descInput = screen.getByPlaceholderText("Description");
    fireEvent.keyDown(descInput, { key: "Enter", metaKey: true });

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("submits if title is empty but description is provided", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(
      <AddTaskModal
        {...defaultProps}
        title="   "
        description="Some description"
        onAdd={onAdd}
        onClose={onClose}
      />,
    );

    const descInput = screen.getByPlaceholderText("Description");
    fireEvent.keyDown(descInput, { key: "Enter", ctrlKey: true });

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "",
        body: "Some description",
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not submit if both title and description are empty", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(
      <AddTaskModal
        {...defaultProps}
        title="   "
        description="   "
        onAdd={onAdd}
        onClose={onClose}
      />,
    );

    const descInput = screen.getByPlaceholderText("Description");
    fireEvent.keyDown(descInput, { key: "Enter", ctrlKey: true });

    expect(onAdd).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  describe("shortcuts in title field", () => {
    it("shows shortcut options dropdown when typing '/' in order: Date, Priority, Project, Tag", () => {
      render(<AddTaskModal {...defaultProps} title="" />);
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, { target: { value: "/", selectionEnd: 1 } });

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      const options = screen.getAllByRole("option");
      expect(options.map((opt) => opt.textContent)).toEqual([
        "Date",
        "Priority",
        "Project",
        "Tag",
      ]);
    });

    it("selecting Priority from '/' menu replaces '/' with '!' and opens Priority dropdown", () => {
      const onTitleChange = vi.fn();
      render(
        <AddTaskModal
          {...defaultProps}
          title=""
          onTitleChange={onTitleChange}
        />,
      );
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, { target: { value: "/", selectionEnd: 1 } });

      const priorityOption = screen.getByText("Priority");
      fireEvent.click(priorityOption);

      expect(onTitleChange).toHaveBeenCalledWith("!");
      expect(screen.getByText("High")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
      expect(screen.getByText("Low")).toBeInTheDocument();
    });

    it("shows priority options directly when typing '!' and selects priority", () => {
      const onTitleChange = vi.fn();
      const onPriorityChange = vi.fn();
      render(
        <AddTaskModal
          {...defaultProps}
          title=""
          onTitleChange={onTitleChange}
          onPriorityChange={onPriorityChange}
        />,
      );
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, {
        target: { value: "Task !", selectionEnd: 6 },
      });

      const highOption = screen.getByText("High");
      expect(highOption).toBeInTheDocument();
      fireEvent.click(highOption);

      expect(onPriorityChange).toHaveBeenCalledWith("high");
      expect(onTitleChange).toHaveBeenCalledWith("Task ");
    });

    it("shows date options when typing '*' and sets due date", () => {
      const onTitleChange = vi.fn();
      const onDueChange = vi.fn();
      render(
        <AddTaskModal
          {...defaultProps}
          title=""
          onTitleChange={onTitleChange}
          onDueChange={onDueChange}
        />,
      );
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, { target: { value: "*", selectionEnd: 1 } });

      const todayOption = screen.getByText("Today");
      expect(todayOption).toBeInTheDocument();
      expect(screen.queryByText(/Pick Date/i)).not.toBeInTheDocument();
      fireEvent.click(todayOption);

      expect(onDueChange).toHaveBeenCalled();
      expect(onTitleChange).toHaveBeenCalledWith("");
    });

    it("shows date options with Repeat before No Date when typing '*'", () => {
      render(<AddTaskModal {...defaultProps} title="" />);
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, { target: { value: "*", selectionEnd: 1 } });

      const options = screen
        .getAllByRole("option")
        .map((opt) => opt.textContent?.trim());
      expect(options).toEqual([
        "Today",
        "Tomorrow",
        "Next Week",
        "Repeat",
        "No Date",
      ]);
    });

    it("transitions to repeat presets when selecting Repeat option without custom option", () => {
      const onTitleChange = vi.fn();
      const onRepeatChange = vi.fn();
      render(
        <AddTaskModal
          {...defaultProps}
          title=""
          onTitleChange={onTitleChange}
          onRepeatChange={onRepeatChange}
        />,
      );
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, { target: { value: "*", selectionEnd: 1 } });

      const repeatOption = screen.getByText("Repeat");
      expect(repeatOption).toBeInTheDocument();
      fireEvent.click(repeatOption);

      const repeatPresets = screen
        .getAllByRole("option")
        .map((opt) => opt.textContent?.trim());
      expect(repeatPresets).toEqual([
        "Daily",
        "Weekly",
        "Monthly",
        "Yearly",
        "Weekdays",
        "None",
      ]);
      expect(screen.queryByText(/custom/i)).not.toBeInTheDocument();

      // Click "Daily"
      const dailyOption = screen.getByText("Daily");
      fireEvent.click(dailyOption);

      expect(onRepeatChange).toHaveBeenCalledWith("daily");
      expect(onTitleChange).toHaveBeenCalledWith("");
    });

    it("clears repeat when None is selected from repeat shortcut", () => {
      const onTitleChange = vi.fn();
      const onRepeatChange = vi.fn();
      render(
        <AddTaskModal
          {...defaultProps}
          title=""
          repeat="daily"
          onTitleChange={onTitleChange}
          onRepeatChange={onRepeatChange}
        />,
      );
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, { target: { value: "*", selectionEnd: 1 } });
      fireEvent.click(screen.getByText("Repeat"));

      const noneOption = screen.getByRole("option", { name: "None" });
      expect(noneOption).toBeInTheDocument();
      fireEvent.click(noneOption);

      expect(onRepeatChange).toHaveBeenCalledWith("");
      expect(onTitleChange).toHaveBeenCalledWith("");
    });

    it("allows navigating into Repeat with keyboard and returning with Backspace", () => {
      render(<AddTaskModal {...defaultProps} title="" />);
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, { target: { value: "*", selectionEnd: 1 } });

      // Navigate down to Repeat (index 3)
      fireEvent.keyDown(titleInput, { key: "ArrowDown" });
      fireEvent.keyDown(titleInput, { key: "ArrowDown" });
      fireEvent.keyDown(titleInput, { key: "ArrowDown" });

      const repeatOption = screen.getByRole("option", { name: "Repeat" });
      expect(repeatOption).toHaveAttribute("data-active", "true");

      // Press Enter to enter repeat submode
      fireEvent.keyDown(titleInput, { key: "Enter" });

      expect(screen.getByText("Daily")).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Daily" })).toHaveAttribute(
        "data-active",
        "true",
      );

      // Press Backspace with empty query -> returns to main date menu with Repeat active
      fireEvent.keyDown(titleInput, { key: "Backspace" });

      expect(screen.getByText("Today")).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Repeat" })).toHaveAttribute(
        "data-active",
        "true",
      );
    });

    it("filters repeat options when query is typed", () => {
      render(<AddTaskModal {...defaultProps} title="" />);
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, { target: { value: "*", selectionEnd: 1 } });
      fireEvent.click(screen.getByText("Repeat"));

      // In repeat submode, typing "w"
      fireEvent.change(titleInput, {
        target: { value: "*w", selectionEnd: 2 },
      });

      const filteredOptions = screen
        .getAllByRole("option")
        .map((opt) => opt.textContent?.trim());
      expect(filteredOptions).toEqual(["Weekly", "Weekdays"]);
    });

    it("sets due date atomically when selecting a repeat shortcut preset when due date is unset", () => {
      const onDueChange = vi.fn();
      const onRepeatChange = vi.fn();
      render(
        <AddTaskModal
          {...defaultProps}
          title=""
          due=""
          repeat=""
          onDueChange={onDueChange}
          onRepeatChange={onRepeatChange}
        />,
      );
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, { target: { value: "*", selectionEnd: 1 } });
      fireEvent.click(screen.getByText("Repeat"));

      fireEvent.click(screen.getByText("Weekly"));

      expect(onRepeatChange).toHaveBeenCalledWith("weekly");
      expect(onDueChange).toHaveBeenCalled();
    });

    it("shows project options when typing '+' and sets project", () => {
      const onTitleChange = vi.fn();
      const onProjectChange = vi.fn();
      render(
        <AddTaskModal
          {...defaultProps}
          title=""
          onTitleChange={onTitleChange}
          onProjectChange={onProjectChange}
        />,
      );
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, { target: { value: "+", selectionEnd: 1 } });

      const projectOption = screen.getByText("Project Alpha");
      expect(projectOption).toBeInTheDocument();
      fireEvent.click(projectOption);

      expect(onProjectChange).toHaveBeenCalledWith("Project Alpha");
      expect(onTitleChange).toHaveBeenCalledWith("");
    });

    it("shows 'Create Project \"projectName\"' option when typing a new project after '+'", async () => {
      const onTitleChange = vi.fn();
      const onProjectChange = vi.fn();
      const onCreateProject = vi.fn().mockResolvedValue(undefined);
      render(
        <AddTaskModal
          {...defaultProps}
          title=""
          onTitleChange={onTitleChange}
          onProjectChange={onProjectChange}
          onCreateProject={onCreateProject}
        />,
      );
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, {
        target: { value: "+Beta", selectionEnd: 5 },
      });

      const createOption = screen.getByText('Create Project "Beta"');
      expect(createOption).toBeInTheDocument();
      fireEvent.click(createOption);

      await waitFor(() => {
        expect(onCreateProject).toHaveBeenCalledWith("Beta");
        expect(onProjectChange).toHaveBeenCalledWith("Beta");
        expect(onTitleChange).toHaveBeenCalledWith("");
      });
    });

    it("shows tag options when typing '#' and sets tag", () => {
      const onTitleChange = vi.fn();
      const onTagsChange = vi.fn();
      render(
        <AddTaskModal
          {...defaultProps}
          title=""
          onTitleChange={onTitleChange}
          onTagsChange={onTagsChange}
        />,
      );
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, { target: { value: "#", selectionEnd: 1 } });

      const tagOption = screen.getByText("work");
      expect(tagOption).toBeInTheDocument();
      fireEvent.click(tagOption);

      expect(onTagsChange).toHaveBeenCalledWith(["work"]);
      expect(onTitleChange).toHaveBeenCalledWith("");
    });

    it("shows 'Create Tag \"tagName\"' option when typing a new tag after '#'", async () => {
      const onTitleChange = vi.fn();
      const onTagsChange = vi.fn();
      const onCreateTag = vi.fn().mockResolvedValue(undefined);
      render(
        <AddTaskModal
          {...defaultProps}
          title=""
          onTitleChange={onTitleChange}
          onTagsChange={onTagsChange}
          onCreateTag={onCreateTag}
        />,
      );
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, {
        target: { value: "#custom", selectionEnd: 7 },
      });

      const createOption = screen.getByText('Create Tag "custom"');
      expect(createOption).toBeInTheDocument();
      fireEvent.click(createOption);

      await waitFor(() => {
        expect(onCreateTag).toHaveBeenCalledWith("custom");
        expect(onTagsChange).toHaveBeenCalledWith(["custom"]);
        expect(onTitleChange).toHaveBeenCalledWith("");
      });
    });

    it("closes shortcut dropdown on Escape without closing modal", () => {
      const onClose = vi.fn();
      render(<AddTaskModal {...defaultProps} title="" onClose={onClose} />);
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, { target: { value: "!", selectionEnd: 1 } });
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      fireEvent.keyDown(titleInput, { key: "Escape" });

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it("navigates options with ArrowDown and selects with Enter", () => {
      const onPriorityChange = vi.fn();
      render(
        <AddTaskModal
          {...defaultProps}
          title=""
          onPriorityChange={onPriorityChange}
        />,
      );
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, { target: { value: "!", selectionEnd: 1 } });
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      // Navigate down to Medium (index 1)
      fireEvent.keyDown(titleInput, { key: "ArrowDown" });
      fireEvent.keyDown(titleInput, { key: "Enter" });

      expect(onPriorityChange).toHaveBeenCalledWith("medium");
    });

    it("does not render check icon on any option in the shortcut dropdown", () => {
      render(
        <AddTaskModal
          {...defaultProps}
          title=""
          priority="high"
          project="Inbox"
        />,
      );
      const titleInput = screen.getByPlaceholderText("Next thing to do");

      fireEvent.change(titleInput, { target: { value: "!", selectionEnd: 1 } });
      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeInTheDocument();
      expect(listbox.querySelector(".lucide-check")).toBeNull();

      fireEvent.change(titleInput, { target: { value: "+", selectionEnd: 1 } });
      const projectListbox = screen.getByRole("listbox");
      expect(projectListbox).toBeInTheDocument();
      expect(projectListbox.querySelector(".lucide-check")).toBeNull();
    });
  });

  describe("repeat and due date synchronization", () => {
    it("automatically sets due date when repeat is selected while due is empty", async () => {
      const onDueChange = vi.fn();
      const onRepeatChange = vi.fn();

      render(
        <AddTaskModal
          {...defaultProps}
          due=""
          onDueChange={onDueChange}
          repeat=""
          onRepeatChange={onRepeatChange}
        />,
      );

      // Open DatePicker popover
      const dateButton = screen.getByRole("button", { name: /^date$/i });
      fireEvent.click(dateButton);

      // Open repeat dropdown menu
      const repeatButton = await screen.findByRole("button", {
        name: /^repeat$/i,
      });
      fireEvent.click(repeatButton);

      // Click "Daily"
      const dailyItem = await screen.findByRole("menuitemradio", {
        name: /daily/i,
      });
      fireEvent.click(dailyItem);

      expect(onRepeatChange).toHaveBeenCalledWith("daily");
      expect(onDueChange).toHaveBeenCalledWith(
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      );
    });

    it("clears repeat when due date is cleared via No Date option", async () => {
      const onDueChange = vi.fn();
      const onRepeatChange = vi.fn();

      render(
        <AddTaskModal
          {...defaultProps}
          due="2026-10-22"
          onDueChange={onDueChange}
          repeat="daily"
          onRepeatChange={onRepeatChange}
        />,
      );

      const dateButton = screen.getByRole("button", {
        name: /repeats daily/i,
      });
      fireEvent.click(dateButton);

      const noDateBtn = await screen.findByRole("button", {
        name: /no date/i,
      });
      fireEvent.click(noDateBtn);

      expect(onDueChange).toHaveBeenCalledWith("");
      expect(onRepeatChange).toHaveBeenCalledWith("");
    });
  });

  describe("hierarchical overlay dismissal", () => {
    it("closes the date picker on outside click without closing the add task dialog", async () => {
      const onClose = vi.fn();

      render(<AddTaskModal {...defaultProps} onClose={onClose} />);

      // Open DatePicker popover
      const dateButton = screen.getByRole("button", { name: /^date$/i });
      fireEvent.click(dateButton);

      // Verify DatePicker content (calendar) is visible
      expect(await screen.findByRole("grid")).toBeInTheDocument();

      // Click on dialog overlay/backdrop while DatePicker is open
      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      expect(overlay).toBeInTheDocument();
      if (overlay) {
        fireEvent.pointerDown(overlay);
        fireEvent.click(overlay);
      }

      // Dialog should NOT have closed
      expect(onClose).not.toHaveBeenCalled();

      // Clicking overlay again when child overlay is closed should close the dialog
      if (overlay) {
        fireEvent.pointerDown(overlay);
        fireEvent.click(overlay);
      }
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes the date picker on Escape key without closing the add task dialog", async () => {
      const onClose = vi.fn();

      render(<AddTaskModal {...defaultProps} onClose={onClose} />);

      // Open DatePicker popover
      const dateButton = screen.getByRole("button", { name: /^date$/i });
      fireEvent.click(dateButton);

      // Verify DatePicker content (calendar) is visible
      expect(await screen.findByRole("grid")).toBeInTheDocument();

      // Press Escape while DatePicker is open
      fireEvent.keyDown(document.body, { key: "Escape" });

      // Dialog should NOT have closed
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});

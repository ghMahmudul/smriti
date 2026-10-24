import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenameModal from "@/components/ui/RenameModal";
import { toast } from "@/components/ui/sonner";
import { SAFE_NAME_MESSAGE } from "@/core/schemas";

vi.mock("@/components/ui/sonner", () => ({
  toast: {
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe("RenameModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title and input with current name", () => {
    render(
      <RenameModal
        title="Rename Project"
        currentName="My Project"
        onClose={vi.fn()}
        onRename={vi.fn()}
      />,
    );

    expect(screen.getByText("Rename Project")).toBeInTheDocument();
    expect(screen.getByDisplayValue("My Project")).toBeInTheDocument();
  });

  it("calls onRename with new name when submitted", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();

    render(
      <RenameModal
        title="Rename Project"
        currentName="Old Name"
        onClose={vi.fn()}
        onRename={onRename}
      />,
    );

    const input = screen.getByDisplayValue("Old Name");
    await user.clear(input);
    await user.type(input, "New Name");
    await user.click(screen.getByRole("button", { name: /rename/i }));

    expect(onRename).toHaveBeenCalledWith("New Name");
  });

  it("disables rename button when name has not changed", async () => {
    render(
      <RenameModal
        title="Rename Project"
        currentName="My Project"
        onClose={vi.fn()}
        onRename={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /rename/i });
    expect(button).toBeDisabled();
    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
  });

  it("disables rename button when input is cleared to empty without showing 'Name is required'", async () => {
    const user = userEvent.setup();
    render(
      <RenameModal
        title="Rename Project"
        currentName="Old Name"
        onClose={vi.fn()}
        onRename={vi.fn()}
      />,
    );

    const input = screen.getByDisplayValue("Old Name");
    await user.clear(input);
    const button = screen.getByRole("button", { name: /rename/i });
    expect(button).toBeDisabled();
    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("enables rename button on first letter typed after clearing", async () => {
    const user = userEvent.setup();
    render(
      <RenameModal
        title="Rename Project"
        currentName="Old Name"
        onClose={vi.fn()}
        onRename={vi.fn()}
      />,
    );

    const input = screen.getByDisplayValue("Old Name");
    await user.clear(input);
    await user.type(input, "A");
    const button = screen.getByRole("button", { name: /rename/i });
    expect(button).toBeEnabled();
  });

  it("does not show toast error on type, but shows toast error on submit with invalid characters", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();

    render(
      <RenameModal
        title="Rename Project"
        currentName="Old Name"
        onClose={vi.fn()}
        onRename={onRename}
      />,
    );

    const input = screen.getByDisplayValue("Old Name");
    await user.type(input, "#");

    // While typing: error toast must NOT be shown
    expect(toast.error).not.toHaveBeenCalled();

    // Button is enabled because name is changed and non-empty
    const renameBtn = screen.getByRole("button", { name: /rename/i });
    expect(renameBtn).toBeEnabled();

    // Click submit: error toast must show now
    await user.click(renameBtn);

    expect(toast.error).toHaveBeenCalledWith(
      SAFE_NAME_MESSAGE,
      expect.objectContaining({ id: "rename-modal-name-error" }),
    );
    expect(screen.queryByText(SAFE_NAME_MESSAGE)).not.toBeInTheDocument();
    expect(onRename).not.toHaveBeenCalled();
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <RenameModal
        title="Rename Project"
        currentName="My Project"
        onClose={onClose}
        onRename={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders Edit Project and Save button when title is Edit Project", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();

    render(
      <RenameModal
        title="Edit Project"
        currentName="Old Name"
        onClose={vi.fn()}
        onRename={onRename}
      />,
    );

    expect(screen.getByText("Edit Project")).toBeInTheDocument();
    const saveBtn = screen.getByRole("button", { name: /save/i });
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();

    const input = screen.getByDisplayValue("Old Name");
    await user.clear(input);
    await user.type(input, "Updated Name");
    expect(saveBtn).toBeEnabled();

    await user.click(saveBtn);
    expect(onRename).toHaveBeenCalledWith("Updated Name");
  });
});

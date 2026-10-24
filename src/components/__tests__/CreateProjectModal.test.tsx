import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateProjectModal from "@/components/layout/CreateProjectModal";
import { toast } from "@/components/ui/sonner";
import { SAFE_NAME_MESSAGE } from "@/core/schemas";

vi.mock("@/components/ui/sonner", () => ({
  toast: {
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe("CreateProjectModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title and empty input", () => {
    render(<CreateProjectModal onClose={vi.fn()} onCreate={vi.fn()} />);

    expect(screen.getByText("New Project")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Project name")).toBeInTheDocument();
  });

  it("disables create button when input is empty and shows no error div or toast", () => {
    render(<CreateProjectModal onClose={vi.fn()} onCreate={vi.fn()} />);

    expect(screen.getByRole("button", { name: /create/i })).toBeDisabled();
    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("calls onCreate with name when valid name is submitted", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    render(<CreateProjectModal onClose={vi.fn()} onCreate={onCreate} />);

    const input = screen.getByPlaceholderText("Project name");
    await user.type(input, "My New Project");
    await user.click(screen.getByRole("button", { name: /create/i }));

    expect(onCreate).toHaveBeenCalledWith("My New Project");
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<CreateProjectModal onClose={onClose} onCreate={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not show toast error on type, but shows toast error on submit with invalid characters", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    render(<CreateProjectModal onClose={vi.fn()} onCreate={onCreate} />);

    const input = screen.getByPlaceholderText("Project name");
    await user.type(input, "Project@");

    // While typing: error toast must NOT be shown
    expect(toast.error).not.toHaveBeenCalled();

    // Button is enabled because input is non-empty
    const createBtn = screen.getByRole("button", { name: /create/i });
    expect(createBtn).toBeEnabled();

    // Click submit: error toast must show now
    await user.click(createBtn);

    expect(toast.error).toHaveBeenCalledWith(
      SAFE_NAME_MESSAGE,
      expect.objectContaining({ id: "create-modal-name-error" }),
    );
    expect(screen.queryByText(SAFE_NAME_MESSAGE)).not.toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("does not show 'Name is required' error when text is typed and then cleared", async () => {
    const user = userEvent.setup();

    render(<CreateProjectModal onClose={vi.fn()} onCreate={vi.fn()} />);

    const input = screen.getByPlaceholderText("Project name");
    await user.type(input, "Test");
    await user.clear(input);

    expect(screen.getByRole("button", { name: /create/i })).toBeDisabled();
    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("supports custom title, placeholder, and icon", () => {
    render(
      <CreateProjectModal
        title="New Tag"
        placeholder="Tag name"
        onClose={vi.fn()}
        onCreate={vi.fn()}
      />,
    );

    expect(screen.getByText("New Tag")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Tag name")).toBeInTheDocument();
  });
});

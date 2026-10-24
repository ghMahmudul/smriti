import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ConfirmModal from "@/components/ui/ConfirmModal";

describe("ConfirmModal", () => {
  it("renders title and message", () => {
    render(
      <ConfirmModal
        title="Delete Project"
        message="Are you sure you want to delete this project?"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("Delete Project")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to delete this project?"),
    ).toBeInTheDocument();
  });

  it("renders custom confirm label", () => {
    render(
      <ConfirmModal
        title="Empty Trash"
        message="This will permanently delete all items."
        confirmLabel="Empty"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /empty/i })).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ConfirmModal
        title="Delete"
        message="Are you sure?"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ConfirmModal
        title="Delete"
        message="Are you sure?"
        onClose={onClose}
        onConfirm={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("aligns header text to the left", () => {
    render(
      <ConfirmModal
        title="Delete Item"
        message="Are you sure?"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const titleEl = screen.getByText("Delete Item");
    const descriptionEl = screen.getByText("Are you sure?");
    const headerEl = titleEl.closest('[data-slot="alert-dialog-header"]');

    expect(headerEl).toHaveClass("text-left");
    expect(headerEl).toHaveClass("place-items-start");
    expect(titleEl).toHaveClass("text-left");
    expect(descriptionEl).toHaveClass("text-left");
  });

  it("applies destructive variant styles by default", () => {
    render(
      <ConfirmModal
        title="Empty Trash"
        message="Are you sure?"
        confirmLabel="Empty"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const confirmButton = screen.getByRole("button", { name: /empty/i });
    expect(confirmButton).toHaveClass("text-destructive");
    expect(confirmButton).toHaveClass("bg-destructive/10");
  });

  it("supports custom confirmVariant", () => {
    render(
      <ConfirmModal
        title="Continue"
        message="Are you sure?"
        confirmLabel="Proceed"
        confirmVariant="default"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const confirmButton = screen.getByRole("button", { name: /proceed/i });
    expect(confirmButton).toHaveClass("bg-primary");
    expect(confirmButton).toHaveClass("text-primary-foreground");
  });

  it("supports destructive-solid variant", () => {
    render(
      <ConfirmModal
        title="Delete Forever"
        message="Are you sure?"
        confirmLabel="Erase"
        confirmVariant="destructive-solid"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const confirmButton = screen.getByRole("button", { name: /erase/i });
    expect(confirmButton).toHaveClass("bg-destructive");
    expect(confirmButton).toHaveClass("text-destructive-foreground");
  });

  it("supports custom cancelLabel", () => {
    render(
      <ConfirmModal
        title="Discard Draft"
        message="Are you sure?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Keep Editing" }),
    ).toBeInTheDocument();
  });

  it("disables confirm button when disabled is true", () => {
    render(
      <ConfirmModal
        title="Confirm Action"
        message="Are you sure?"
        disabled={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const confirmButton = screen.getByRole("button", { name: /delete/i });
    expect(confirmButton).toBeDisabled();
  });

  it("disables buttons and handles async onConfirm", async () => {
    const user = userEvent.setup();
    let resolvePromise!: () => void;
    const asyncPromise = new Promise<void>((res) => {
      resolvePromise = res;
    });
    const onConfirm = vi.fn().mockReturnValue(asyncPromise);
    const onClose = vi.fn();

    render(
      <ConfirmModal
        title="Async Action"
        message="Are you sure?"
        confirmLabel="Submit"
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    const confirmButton = screen.getByRole("button", { name: /submit/i });
    const cancelButton = screen.getByRole("button", { name: /cancel/i });

    await user.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // During pending async action, buttons are disabled
    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();

    // Resolving promise finishes submission
    await act(async () => {
      resolvePromise();
    });
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PrioritySelect from "@/components/task/PrioritySelect";

describe("PrioritySelect", () => {
  it("renders with no value selected", () => {
    render(<PrioritySelect value={undefined} onChange={vi.fn()} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders with a value selected", () => {
    render(<PrioritySelect value="high" onChange={vi.fn()} />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("applies priority color to button in inline variant", () => {
    render(<PrioritySelect value="high" onChange={vi.fn()} variant="inline" />);
    expect(screen.getByRole("button")).toHaveClass("text-red-500");
  });

  it("applies priority color to button in toolbar variant", () => {
    render(
      <PrioritySelect value="high" onChange={vi.fn()} variant="toolbar" />,
    );
    expect(screen.getByRole("button")).toHaveClass("text-red-500");
  });

  it("calls onChange when a priority is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<PrioritySelect value={undefined} onChange={onChange} />);

    await user.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("menuitem", { name: /high/i }));

    expect(onChange).toHaveBeenCalledWith("high");
  });

  it("calls onChange with undefined when None is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<PrioritySelect value="high" onChange={onChange} />);

    await user.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("menuitem", { name: /none/i }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});

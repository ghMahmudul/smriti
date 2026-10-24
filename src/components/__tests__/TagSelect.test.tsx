import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TagSelect from "@/components/task/TagSelect";

describe("TagSelect", () => {
  it("renders with no tags selected", () => {
    render(
      <TagSelect value={[]} onChange={vi.fn()} availableTags={["urgent"]} />,
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders tag count in inline variant", () => {
    render(
      <TagSelect
        value={["urgent"]}
        onChange={vi.fn()}
        availableTags={["urgent"]}
        variant="inline"
      />,
    );
    expect(screen.getByText("1 tag")).toBeInTheDocument();
  });

  it("renders tag count in toolbar variant", () => {
    render(
      <TagSelect
        value={["urgent"]}
        onChange={vi.fn()}
        availableTags={["urgent"]}
        variant="toolbar"
      />,
    );
    expect(screen.getByText("1 tag")).toBeInTheDocument();
  });

  it("renders plural tag count in inline variant", () => {
    render(
      <TagSelect
        value={["urgent", "work"]}
        onChange={vi.fn()}
        availableTags={["urgent", "work"]}
        variant="inline"
      />,
    );
    expect(screen.getByText("2 tags")).toBeInTheDocument();
  });

  it("shows empty state when no tags available", async () => {
    const user = userEvent.setup();

    render(<TagSelect value={[]} onChange={vi.fn()} availableTags={[]} />);

    await user.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });
    expect(screen.getByText("No tags yet")).toBeInTheDocument();
  });

  it("calls onChange when a tag is toggled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <TagSelect value={[]} onChange={onChange} availableTags={["urgent"]} />,
    );

    await user.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("menuitem", { name: /urgent/i }));

    expect(onChange).toHaveBeenCalledWith(["urgent"]);
  });

  it("calls onChange when a tag is deselected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <TagSelect
        value={["urgent"]}
        onChange={onChange}
        availableTags={["urgent"]}
      />,
    );

    await user.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("menuitem", { name: /urgent/i }));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IconPicker } from "../ui/IconPicker";

describe("IconPicker", () => {
  it("renders search input and icon buttons without category buttons", () => {
    render(<IconPicker onSelect={vi.fn()} />);

    expect(screen.getByPlaceholderText(/search icons/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "All" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Work" }),
    ).not.toBeInTheDocument();

    const rocketBtn = screen.getByRole("button", { name: "Rocket" });
    expect(rocketBtn).toBeInTheDocument();
  });

  it("selects default icon by default and highlights it with bg-muted", () => {
    render(<IconPicker onSelect={vi.fn()} defaultIconId="folder" />);

    const folderBtn = screen.getByRole("button", { name: "Folder" });
    const rocketBtn = screen.getByRole("button", { name: "Rocket" });

    expect(folderBtn).toHaveClass("bg-muted", "text-foreground");
    expect(rocketBtn).toHaveClass("text-muted-foreground");
  });

  it("selects default tag icon by default when defaultIconId='tag'", () => {
    render(<IconPicker onSelect={vi.fn()} defaultIconId="tag" />);

    const tagBtn = screen.getByRole("button", { name: "Tag" });
    const folderBtn = screen.getByRole("button", { name: "Folder" });

    expect(tagBtn).toHaveClass("bg-muted", "text-foreground");
    expect(folderBtn).toHaveClass("text-muted-foreground");
  });

  it("calls onSelect with icon ID when an icon button is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<IconPicker onSelect={onSelect} defaultIconId="folder" />);

    const rocketBtn = screen.getByRole("button", { name: "Rocket" });
    await user.click(rocketBtn);

    expect(onSelect).toHaveBeenCalledWith("rocket");
  });

  it("calls onSelect with undefined when the default icon is clicked in the list", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <IconPicker
        onSelect={onSelect}
        defaultIconId="folder"
        selectedIcon="rocket"
      />,
    );

    const folderBtn = screen.getByRole("button", { name: "Folder" });
    await user.click(folderBtn);

    expect(onSelect).toHaveBeenCalledWith(undefined);
  });

  it("filters icons by search query", async () => {
    const user = userEvent.setup();

    render(<IconPicker onSelect={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/search icons/i);
    await user.type(searchInput, "rocket");

    expect(screen.getByRole("button", { name: "Rocket" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Book" }),
    ).not.toBeInTheDocument();
  });

  it("shows 'No icons found' for non-matching queries", async () => {
    const user = userEvent.setup();

    render(<IconPicker onSelect={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/search icons/i);
    await user.type(searchInput, "xyznonexistenticonquery");

    expect(screen.getByText(/no icons found/i)).toBeInTheDocument();
  });

  it("clears search input when clear button is clicked", async () => {
    const user = userEvent.setup();

    render(<IconPicker onSelect={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/search icons/i);
    await user.type(searchInput, "rocket");
    expect(searchInput).toHaveValue("rocket");

    const clearBtn = screen.getByRole("button", { name: /clear search/i });
    await user.click(clearBtn);

    expect(searchInput).toHaveValue("");
    expect(screen.getByRole("button", { name: "Book" })).toBeInTheDocument();
  });
});

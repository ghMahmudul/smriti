import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ProjectSelect from "@/components/task/ProjectSelect";

describe("ProjectSelect", () => {
  it("renders with inbox selected (case-insensitive)", () => {
    const { unmount } = render(
      <ProjectSelect value="inbox" onChange={vi.fn()} projects={["work"]} />,
    );
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    unmount();

    render(
      <ProjectSelect value="Inbox" onChange={vi.fn()} projects={["work"]} />,
    );
    expect(screen.getByText("Inbox")).toBeInTheDocument();
  });

  it("renders with a project selected", () => {
    render(
      <ProjectSelect value="work" onChange={vi.fn()} projects={["work"]} />,
    );
    expect(screen.getByText("work")).toBeInTheDocument();
  });

  it("calls onChange when a project is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ProjectSelect value="Inbox" onChange={onChange} projects={["work"]} />,
    );

    await user.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("menuitem", { name: /work/i }));

    expect(onChange).toHaveBeenCalledWith("work");
  });

  it("calls onChange when Inbox is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ProjectSelect value="work" onChange={onChange} projects={["work"]} />,
    );

    await user.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("menuitem", { name: /inbox/i }));

    expect(onChange).toHaveBeenCalledWith("Inbox");
  });
});

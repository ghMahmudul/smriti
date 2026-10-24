import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  getThisMonthRange,
  getThisWeekRange,
  getTodayRange,
} from "../../core/task-filter";
import { CompletedTaskFilter } from "../task/CompletedTaskFilter";

vi.mock("../../store/task-store", () => ({
  useProjects: () => ["work", "personal"],
}));

describe("CompletedTaskFilter", () => {
  const defaultProps = {
    projectFilter: "all",
    onProjectChange: vi.fn(),
    dateRange: undefined,
    onDateRangeChange: vi.fn(),
    projects: ["work", "personal"],
  };

  it("renders Filter button and dynamically updates text to reflect active filter without extra adornments", () => {
    const { rerender } = render(<CompletedTaskFilter {...defaultProps} />);
    const button = screen.getByRole("button", {
      name: "Filter tasks",
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Filter");
    expect(
      screen.queryByRole("button", { name: /clear/i }),
    ).not.toBeInTheDocument();

    // Rerender with date filter only: label updates to "Today"
    rerender(
      <CompletedTaskFilter
        {...defaultProps}
        projectFilter="all"
        dateRange={getTodayRange()}
      />,
    );
    expect(button).toHaveTextContent("Today");
    expect(
      screen.queryByRole("button", { name: /clear/i }),
    ).not.toBeInTheDocument();

    // Rerender with project filter only: label updates to "work"
    rerender(
      <CompletedTaskFilter
        {...defaultProps}
        projectFilter="work"
        dateRange={undefined}
      />,
    );
    expect(button).toHaveTextContent("work");

    // Rerender with both project and date filters: label updates to "work · Today"
    rerender(
      <CompletedTaskFilter
        {...defaultProps}
        projectFilter="work"
        dateRange={getTodayRange()}
      />,
    );
    expect(button).toHaveTextContent("work · Today");
    expect(
      screen.queryByRole("button", { name: /clear/i }),
    ).not.toBeInTheDocument();
  });

  it("opens popover with Project select, Shortcut options, and Calendar in order without 'Project' label", async () => {
    const user = userEvent.setup();
    render(<CompletedTaskFilter {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Filter tasks" }));

    // Does NOT contain 'Project' text header
    expect(screen.queryByText("Project")).not.toBeInTheDocument();

    // Section 1: Project select exists with "All Projects"
    expect(
      screen.getByRole("button", { name: "Select project" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select project" }),
    ).toHaveTextContent("All Projects");

    // Section 2: Shortcut options exist before calendar
    expect(screen.getByTestId("filter-quick-today")).toBeInTheDocument();
    expect(screen.getByTestId("filter-quick-this-week")).toBeInTheDocument();
    expect(screen.getByTestId("filter-quick-this-month")).toBeInTheDocument();
    expect(screen.getByTestId("filter-quick-no-filter")).toBeInTheDocument();

    // Section 3: Range calendar exists
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("allows selecting a project from the project dropdown menu", async () => {
    const user = userEvent.setup();
    const onProjectChange = vi.fn();
    render(
      <CompletedTaskFilter
        {...defaultProps}
        onProjectChange={onProjectChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Filter tasks" }));

    // Open project dropdown
    const projectBtn = screen.getByRole("button", { name: "Select project" });
    await user.click(projectBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: /all projects/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /inbox/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /work/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /personal/i }),
      ).toBeInTheDocument();
    });

    const workOption = screen.getByRole("menuitem", { name: /work/i });
    fireEvent.click(workOption);

    expect(onProjectChange).toHaveBeenCalledWith("work");
  });

  it("calls onDateRangeChange with today range and closes popover when Today shortcut is clicked", async () => {
    const user = userEvent.setup();
    const onDateRangeChange = vi.fn();
    render(
      <CompletedTaskFilter
        {...defaultProps}
        onDateRangeChange={onDateRangeChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Filter tasks" }));
    await user.click(screen.getByTestId("filter-quick-today"));

    expect(onDateRangeChange).toHaveBeenCalledTimes(1);
    const calledRange = onDateRangeChange.mock.calls[0]![0];
    const expected = getTodayRange();
    expect(calledRange.from.getDate()).toBe(expected.from.getDate());
    expect(calledRange.to.getDate()).toBe(expected.to.getDate());

    // Popover should close after clicking shortcut
    await waitFor(() => {
      expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    });
  });

  it("calls onDateRangeChange with this week range when This Week shortcut is clicked", async () => {
    const user = userEvent.setup();
    const onDateRangeChange = vi.fn();
    render(
      <CompletedTaskFilter
        {...defaultProps}
        onDateRangeChange={onDateRangeChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Filter tasks" }));
    await user.click(screen.getByTestId("filter-quick-this-week"));

    expect(onDateRangeChange).toHaveBeenCalledTimes(1);
    const calledRange = onDateRangeChange.mock.calls[0]![0];
    const expected = getThisWeekRange();
    expect(calledRange.from.getDate()).toBe(expected.from.getDate());
    expect(calledRange.to.getDate()).toBe(expected.to.getDate());
  });

  it("calls onDateRangeChange with this month range when This Month shortcut is clicked", async () => {
    const user = userEvent.setup();
    const onDateRangeChange = vi.fn();
    render(
      <CompletedTaskFilter
        {...defaultProps}
        onDateRangeChange={onDateRangeChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Filter tasks" }));
    await user.click(screen.getByTestId("filter-quick-this-month"));

    expect(onDateRangeChange).toHaveBeenCalledTimes(1);
    const calledRange = onDateRangeChange.mock.calls[0]![0];
    const expected = getThisMonthRange();
    expect(calledRange.from.getDate()).toBe(expected.from.getDate());
    expect(calledRange.to.getDate()).toBe(expected.to.getDate());
  });

  it("disables button when disabled prop is true", () => {
    render(<CompletedTaskFilter {...defaultProps} disabled={true} />);
    const button = screen.getByRole("button", { name: /filter/i });
    expect(button).toBeDisabled();
  });

  it("calls onDateRangeChange with undefined and onProjectChange with 'all' when No Filter shortcut is clicked", async () => {
    const user = userEvent.setup();
    const onDateRangeChange = vi.fn();
    const onProjectChange = vi.fn();
    render(
      <CompletedTaskFilter
        {...defaultProps}
        projectFilter="work"
        onProjectChange={onProjectChange}
        dateRange={getTodayRange()}
        onDateRangeChange={onDateRangeChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /filter tasks/i }));
    await user.click(screen.getByTestId("filter-quick-no-filter"));

    expect(onDateRangeChange).toHaveBeenCalledWith(undefined);
    expect(onProjectChange).toHaveBeenCalledWith("all");
  });
});

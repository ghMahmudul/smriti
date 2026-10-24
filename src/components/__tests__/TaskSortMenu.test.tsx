import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useUIStore } from "../../store/ui-store";
import TaskSortMenu from "../task/TaskSortMenu";

describe("TaskSortMenu", () => {
  beforeEach(() => {
    useUIStore.setState({
      taskSortBy: "default",
      taskSortOrder: "smart",
    });
  });

  it("renders Sort button with default label and icon", () => {
    render(<TaskSortMenu />);
    const button = screen.getByRole("button", { name: /sort/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Sort");
  });

  it("disables button when disabled prop is true", () => {
    render(<TaskSortMenu disabled={true} />);
    const button = screen.getByRole("button", { name: /sort/i });
    expect(button).toBeDisabled();
  });

  it("opens menu and shows sort options on click", async () => {
    const user = userEvent.setup();
    render(<TaskSortMenu />);

    const button = screen.getByRole("button", { name: /sort/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Sort by")).toBeInTheDocument();
      expect(screen.getByText("Mode")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Select sort field" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Select sort order" }),
      ).toBeInTheDocument();
    });

    const sortFieldBtn = screen.getByRole("button", {
      name: "Select sort field",
    });
    await user.click(sortFieldBtn);

    await waitFor(() => {
      const items = screen.getAllByRole("menuitem");
      expect(items.map((el) => el.textContent?.trim())).toEqual([
        "Default",
        "Date",
        "Created",
        "Priority",
        "Title",
      ]);
    });
  });

  it("updates sort by to Title and sets default order to asc on selection", async () => {
    const user = userEvent.setup();
    render(<TaskSortMenu />);

    const button = screen.getByRole("button", { name: /sort/i });
    await user.click(button);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Select sort field" }),
      ).toBeInTheDocument();
    });

    const sortFieldBtn = screen.getByRole("button", {
      name: "Select sort field",
    });
    await user.click(sortFieldBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: /title/i }),
      ).toBeInTheDocument();
    });

    const titleOption = screen.getByRole("menuitem", { name: /title/i });
    fireEvent.click(titleOption);

    expect(useUIStore.getState().taskSortBy).toBe("title");
    expect(useUIStore.getState().taskSortOrder).toBe("asc");
  });

  it("updates sort by to Priority and sets default order to desc on selection", async () => {
    const user = userEvent.setup();
    render(<TaskSortMenu />);

    const button = screen.getByRole("button", { name: /sort/i });
    await user.click(button);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Select sort field" }),
      ).toBeInTheDocument();
    });

    const sortFieldBtn = screen.getByRole("button", {
      name: "Select sort field",
    });
    await user.click(sortFieldBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: /priority/i }),
      ).toBeInTheDocument();
    });

    const priorityOption = screen.getByRole("menuitem", {
      name: /priority/i,
    });
    fireEvent.click(priorityOption);

    expect(useUIStore.getState().taskSortBy).toBe("priority");
    expect(useUIStore.getState().taskSortOrder).toBe("desc");
  });

  it("displays contextual order options for Date when active", async () => {
    useUIStore.setState({
      taskSortBy: "due",
      taskSortOrder: "asc",
    });

    const user = userEvent.setup();
    render(<TaskSortMenu />);

    const button = screen.getByRole("button", { name: /sort/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Order")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Select sort order" }),
      ).toBeInTheDocument();
    });

    const orderBtn = screen.getByRole("button", {
      name: "Select sort order",
    });
    await user.click(orderBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: /earliest first/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /latest first/i }),
      ).toBeInTheDocument();
    });
  });

  it("displays contextual order options for Priority when active", async () => {
    useUIStore.setState({
      taskSortBy: "priority",
      taskSortOrder: "desc",
    });

    const user = userEvent.setup();
    render(<TaskSortMenu />);

    const button = screen.getByRole("button", { name: /sort/i });
    await user.click(button);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Select sort order" }),
      ).toBeInTheDocument();
    });

    const orderBtn = screen.getByRole("button", {
      name: "Select sort order",
    });
    await user.click(orderBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: /highest first/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /lowest first/i }),
      ).toBeInTheDocument();
    });
  });

  it("allows toggling order manually", async () => {
    useUIStore.setState({
      taskSortBy: "priority",
      taskSortOrder: "desc",
    });

    const user = userEvent.setup();
    render(<TaskSortMenu />);

    const button = screen.getByRole("button", { name: /sort/i });
    await user.click(button);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Select sort order" }),
      ).toBeInTheDocument();
    });

    const orderBtn = screen.getByRole("button", {
      name: "Select sort order",
    });
    await user.click(orderBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: /lowest first/i }),
      ).toBeInTheDocument();
    });

    const lowestOption = screen.getByRole("menuitem", {
      name: /lowest first/i,
    });
    fireEvent.click(lowestOption);

    expect(useUIStore.getState().taskSortOrder).toBe("asc");
  });

  it("displays contextual order options for Default (Smart and Normal) and allows selection", async () => {
    useUIStore.setState({
      taskSortBy: "default",
      taskSortOrder: "smart",
    });

    const user = userEvent.setup();
    render(<TaskSortMenu />);

    const button = screen.getByRole("button", { name: /sort/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Mode")).toBeInTheDocument();
      const orderBtn = screen.getByRole("button", {
        name: "Select sort order",
      });
      expect(orderBtn).not.toBeDisabled();
      expect(orderBtn).toHaveTextContent("Smart");
    });

    const orderBtn = screen.getByRole("button", {
      name: "Select sort order",
    });
    await user.click(orderBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: /smart/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /normal/i }),
      ).toBeInTheDocument();
    });

    const normalOption = screen.getByRole("menuitem", { name: /normal/i });
    fireEvent.click(normalOption);

    expect(useUIStore.getState().taskSortOrder).toBe("normal");
  });

  it("retains normal button label 'Sort' when a sort is active", () => {
    useUIStore.setState({
      taskSortBy: "priority",
      taskSortOrder: "desc",
    });

    render(<TaskSortMenu />);
    const button = screen.getByRole("button", { name: /sort/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Sort");
  });
});

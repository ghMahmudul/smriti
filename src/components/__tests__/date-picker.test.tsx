import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DatePicker } from "@/components/ui/date-picker";

function ControlledDatePicker({
  initialRepeat = "",
  onRepeatChange,
}: {
  initialRepeat?: string;
  onRepeatChange?: (value: string) => void;
}) {
  const [repeat, setRepeat] = useState(initialRepeat);

  return (
    <DatePicker
      value=""
      onChange={vi.fn()}
      placeholder="Date"
      repeat={repeat}
      onRepeatChange={(value) => {
        setRepeat(value);
        onRepeatChange?.(value);
      }}
    />
  );
}

describe("DatePicker", () => {
  it("renders with 16px (size-4) calendar icon by default", () => {
    const { container } = render(
      <DatePicker value="" onChange={vi.fn()} placeholder="Date" />,
    );

    const button = screen.getByRole("button", { name: /date/i });
    expect(button).toBeInTheDocument();

    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("size-4");
  });

  it("allows custom iconClassName", () => {
    const { container } = render(
      <DatePicker
        value=""
        onChange={vi.fn()}
        placeholder="Date"
        iconClassName="size-5 text-primary"
      />,
    );

    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("size-5", "text-primary");
  });

  it("displays formatted date when value is provided", () => {
    render(<DatePicker value="2026-03-20" onChange={vi.fn()} />);

    expect(screen.getByText("Mar 20")).toBeInTheDocument();
  });

  it("matches the repeat icon color to the calendar icon color", () => {
    const { rerender } = render(
      <DatePicker
        value="2026-03-20"
        onChange={vi.fn()}
        repeat="daily"
        onRepeatChange={vi.fn()}
        iconClassName="text-primary"
      />,
    );

    const selectedTrigger = screen.getByRole("button", {
      name: /date: mar 20, repeats daily/i,
    });
    const selectedIcons = selectedTrigger.querySelectorAll("svg");
    expect(selectedIcons).toHaveLength(2);
    expect(selectedIcons[0]).toHaveClass("text-primary");
    expect(selectedIcons[1]).toHaveClass("text-primary", "size-3");

    rerender(
      <DatePicker
        value=""
        onChange={vi.fn()}
        placeholder="Date"
        repeat="daily"
        onRepeatChange={vi.fn()}
      />,
    );

    const emptyTrigger = screen.getByRole("button", {
      name: /date, repeats daily/i,
    });
    const emptyIcons = emptyTrigger.querySelectorAll("svg");
    expect(emptyIcons).toHaveLength(2);
    expect(emptyIcons[0]).toHaveClass("text-muted-foreground");
    expect(emptyIcons[1]).toHaveClass("text-muted-foreground", "size-3");
  });

  it("calls onChange when a quick option is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<DatePicker value="" onChange={onChange} placeholder="Date" />);

    await user.click(screen.getByRole("button", { name: /date/i }));

    const todayButton = await screen.findByText("Today");
    expect(todayButton).toBeInTheDocument();

    await user.click(todayButton);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("does not render the repeat control without onRepeatChange", async () => {
    const user = userEvent.setup();

    render(<DatePicker value="" onChange={vi.fn()} placeholder="Date" />);

    await user.click(screen.getByRole("button", { name: /date/i }));

    expect(
      screen.queryByRole("button", { name: /^repeat$/i }),
    ).not.toBeInTheDocument();
  });

  it("opens the repeat menu and applies a preset", async () => {
    const user = userEvent.setup();
    const onRepeatChange = vi.fn();

    render(<ControlledDatePicker onRepeatChange={onRepeatChange} />);

    await user.click(screen.getByRole("button", { name: /date/i }));
    await user.click(screen.getByRole("button", { name: /^repeat$/i }));

    expect(await screen.findByRole("menu")).toBeInTheDocument();

    await user.click(
      await screen.findByRole("menuitemradio", { name: /daily/i }),
    );

    expect(onRepeatChange).toHaveBeenCalledWith("daily");
    expect(
      screen.getByRole("button", { name: /repeat: daily/i }),
    ).toHaveTextContent("Daily");
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("clears the repeat value from the menu", async () => {
    const user = userEvent.setup();
    const onRepeatChange = vi.fn();

    render(
      <ControlledDatePicker
        initialRepeat="daily"
        onRepeatChange={onRepeatChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /date/i }));
    await user.click(screen.getByRole("button", { name: /repeat: daily/i }));
    await user.click(
      await screen.findByRole("menuitemradio", { name: /^none$/i }),
    );

    expect(onRepeatChange).toHaveBeenCalledWith("");
    expect(screen.getByRole("button", { name: /^repeat$/i })).toHaveTextContent(
      "None",
    );
  });

  it("reveals custom controls inside the menu and updates the interval", async () => {
    const user = userEvent.setup();
    const onRepeatChange = vi.fn();

    render(<ControlledDatePicker onRepeatChange={onRepeatChange} />);

    await user.click(screen.getByRole("button", { name: /date/i }));
    await user.click(screen.getByRole("button", { name: /^repeat$/i }));

    expect(screen.queryByRole("separator")).not.toBeInTheDocument();

    await user.click(
      await screen.findByRole("menuitemradio", { name: /custom/i }),
    );

    expect(onRepeatChange).toHaveBeenCalledWith("every 2 days");
    expect(screen.getByRole("separator")).toBeInTheDocument();

    const intervalInput = await screen.findByRole("spinbutton", {
      name: "Every",
    });
    expect(intervalInput).toHaveValue(2);

    const noneItem = screen.getByRole("menuitemradio", { name: /^none$/i });
    const customInterval = screen.getByRole("group", {
      name: /custom repeat interval/i,
    });
    expect(
      noneItem.compareDocumentPosition(customInterval) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await user.clear(intervalInput);
    await user.type(intervalInput, "3");

    await waitFor(() => {
      expect(onRepeatChange).toHaveBeenLastCalledWith("every 3 days");
    });
    expect(
      screen.getByRole("button", { name: /repeat: every 3 days/i }),
    ).toBeInTheDocument();
  });

  it("updates the custom repeat unit", async () => {
    const user = userEvent.setup();
    const onRepeatChange = vi.fn();

    render(<ControlledDatePicker onRepeatChange={onRepeatChange} />);

    await user.click(screen.getByRole("button", { name: /date/i }));
    await user.click(screen.getByRole("button", { name: /^repeat$/i }));
    await user.click(
      await screen.findByRole("menuitemradio", { name: /custom/i }),
    );
    const weeksButton = screen.getByRole("button", { name: "Weeks" });
    await user.click(weeksButton);

    expect(weeksButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Days" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(onRepeatChange).toHaveBeenLastCalledWith("every 2 weeks");
    expect(
      screen.getByRole("button", { name: /repeat: every 2 weeks/i }),
    ).toBeInTheDocument();
  });

  it("automatically sets due date to today when repeat is selected and value is empty", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onRepeatChange = vi.fn();

    render(
      <DatePicker
        value=""
        onChange={onChange}
        placeholder="Date"
        repeat=""
        onRepeatChange={onRepeatChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /date/i }));
    await user.click(screen.getByRole("button", { name: /^repeat$/i }));

    await user.click(
      await screen.findByRole("menuitemradio", { name: /daily/i }),
    );

    expect(onRepeatChange).toHaveBeenCalledWith("daily");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
  });

  it("preserves existing date when repeat is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onRepeatChange = vi.fn();

    render(
      <DatePicker
        value="2026-12-25"
        onChange={onChange}
        placeholder="Date"
        repeat=""
        onRepeatChange={onRepeatChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /date: dec 25/i }));
    await user.click(screen.getByRole("button", { name: /^repeat$/i }));

    await user.click(
      await screen.findByRole("menuitemradio", { name: /weekly/i }),
    );

    expect(onRepeatChange).toHaveBeenCalledWith("weekly");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears repeat when 'No Date' option is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onRepeatChange = vi.fn();

    render(
      <DatePicker
        value="2026-12-25"
        onChange={onChange}
        placeholder="Date"
        repeat="daily"
        onRepeatChange={onRepeatChange}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /date: dec 25, repeats daily/i }),
    );

    const noDateOption = await screen.findByRole("button", {
      name: /no date/i,
    });
    await user.click(noDateOption);

    expect(onChange).toHaveBeenCalledWith("");
    expect(onRepeatChange).toHaveBeenCalledWith("");
  });

  it("uses onDateAndRepeatChange for atomic updates if provided", async () => {
    const user = userEvent.setup();
    const onDateAndRepeatChange = vi.fn();

    render(
      <DatePicker
        value=""
        onChange={vi.fn()}
        placeholder="Date"
        repeat=""
        onDateAndRepeatChange={onDateAndRepeatChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /date/i }));
    await user.click(screen.getByRole("button", { name: /^repeat$/i }));

    await user.click(
      await screen.findByRole("menuitemradio", { name: /daily/i }),
    );

    expect(onDateAndRepeatChange).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      "daily",
    );
  });
});

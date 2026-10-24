import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "../ErrorBoundary";
import { useSidebar } from "../layout/Layout";
import RouteErrorBoundary from "../RouteErrorBoundary";

const mockUseRouteError = vi.fn();
vi.mock("react-router", () => ({
  useRouteError: () => mockUseRouteError(),
}));

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Simulated critical rendering crash");
  }
  return <div>Everything is working</div>;
}

function SidebarConsumer() {
  const sidebar = useSidebar();
  return (
    <div>
      <span>collapsed: {String(sidebar.collapsed)}</span>
      <span>isMobile: {String(sidebar.isMobile)}</span>
    </div>
  );
}

describe("ErrorBoundary and Error Recovery", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Everything is working")).toBeInTheDocument();
  });

  it("catches errors and displays the error recovery UI", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("Simulated critical rendering crash"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reload app/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /go to home/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /copy error/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reset app cache/i }),
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("allows copying error details to clipboard", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    const copyButton = screen.getByRole("button", { name: /copy error/i });
    await user.click(copyButton);

    expect(writeTextMock).toHaveBeenCalled();
    expect(screen.getByText("Copied!")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("shows reset confirmation and clears storage on confirm", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();

    localStorage.setItem("smriti-workspace", "corrupted-json");
    localStorage.setItem("sidebar-collapsed", "true");

    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    const resetButton = screen.getByRole("button", {
      name: /reset app cache/i,
    });
    await user.click(resetButton);

    expect(screen.getByText("Reset application cache?")).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", {
      name: /confirm & reset/i,
    });
    await user.click(confirmButton);

    expect(localStorage.getItem("smriti-workspace")).toBeNull();
    expect(localStorage.getItem("sidebar-collapsed")).toBeNull();

    consoleSpy.mockRestore();
  });

  it("RouteErrorBoundary renders error from React Router", () => {
    mockUseRouteError.mockReturnValue(
      new Error("React Router route loader failure"),
    );

    render(<RouteErrorBoundary />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("React Router route loader failure"),
    ).toBeInTheDocument();
  });

  it("useSidebar provides safe fallback when rendered outside Layout without throwing", () => {
    expect(() => render(<SidebarConsumer />)).not.toThrow();
    expect(screen.getByText("collapsed: false")).toBeInTheDocument();
  });
});

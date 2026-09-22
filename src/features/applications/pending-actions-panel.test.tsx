import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { usePendingActionsMock } = vi.hoisted(() => ({
  usePendingActionsMock: vi.fn(),
}));

vi.mock("@/features/applications/use-applications", () => ({
  usePendingActions: usePendingActionsMock,
}));

import { PendingActionsPanel } from "@/features/applications/pending-actions-panel";
import { pendingActions } from "@/test/pending-actions-fixtures";

describe("PendingActionsPanel", () => {
  beforeEach(() => {
    usePendingActionsMock.mockReset();
  });

  it("shows a loading state while pending actions are requested", () => {
    usePendingActionsMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      isFetching: true,
      refetch: vi.fn(),
    });

    render(<PendingActionsPanel />);

    expect(
      screen.getByRole("status", { name: "Loading pending actions" }),
    ).toBeInTheDocument();
  });

  it("shows an error without hiding the application pipeline", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();

    usePendingActionsMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      isFetching: false,
      refetch,
    });

    render(<PendingActionsPanel />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your applications are still available below",
    );

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(refetch).toHaveBeenCalledOnce();
  });

  it("shows an all-caught-up state when there are no actions", () => {
    usePendingActionsMock.mockReturnValue({
      data: { actions: [], count: 0 },
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(<PendingActionsPanel />);

    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    expect(screen.getByText("0 actions")).toBeInTheDocument();
  });

  it("links each pending action to its application", () => {
    usePendingActionsMock.mockReturnValue({
      data: pendingActions,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(<PendingActionsPanel />);

    expect(screen.getByText("Review CV")).toBeInTheDocument();
    expect(
      screen.getByText("Review the generated CV proposals."),
    ).toBeInTheDocument();
    expect(screen.getByText("Due 22 Sept 2026")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Review CV/ })).toHaveAttribute(
      "href",
      "/applications/9b52d879-79b6-4af4-a369-886b77f4bb6e",
    );
  });
});

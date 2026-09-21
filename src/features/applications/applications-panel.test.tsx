import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useApplicationsMock } = vi.hoisted(() => ({
  useApplicationsMock: vi.fn(),
}));

vi.mock("@/features/applications/use-applications", () => ({
  useApplications: useApplicationsMock,
}));

import { ApplicationsPanel } from "@/features/applications/applications-panel";

describe("ApplicationsPanel", () => {
  beforeEach(() => {
    useApplicationsMock.mockReset();
  });

  it("shows a loading state while applications are requested", () => {
    useApplicationsMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      isFetching: true,
      refetch: vi.fn(),
    });

    render(<ApplicationsPanel />);

    expect(
      screen.getByRole("status", { name: "Loading applications" }),
    ).toBeInTheDocument();
  });

  it("shows an error state and retries the query", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();

    useApplicationsMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      isFetching: false,
      refetch,
    });

    render(<ApplicationsPanel />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Applications could not be loaded",
    );

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(refetch).toHaveBeenCalledOnce();
  });

  it("shows guidance when there are no applications", () => {
    useApplicationsMock.mockReturnValue({
      data: { applications: [], count: 0 },
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(<ApplicationsPanel />);

    expect(screen.getByText("No applications yet")).toBeInTheDocument();
    expect(screen.getByText("0 roles")).toBeInTheDocument();
  });

  it("renders applications and their human-readable status", () => {
    useApplicationsMock.mockReturnValue({
      data: {
        applications: [
          {
            id: "9b52d879-79b6-4af4-a369-886b77f4bb6e",
            companyName: "Example Bank",
            roleTitle: "Graduate AI Engineer",
            status: "ready_to_apply",
            createdAt: "2026-09-20T10:00:00Z",
            updatedAt: "2026-09-20T10:30:00Z",
          },
        ],
        count: 1,
      },
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(<ApplicationsPanel />);

    expect(screen.getByText("Graduate AI Engineer")).toBeInTheDocument();
    expect(screen.getByText("Example Bank")).toBeInTheDocument();
    expect(screen.getByLabelText("Status: Ready to apply")).toBeInTheDocument();
    expect(screen.getByText("1 role")).toBeInTheDocument();
  });
});

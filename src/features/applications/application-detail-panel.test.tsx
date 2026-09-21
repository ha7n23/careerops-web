import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useApplicationMock } = vi.hoisted(() => ({
  useApplicationMock: vi.fn(),
}));

vi.mock("@/features/applications/use-applications", () => ({
  useApplication: useApplicationMock,
}));

import { ApplicationDetailPanel } from "@/features/applications/application-detail-panel";

const applicationId = "9b52d879-79b6-4af4-a369-886b77f4bb6e";

describe("ApplicationDetailPanel", () => {
  beforeEach(() => {
    useApplicationMock.mockReset();
  });

  it("shows a loading state while the application is requested", () => {
    useApplicationMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      isFetching: true,
      refetch: vi.fn(),
    });

    render(<ApplicationDetailPanel applicationId={applicationId} />);

    expect(
      screen.getByRole("status", { name: "Loading application" }),
    ).toBeInTheDocument();
    expect(useApplicationMock).toHaveBeenCalledWith(applicationId);
  });

  it("shows an error state and retries the query", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();

    useApplicationMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      isFetching: false,
      refetch,
    });

    render(<ApplicationDetailPanel applicationId={applicationId} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Application could not be loaded",
    );

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(refetch).toHaveBeenCalledOnce();
  });

  it("renders the application details", () => {
    useApplicationMock.mockReturnValue({
      data: {
        id: applicationId,
        companyName: "Example Bank",
        roleTitle: "Graduate AI Engineer",
        status: "ready_to_apply",
        createdAt: "2026-09-20T10:00:00Z",
        updatedAt: "2026-09-21T10:30:00Z",
      },
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(<ApplicationDetailPanel applicationId={applicationId} />);

    expect(
      screen.getByRole("heading", { name: "Graduate AI Engineer" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Example Bank")).toBeInTheDocument();
    expect(screen.getByLabelText("Status: Ready to apply")).toBeInTheDocument();
    expect(screen.getByText(applicationId)).toBeInTheDocument();
    expect(screen.getByText("20 Sept 2026")).toBeInTheDocument();
    expect(screen.getByText("21 Sept 2026")).toBeInTheDocument();
  });
});

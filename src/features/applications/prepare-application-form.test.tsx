import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { usePrepareApplicationMock } = vi.hoisted(() => ({
  usePrepareApplicationMock: vi.fn(),
}));

vi.mock("@/features/applications/use-applications", () => ({
  usePrepareApplication: usePrepareApplicationMock,
}));

import { PrepareApplicationForm } from "@/features/applications/prepare-application-form";

const applicationId = "9b52d879-79b6-4af4-a369-886b77f4bb6e";

describe("PrepareApplicationForm", () => {
  beforeEach(() => {
    usePrepareApplicationMock.mockReset();
  });

  it("shows validation before sending an empty job description", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn();

    usePrepareApplicationMock.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    });

    render(<PrepareApplicationForm applicationId={applicationId} />);

    await user.click(
      screen.getByRole("button", { name: "Prepare application" }),
    );

    expect(screen.getByText("Enter the job description.")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("submits a trimmed job description", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue(undefined);

    usePrepareApplicationMock.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    });

    render(<PrepareApplicationForm applicationId={applicationId} />);

    await user.type(
      screen.getByRole("textbox", { name: "Job description" }),
      " Strong Python skills are essential. ",
    );
    await user.click(
      screen.getByRole("button", { name: "Prepare application" }),
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        applicationId,
        input: {
          jobDescription: "Strong Python skills are essential.",
        },
      });
    });
  });

  it("disables the action while preparation is running", () => {
    usePrepareApplicationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
      error: null,
    });

    render(<PrepareApplicationForm applicationId={applicationId} />);

    expect(screen.getByRole("button", { name: "Preparing" })).toBeDisabled();
  });

  it("shows a safe preparation error", () => {
    usePrepareApplicationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: new Error("Sensitive upstream failure"),
    });

    render(<PrepareApplicationForm applicationId={applicationId} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Preparation could not be confirmed",
    );
    expect(
      screen.queryByText("Sensitive upstream failure"),
    ).not.toBeInTheDocument();
  });
});

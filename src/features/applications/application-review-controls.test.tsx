import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { analysisApplicationId } from "@/test/application-analysis-fixtures";

const { useReviewApplicationMock } = vi.hoisted(() => ({
  useReviewApplicationMock: vi.fn(),
}));

vi.mock("@/features/applications/use-applications", () => ({
  useReviewApplication: useReviewApplicationMock,
}));

import { ApplicationReviewControls } from "@/features/applications/application-review-controls";

describe("ApplicationReviewControls", () => {
  beforeEach(() => {
    useReviewApplicationMock.mockReset();
  });

  it("approves every reviewable proposal", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});

    useReviewApplicationMock.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    });

    render(
      <ApplicationReviewControls
        applicationId={analysisApplicationId}
        reviewableProposalIds={["CVP-001", "CVP-002"]}
        allowedReviewActions={["approve", "reject"]}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Approve all proposals" }),
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledOnce();
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      applicationId: analysisApplicationId,
      input: {
        idempotencyKey: expect.any(String),
        action: "approve",
        approvedProposalIds: ["CVP-001", "CVP-002"],
        rejectedProposalIds: [],
        edits: [],
        reviewerComment: null,
      },
    });
  });

  it("rejects every reviewable proposal", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});

    useReviewApplicationMock.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    });

    render(
      <ApplicationReviewControls
        applicationId={analysisApplicationId}
        reviewableProposalIds={["CVP-001"]}
        allowedReviewActions={["reject"]}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Approve all proposals" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Reject all proposals" }),
    );

    expect(mutateAsync).toHaveBeenCalledWith({
      applicationId: analysisApplicationId,
      input: {
        idempotencyKey: expect.any(String),
        action: "reject",
        approvedProposalIds: [],
        rejectedProposalIds: ["CVP-001"],
        edits: [],
        reviewerComment: null,
      },
    });
  });

  it("reuses the idempotency key when the same decision is retried", async () => {
    const user = userEvent.setup();

    const mutateAsync = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network outcome unknown"))
      .mockResolvedValueOnce({});

    useReviewApplicationMock.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    });

    render(
      <ApplicationReviewControls
        applicationId={analysisApplicationId}
        reviewableProposalIds={["CVP-001"]}
        allowedReviewActions={["approve"]}
      />,
    );

    const approveButton = screen.getByRole("button", {
      name: "Approve all proposals",
    });

    await user.click(approveButton);
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));

    await user.click(approveButton);
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(2));

    const firstInput = mutateAsync.mock.calls[0][0].input;
    const secondInput = mutateAsync.mock.calls[1][0].input;

    expect(secondInput.idempotencyKey).toBe(firstInput.idempotencyKey);
  });

  it("shows a safe review error", () => {
    useReviewApplicationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: new Error("Sensitive upstream failure"),
    });

    render(
      <ApplicationReviewControls
        applicationId={analysisApplicationId}
        reviewableProposalIds={["CVP-001"]}
        allowedReviewActions={["approve"]}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The review outcome could not be confirmed",
    );

    expect(
      screen.queryByText("Sensitive upstream failure"),
    ).not.toBeInTheDocument();
  });
});

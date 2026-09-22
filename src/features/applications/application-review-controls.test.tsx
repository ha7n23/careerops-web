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

const reviewableProposals = [
  {
    id: "CVP-001",
    proposedText: "First proposed sentence.",
  },
  {
    id: "CVP-002",
    proposedText: "Second proposed sentence.",
  },
];

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
      variables: undefined,
    });

    render(
      <ApplicationReviewControls
        applicationId={analysisApplicationId}
        reviewableProposals={reviewableProposals}
        allowedReviewActions={["approve", "reject"]}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Approve all proposals",
      }),
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

  it("declines every reviewable CV change", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});

    useReviewApplicationMock.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
      variables: undefined,
    });

    render(
      <ApplicationReviewControls
        applicationId={analysisApplicationId}
        reviewableProposals={reviewableProposals}
        allowedReviewActions={["reject"]}
      />,
    );

    expect(
      screen.queryByRole("button", {
        name: "Approve all proposals",
      }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Decline all CV changes",
      }),
    );

    expect(mutateAsync).toHaveBeenCalledWith({
      applicationId: analysisApplicationId,
      input: {
        idempotencyKey: expect.any(String),
        action: "reject",
        approvedProposalIds: [],
        rejectedProposalIds: ["CVP-001", "CVP-002"],
        edits: [],
        reviewerComment: null,
      },
    });
  });

  it("submits replacement text for every edited proposal", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});

    useReviewApplicationMock.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
      variables: undefined,
    });

    render(
      <ApplicationReviewControls
        applicationId={analysisApplicationId}
        reviewableProposals={reviewableProposals}
        allowedReviewActions={["edit"]}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Edit proposals",
      }),
    );

    const firstProposal = screen.getByRole("textbox", {
      name: "Proposal 1",
    });

    expect(firstProposal).toHaveValue("First proposed sentence.");

    await user.clear(firstProposal);
    await user.type(firstProposal, "Edited first sentence.");

    await user.click(
      screen.getByRole("button", {
        name: "Submit edits",
      }),
    );

    expect(mutateAsync).toHaveBeenCalledWith({
      applicationId: analysisApplicationId,
      input: {
        idempotencyKey: expect.any(String),
        action: "edit",
        approvedProposalIds: [],
        rejectedProposalIds: [],
        edits: [
          {
            proposalId: "CVP-001",
            editedText: "Edited first sentence.",
          },
          {
            proposalId: "CVP-002",
            editedText: "Second proposed sentence.",
          },
        ],
        reviewerComment: null,
      },
    });
  });

  it("requires replacement text for every edited proposal", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn();

    useReviewApplicationMock.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
      variables: undefined,
    });

    render(
      <ApplicationReviewControls
        applicationId={analysisApplicationId}
        reviewableProposals={reviewableProposals}
        allowedReviewActions={["edit"]}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Edit proposals",
      }),
    );

    await user.clear(
      screen.getByRole("textbox", {
        name: "Proposal 1",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "Submit edits",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter replacement text for every proposal",
    );

    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("requires feedback and requests regenerated proposals", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});

    useReviewApplicationMock.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
      variables: undefined,
    });

    render(
      <ApplicationReviewControls
        applicationId={analysisApplicationId}
        reviewableProposals={reviewableProposals}
        allowedReviewActions={["regenerate"]}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Regenerate proposals",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "Request new proposals",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Explain what should change",
    );

    expect(mutateAsync).not.toHaveBeenCalled();

    await user.type(
      screen.getByRole("textbox", {
        name: "Feedback for regeneration",
      }),
      "Make the wording more concise.",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Request new proposals",
      }),
    );

    expect(mutateAsync).toHaveBeenCalledWith({
      applicationId: analysisApplicationId,
      input: {
        idempotencyKey: expect.any(String),
        action: "regenerate",
        approvedProposalIds: [],
        rejectedProposalIds: ["CVP-001", "CVP-002"],
        edits: [],
        reviewerComment: "Make the wording more concise.",
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
      variables: undefined,
    });

    render(
      <ApplicationReviewControls
        applicationId={analysisApplicationId}
        reviewableProposals={reviewableProposals}
        allowedReviewActions={["approve"]}
      />,
    );

    const approveButton = screen.getByRole("button", {
      name: "Approve all proposals",
    });

    await user.click(approveButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
    });

    await user.click(approveButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(2);
    });

    const firstInput = mutateAsync.mock.calls[0][0].input;
    const secondInput = mutateAsync.mock.calls[1][0].input;

    expect(secondInput.idempotencyKey).toBe(firstInput.idempotencyKey);
  });

  it("shows a safe review error", () => {
    useReviewApplicationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: new Error("Sensitive upstream failure"),
      variables: undefined,
    });

    render(
      <ApplicationReviewControls
        applicationId={analysisApplicationId}
        reviewableProposals={reviewableProposals}
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

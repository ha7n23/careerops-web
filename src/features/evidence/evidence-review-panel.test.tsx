import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { awaitingEvidenceReview } from "@/test/evidence-fixtures";

const { useEvidenceReviewMock, useSubmitEvidenceReviewMock } = vi.hoisted(
  () => ({
    useEvidenceReviewMock: vi.fn(),
    useSubmitEvidenceReviewMock: vi.fn(),
  }),
);

vi.mock("@/features/evidence/use-evidence", () => ({
  useEvidenceReview: useEvidenceReviewMock,
  useSubmitEvidenceReview: useSubmitEvidenceReviewMock,
}));

import { EvidenceReviewPanel } from "@/features/evidence/evidence-review-panel";

describe("EvidenceReviewPanel", () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    mutateAsync.mockReset();
    useEvidenceReviewMock.mockReturnValue({
      data: awaitingEvidenceReview,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    useSubmitEvidenceReviewMock.mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it("requires every proposal decision before submission", async () => {
    const user = userEvent.setup();
    render(<EvidenceReviewPanel reviewRunId="EVR-001" />);

    await user.click(
      screen.getByRole("button", { name: "Approve evidence set" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Review all 1 proposals",
    );
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("submits an approval with an explicit duplicate resolution", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({});
    render(<EvidenceReviewPanel reviewRunId="EVR-001" />);

    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Resolution" }),
      "keep_existing",
    );
    await user.type(
      screen.getByRole("textbox", { name: /Review note/ }),
      "Verified against source.",
    );
    await user.click(
      screen.getByRole("button", { name: "Approve evidence set" }),
    );

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce());
    expect(mutateAsync).toHaveBeenCalledWith({
      reviewRunId: "EVR-001",
      decision: {
        approvedProposalIds: ["EVP-001"],
        rejectedProposalIds: [],
        edits: [],
        duplicateResolutions: [
          {
            proposalId: "EVP-001",
            scope: "approved_evidence",
            action: "keep_existing",
            matchingProposalId: null,
            matchingEvidenceId: "EVD-001",
          },
        ],
        reviewerComment: "Verified against source.",
      },
    });
  });
});

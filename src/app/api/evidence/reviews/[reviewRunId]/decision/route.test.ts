import { beforeEach, describe, expect, it, vi } from "vitest";

import { completedEvidenceReview } from "@/test/evidence-fixtures";

const { submitEvidenceReviewMock } = vi.hoisted(() => ({
  submitEvidenceReviewMock: vi.fn(),
}));

vi.mock("@/features/evidence/server", () => ({
  submitEvidenceReview: submitEvidenceReviewMock,
}));

import { POST } from "@/app/api/evidence/reviews/[reviewRunId]/decision/route";

function createContext(reviewRunId: string) {
  return { params: Promise.resolve({ reviewRunId }) };
}

describe("POST /api/evidence/reviews/[reviewRunId]/decision", () => {
  beforeEach(() => {
    submitEvidenceReviewMock.mockReset();
  });

  it("submits explicit proposal and duplicate decisions", async () => {
    submitEvidenceReviewMock.mockResolvedValue(completedEvidenceReview);
    const decision = {
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
      reviewerComment: "Verified against project notes.",
    };

    const response = await POST(
      new Request("http://localhost/api/evidence/reviews/EVR-001/decision", {
        method: "POST",
        body: JSON.stringify(decision),
      }),
      createContext("EVR-001"),
    );

    expect(response.status).toBe(200);
    expect(submitEvidenceReviewMock).toHaveBeenCalledWith("EVR-001", decision);
  });

  it("rejects a review with no proposal decision", async () => {
    const response = await POST(
      new Request("http://localhost/api/evidence/reviews/EVR-001/decision", {
        method: "POST",
        body: JSON.stringify({
          approvedProposalIds: [],
          rejectedProposalIds: [],
          edits: [],
          duplicateResolutions: [],
          reviewerComment: null,
        }),
      }),
      createContext("EVR-001"),
    );

    expect(response.status).toBe(400);
    expect(submitEvidenceReviewMock).not.toHaveBeenCalled();
  });
});

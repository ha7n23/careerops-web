import { describe, expect, it } from "vitest";

import {
  evidenceReviewDecisionSchema,
  module2EvidenceReviewSchema,
} from "@/features/evidence/contracts";
import { module2AwaitingEvidenceReview } from "@/test/evidence-fixtures";

describe("evidence contracts", () => {
  it("maps the frozen Module 2 review contract to browser-safe camel case", () => {
    const review = module2EvidenceReviewSchema.parse(
      module2AwaitingEvidenceReview,
    );

    expect(review.reviewRunId).toBe("EVR-001");
    expect(review.proposals[0].proposalId).toBe("EVP-001");
    expect(review.overlapFindings[0].matchingEvidenceId).toBe("EVD-001");
  });

  it("requires at least one explicit proposal decision", () => {
    expect(
      evidenceReviewDecisionSchema.safeParse({
        approvedProposalIds: [],
        rejectedProposalIds: [],
        edits: [],
        duplicateResolutions: [],
        reviewerComment: null,
      }).success,
    ).toBe(false);
  });
});

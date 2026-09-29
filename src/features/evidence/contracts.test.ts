import { describe, expect, it } from "vitest";

import {
  evidenceRegistryEditSchema,
  evidenceReviewDecisionSchema,
  module2EvidenceRegistryPageSchema,
  module2EvidenceReviewSchema,
} from "@/features/evidence/contracts";
import {
  module2AwaitingEvidenceReview,
  module2RegistryEvidence,
} from "@/test/evidence-fixtures";

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

  it("maps registry pagination and full evidence provenance", () => {
    const page = module2EvidenceRegistryPageSchema.parse({
      items: [module2RegistryEvidence],
      count: 1,
      total: 7,
      limit: 6,
      offset: 0,
      has_more: true,
    });

    expect(page.hasMore).toBe(true);
    expect(page.items[0]).toMatchObject({
      evidenceId: "EVD-001",
      lifecycleStatus: "active",
      sourceReferences: [{ sourceId: "DOC-001" }],
    });
  });

  it("rejects empty registry edits", () => {
    expect(evidenceRegistryEditSchema.safeParse({}).success).toBe(false);
  });
});

import "server-only";

import type {
  CreateTextEvidenceRequest,
  EvidenceDocument,
  EvidenceDocumentHistory,
  EvidenceReview,
  EvidenceReviewDecision,
  EvidenceReviewHistory,
} from "@/features/evidence/contracts";
import {
  module2EvidenceDocumentHistorySchema,
  module2EvidenceDocumentSchema,
  module2EvidenceReviewHistorySchema,
  module2EvidenceReviewSchema,
} from "@/features/evidence/contracts";
import { createCareerOpsGatewayClient } from "@/integrations/careerops/server-client";

export async function listEvidenceDocuments(): Promise<EvidenceDocumentHistory> {
  return createCareerOpsGatewayClient().requestJson(
    "/api/v1/cv-documents?limit=20",
    module2EvidenceDocumentHistorySchema,
  );
}

export async function createTextEvidenceSource(
  input: CreateTextEvidenceRequest,
): Promise<EvidenceDocument> {
  return createCareerOpsGatewayClient().requestJson(
    "/api/v1/cv-documents/text",
    module2EvidenceDocumentSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: input.title,
        content: input.content,
      }),
    },
  );
}

export async function uploadEvidenceDocument(
  file: File,
): Promise<EvidenceDocument> {
  const formData = new FormData();
  formData.set("file", file, file.name);

  return createCareerOpsGatewayClient().requestJson(
    "/api/v1/cv-documents",
    module2EvidenceDocumentSchema,
    {
      method: "POST",
      body: formData,
    },
  );
}

export async function startEvidenceReview(
  documentId: string,
): Promise<EvidenceReview> {
  return createCareerOpsGatewayClient().requestJson(
    `/api/v1/cv-documents/${encodeURIComponent(documentId)}/evidence-review`,
    module2EvidenceReviewSchema,
    { method: "POST" },
  );
}

export async function listEvidenceReviews(): Promise<EvidenceReviewHistory> {
  return createCareerOpsGatewayClient().requestJson(
    "/api/v1/cv-evidence-reviews?limit=20",
    module2EvidenceReviewHistorySchema,
  );
}

export async function getEvidenceReview(
  reviewRunId: string,
): Promise<EvidenceReview> {
  return createCareerOpsGatewayClient().requestJson(
    `/api/v1/cv-evidence-reviews/${encodeURIComponent(reviewRunId)}`,
    module2EvidenceReviewSchema,
  );
}

export async function submitEvidenceReview(
  reviewRunId: string,
  decision: EvidenceReviewDecision,
): Promise<EvidenceReview> {
  return createCareerOpsGatewayClient().requestJson(
    `/api/v1/cv-evidence-reviews/${encodeURIComponent(reviewRunId)}/review`,
    module2EvidenceReviewSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approved_proposal_ids: decision.approvedProposalIds,
        rejected_proposal_ids: decision.rejectedProposalIds,
        edits: decision.edits.map((edit) => ({
          proposal_id: edit.proposalId,
          title: edit.title,
          technologies: edit.technologies,
          capabilities: edit.capabilities,
          claims: edit.claims,
        })),
        duplicate_resolutions: decision.duplicateResolutions.map(
          (resolution) => ({
            proposal_id: resolution.proposalId,
            scope: resolution.scope,
            action: resolution.action,
            matching_proposal_id: resolution.matchingProposalId,
            matching_evidence_id: resolution.matchingEvidenceId,
          }),
        ),
        reviewer_comment: decision.reviewerComment,
      }),
    },
  );
}

import { z } from "zod";

export const EVIDENCE_CATEGORIES = [
  "project",
  "employment",
  "education",
  "certification",
  "achievement",
  "skill",
] as const;

export const EVIDENCE_DUPLICATE_ACTIONS = [
  "keep_existing",
  "accept_separate",
  "replace_existing",
  "merge_into_existing",
] as const;

export const evidenceCategorySchema = z.enum(EVIDENCE_CATEGORIES);
export const evidenceDuplicateActionSchema = z.enum(EVIDENCE_DUPLICATE_ACTIONS);
export const evidenceOverlapScopeSchema = z.enum([
  "within_document",
  "approved_evidence",
]);
export const evidenceReviewStatusSchema = z.enum([
  "awaiting_review",
  "completed",
  "invalid",
]);

const opaqueIdSchema = z.string().trim().min(1).max(128);
const sourceReferenceSchema = z.object({
  sourceType: z.string(),
  sourceId: opaqueIdSchema,
  pageNumber: z.number().int().positive().nullable(),
  sourceExcerpt: z.string().nullable(),
});

export const evidenceDocumentSchema = z.object({
  documentId: opaqueIdSchema,
  originalFilename: z.string().min(1),
  documentFormat: z.enum(["pdf", "docx", "text"]),
  mediaType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  sha256Hex: z.string().min(1),
  status: z.enum(["uploaded", "extracted", "quarantined"]),
});

export const evidenceDocumentSummarySchema = evidenceDocumentSchema
  .omit({ mediaType: true, sha256Hex: true })
  .extend({
    uploadedAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

export const evidenceDocumentHistorySchema = z.object({
  items: z.array(evidenceDocumentSummarySchema),
  count: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

export const evidenceProposalSchema = z.object({
  proposalId: opaqueIdSchema,
  category: evidenceCategorySchema,
  title: z.string().min(1),
  verificationStatus: z.enum(["pending", "approved", "rejected", "superseded"]),
  sourceSection: z.string().min(1),
  sourceSectionOrderIndex: z.number().int().nonnegative(),
  technologies: z.array(z.string()),
  capabilities: z.array(z.string()),
  claims: z.array(z.string().min(1)),
  sourceReferences: z.array(sourceReferenceSchema),
  warnings: z.array(z.string()),
});

export const evidenceOverlapFindingSchema = z.object({
  proposalId: opaqueIdSchema,
  scope: evidenceOverlapScopeSchema,
  matchingProposalId: opaqueIdSchema.nullable(),
  matchingEvidenceId: opaqueIdSchema.nullable(),
  matchedClaims: z.array(z.string()),
  sameSourceExcerpt: z.boolean(),
  allowedActions: z.array(evidenceDuplicateActionSchema).min(1),
});

const approvedEvidenceSchema = z.object({
  evidenceId: opaqueIdSchema,
  category: evidenceCategorySchema,
  title: z.string().min(1),
  lifecycleStatus: z.enum(["active", "archived"]),
  approvedClaims: z.array(z.string()),
});

const evidenceReviewResultSchema = z.object({
  approvedProposalIds: z.array(opaqueIdSchema),
  editedProposalIds: z.array(opaqueIdSchema),
  rejectedProposalIds: z.array(opaqueIdSchema),
  approvedEvidence: z.array(approvedEvidenceSchema),
});

export const evidenceReviewSchema = z.object({
  reviewRunId: opaqueIdSchema,
  documentId: opaqueIdSchema,
  status: evidenceReviewStatusSchema,
  proposals: z.array(evidenceProposalSchema),
  overlapFindings: z.array(evidenceOverlapFindingSchema),
  documentWarnings: z.array(z.string()),
  reviewResult: evidenceReviewResultSchema.nullable(),
});

export const evidenceReviewSummarySchema = z.object({
  reviewRunId: opaqueIdSchema,
  documentId: opaqueIdSchema,
  status: evidenceReviewStatusSchema,
  proposalCount: z.number().int().nonnegative(),
  approvedEvidenceCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const evidenceReviewHistorySchema = z.object({
  items: z.array(evidenceReviewSummarySchema),
  count: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

const module2SourceReferenceSchema = z
  .object({
    source_type: z.string(),
    source_id: opaqueIdSchema,
    page_number: z.number().int().positive().nullable().default(null),
    source_excerpt: z.string().nullable().default(null),
  })
  .transform((source) => ({
    sourceType: source.source_type,
    sourceId: source.source_id,
    pageNumber: source.page_number,
    sourceExcerpt: source.source_excerpt,
  }));

export const module2EvidenceDocumentSchema = z
  .object({
    document_id: opaqueIdSchema,
    original_filename: z.string().min(1),
    document_format: z.enum(["pdf", "docx", "text"]),
    media_type: z.string().min(1),
    size_bytes: z.number().int().nonnegative(),
    sha256_hex: z.string().min(1),
    status: z.enum(["uploaded", "extracted", "quarantined"]),
  })
  .transform((document) => ({
    documentId: document.document_id,
    originalFilename: document.original_filename,
    documentFormat: document.document_format,
    mediaType: document.media_type,
    sizeBytes: document.size_bytes,
    sha256Hex: document.sha256_hex,
    status: document.status,
  }));

const module2EvidenceDocumentSummarySchema = z
  .object({
    document_id: opaqueIdSchema,
    original_filename: z.string().min(1),
    document_format: z.enum(["pdf", "docx", "text"]),
    size_bytes: z.number().int().nonnegative(),
    status: z.enum(["uploaded", "extracted", "quarantined"]),
    uploaded_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .transform((document) => ({
    documentId: document.document_id,
    originalFilename: document.original_filename,
    documentFormat: document.document_format,
    sizeBytes: document.size_bytes,
    status: document.status,
    uploadedAt: document.uploaded_at,
    updatedAt: document.updated_at,
  }));

export const module2EvidenceDocumentHistorySchema = z
  .object({
    items: z.array(module2EvidenceDocumentSummarySchema),
    count: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
  })
  .transform((history) => history);

const module2EvidenceProposalSchema = z
  .object({
    proposal_id: opaqueIdSchema,
    category: evidenceCategorySchema,
    title: z.string().min(1),
    verification_status: z.enum([
      "pending",
      "approved",
      "rejected",
      "superseded",
    ]),
    source_section: z.string().min(1),
    source_section_order_index: z.number().int().nonnegative(),
    technologies: z.array(z.string()),
    capabilities: z.array(z.string()),
    claims: z.array(z.string().min(1)),
    source_references: z.array(module2SourceReferenceSchema),
    warnings: z.array(z.string()),
  })
  .transform((proposal) => ({
    proposalId: proposal.proposal_id,
    category: proposal.category,
    title: proposal.title,
    verificationStatus: proposal.verification_status,
    sourceSection: proposal.source_section,
    sourceSectionOrderIndex: proposal.source_section_order_index,
    technologies: proposal.technologies,
    capabilities: proposal.capabilities,
    claims: proposal.claims,
    sourceReferences: proposal.source_references,
    warnings: proposal.warnings,
  }));

const module2EvidenceOverlapSchema = z
  .object({
    proposal_id: opaqueIdSchema,
    scope: evidenceOverlapScopeSchema,
    matching_proposal_id: opaqueIdSchema.nullable().default(null),
    matching_evidence_id: opaqueIdSchema.nullable().default(null),
    matched_claims: z.array(z.string()),
    same_source_excerpt: z.boolean(),
    allowed_actions: z.array(evidenceDuplicateActionSchema).min(1),
  })
  .transform((finding) => ({
    proposalId: finding.proposal_id,
    scope: finding.scope,
    matchingProposalId: finding.matching_proposal_id,
    matchingEvidenceId: finding.matching_evidence_id,
    matchedClaims: finding.matched_claims,
    sameSourceExcerpt: finding.same_source_excerpt,
    allowedActions: finding.allowed_actions,
  }));

const module2ApprovedEvidenceSchema = z
  .object({
    evidence_id: opaqueIdSchema,
    category: evidenceCategorySchema,
    title: z.string().min(1),
    lifecycle_status: z.enum(["active", "archived"]),
    approved_claims: z.array(z.string()),
  })
  .transform((evidence) => ({
    evidenceId: evidence.evidence_id,
    category: evidence.category,
    title: evidence.title,
    lifecycleStatus: evidence.lifecycle_status,
    approvedClaims: evidence.approved_claims,
  }));

const module2EvidenceReviewResultSchema = z
  .object({
    approved_proposal_ids: z.array(opaqueIdSchema),
    edited_proposal_ids: z.array(opaqueIdSchema),
    rejected_proposal_ids: z.array(opaqueIdSchema),
    approved_evidence: z.array(module2ApprovedEvidenceSchema),
  })
  .transform((result) => ({
    approvedProposalIds: result.approved_proposal_ids,
    editedProposalIds: result.edited_proposal_ids,
    rejectedProposalIds: result.rejected_proposal_ids,
    approvedEvidence: result.approved_evidence,
  }));

export const module2EvidenceReviewSchema = z
  .object({
    review_run_id: opaqueIdSchema,
    document_id: opaqueIdSchema,
    status: evidenceReviewStatusSchema,
    proposals: z.array(module2EvidenceProposalSchema),
    overlap_findings: z.array(module2EvidenceOverlapSchema),
    document_warnings: z.array(z.string()),
    review_result: module2EvidenceReviewResultSchema.nullable().default(null),
  })
  .transform((review) => ({
    reviewRunId: review.review_run_id,
    documentId: review.document_id,
    status: review.status,
    proposals: review.proposals,
    overlapFindings: review.overlap_findings,
    documentWarnings: review.document_warnings,
    reviewResult: review.review_result,
  }));

const module2EvidenceReviewSummarySchema = z
  .object({
    review_run_id: opaqueIdSchema,
    document_id: opaqueIdSchema,
    status: evidenceReviewStatusSchema,
    proposal_count: z.number().int().nonnegative(),
    approved_evidence_count: z.number().int().nonnegative(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .transform((review) => ({
    reviewRunId: review.review_run_id,
    documentId: review.document_id,
    status: review.status,
    proposalCount: review.proposal_count,
    approvedEvidenceCount: review.approved_evidence_count,
    createdAt: review.created_at,
    updatedAt: review.updated_at,
  }));

export const module2EvidenceReviewHistorySchema = z
  .object({
    items: z.array(module2EvidenceReviewSummarySchema),
    count: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
  })
  .transform((history) => history);

export const createTextEvidenceRequestSchema = z.object({
  title: z.string().trim().min(1).max(250),
  content: z.string().trim().min(1).max(30_000),
});

export const evidenceProposalEditSchema = z.object({
  proposalId: opaqueIdSchema,
  title: z.string().trim().min(1).max(250).optional(),
  technologies: z.array(z.string().trim().min(1)).optional(),
  capabilities: z.array(z.string().trim().min(1)).optional(),
  claims: z.array(z.string().trim().min(1)).min(1).optional(),
});

export const evidenceDuplicateResolutionSchema = z.object({
  proposalId: opaqueIdSchema,
  scope: evidenceOverlapScopeSchema,
  action: evidenceDuplicateActionSchema,
  matchingProposalId: opaqueIdSchema.nullable(),
  matchingEvidenceId: opaqueIdSchema.nullable(),
});

export const evidenceReviewDecisionSchema = z
  .object({
    approvedProposalIds: z.array(opaqueIdSchema),
    rejectedProposalIds: z.array(opaqueIdSchema),
    edits: z.array(evidenceProposalEditSchema),
    duplicateResolutions: z.array(evidenceDuplicateResolutionSchema),
    reviewerComment: z.string().trim().max(1_000).nullable(),
  })
  .superRefine((decision, context) => {
    if (
      decision.approvedProposalIds.length === 0 &&
      decision.rejectedProposalIds.length === 0 &&
      decision.edits.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Review at least one evidence proposal.",
      });
    }
  });

export type CreateTextEvidenceRequest = z.infer<
  typeof createTextEvidenceRequestSchema
>;
export type EvidenceDocument = z.infer<typeof evidenceDocumentSchema>;
export type EvidenceDocumentHistory = z.infer<
  typeof evidenceDocumentHistorySchema
>;
export type EvidenceDuplicateAction = z.infer<
  typeof evidenceDuplicateActionSchema
>;
export type EvidenceReview = z.infer<typeof evidenceReviewSchema>;
export type EvidenceReviewDecision = z.infer<
  typeof evidenceReviewDecisionSchema
>;
export type EvidenceReviewHistory = z.infer<typeof evidenceReviewHistorySchema>;

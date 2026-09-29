import type {
  EvidenceDocument,
  EvidenceDocumentHistory,
  EvidenceReview,
  EvidenceReviewHistory,
  EvidenceRegistryPage,
  RegistryEvidence,
} from "@/features/evidence/contracts";

export const evidenceDocument: EvidenceDocument = {
  documentId: "DOC-001",
  originalFilename: "CareerOps notes.txt",
  documentFormat: "text",
  mediaType: "text/plain; charset=utf-8",
  sizeBytes: 42,
  sha256Hex: "a".repeat(64),
  status: "uploaded",
};

export const evidenceDocumentHistory: EvidenceDocumentHistory = {
  items: [
    {
      documentId: evidenceDocument.documentId,
      originalFilename: evidenceDocument.originalFilename,
      documentFormat: evidenceDocument.documentFormat,
      sizeBytes: evidenceDocument.sizeBytes,
      status: evidenceDocument.status,
      uploadedAt: "2026-09-29T09:00:00Z",
      updatedAt: "2026-09-29T09:01:00Z",
    },
  ],
  count: 1,
  limit: 20,
};

export const awaitingEvidenceReview: EvidenceReview = {
  reviewRunId: "EVR-001",
  documentId: evidenceDocument.documentId,
  status: "awaiting_review",
  proposals: [
    {
      proposalId: "EVP-001",
      category: "project",
      title: "CareerOps",
      verificationStatus: "pending",
      sourceSection: "projects",
      sourceSectionOrderIndex: 0,
      technologies: ["Python", "FastAPI"],
      capabilities: ["API development"],
      claims: ["Built a FastAPI service."],
      sourceReferences: [
        {
          sourceType: "manual_entry",
          sourceId: evidenceDocument.documentId,
          pageNumber: null,
          sourceExcerpt: "Built a FastAPI service.",
        },
      ],
      warnings: [],
    },
  ],
  overlapFindings: [
    {
      proposalId: "EVP-001",
      scope: "approved_evidence",
      matchingProposalId: null,
      matchingEvidenceId: "EVD-001",
      matchedClaims: ["Built a FastAPI service."],
      sameSourceExcerpt: false,
      allowedActions: ["keep_existing", "merge_into_existing"],
    },
  ],
  documentWarnings: [],
  reviewResult: null,
};

export const completedEvidenceReview: EvidenceReview = {
  ...awaitingEvidenceReview,
  status: "completed",
  reviewResult: {
    approvedProposalIds: ["EVP-001"],
    editedProposalIds: [],
    rejectedProposalIds: [],
    approvedEvidence: [
      {
        evidenceId: "EVD-002",
        category: "project",
        title: "CareerOps",
        lifecycleStatus: "active",
        approvedClaims: ["Built a FastAPI service."],
      },
    ],
  },
};

export const evidenceReviewHistory: EvidenceReviewHistory = {
  items: [
    {
      reviewRunId: "EVR-001",
      documentId: "DOC-001",
      status: "awaiting_review",
      proposalCount: 1,
      approvedEvidenceCount: 0,
      createdAt: "2026-09-29T09:01:00Z",
      updatedAt: "2026-09-29T09:02:00Z",
    },
  ],
  count: 1,
  limit: 20,
};

export const module2AwaitingEvidenceReview = {
  review_run_id: "EVR-001",
  document_id: "DOC-001",
  status: "awaiting_review",
  proposals: [
    {
      proposal_id: "EVP-001",
      category: "project",
      title: "CareerOps",
      verification_status: "pending",
      source_section: "projects",
      source_section_order_index: 0,
      technologies: ["Python", "FastAPI"],
      capabilities: ["API development"],
      claims: ["Built a FastAPI service."],
      source_references: [
        {
          source_type: "manual_entry",
          source_id: "DOC-001",
          page_number: null,
          source_excerpt: "Built a FastAPI service.",
        },
      ],
      warnings: [],
    },
  ],
  overlap_findings: [
    {
      proposal_id: "EVP-001",
      scope: "approved_evidence",
      matching_proposal_id: null,
      matching_evidence_id: "EVD-001",
      matched_claims: ["Built a FastAPI service."],
      same_source_excerpt: false,
      allowed_actions: ["keep_existing", "merge_into_existing"],
    },
  ],
  document_warnings: [],
  review_result: null,
};

export const registryEvidence: RegistryEvidence = {
  evidenceId: "EVD-001",
  category: "project",
  title: "CareerOps platform",
  verificationStatus: "approved",
  lifecycleStatus: "active",
  technologies: ["Python", "FastAPI"],
  capabilities: ["API development", "Testing"],
  approvedClaims: ["Built a FastAPI service."],
  sourceReferences: [
    {
      sourceType: "manual_entry",
      sourceId: "DOC-001",
      pageNumber: null,
      sourceExcerpt: "Built a FastAPI service.",
    },
  ],
};

export const evidenceRegistryPage: EvidenceRegistryPage = {
  items: [registryEvidence],
  count: 1,
  total: 1,
  limit: 6,
  offset: 0,
  hasMore: false,
};

export const module2RegistryEvidence = {
  evidence_id: "EVD-001",
  category: "project",
  title: "CareerOps platform",
  verification_status: "approved",
  lifecycle_status: "active",
  technologies: ["Python", "FastAPI"],
  capabilities: ["API development", "Testing"],
  approved_claims: ["Built a FastAPI service."],
  source_references: [
    {
      source_type: "manual_entry",
      source_id: "DOC-001",
      page_number: null,
      source_excerpt: "Built a FastAPI service.",
    },
  ],
};

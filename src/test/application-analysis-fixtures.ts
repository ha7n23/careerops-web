export const analysisApplicationId = "9b52d879-79b6-4af4-a369-886b77f4bb6e";

export const module2ApplicationAnalysis = {
  application: {
    application_id: analysisApplicationId,
    company_name: "Example Bank",
    role_title: "Graduate AI Engineer",
    status: "ready_to_apply",
    created_at: "2026-09-20T10:00:00Z",
    updated_at: "2026-09-20T10:30:00Z",
  },
  preparation: {
    preparation_id: "d7144177-fef8-4b46-a233-27714bd50a25",
    application_id: analysisApplicationId,
    status: "completed",
    agent_engine_job_id: analysisApplicationId,
    agent_engine_thread_id: "THR-001",
    error_message: null,
    created_at: "2026-09-20T10:05:00Z",
    updated_at: "2026-09-20T10:30:00Z",
  },
  analysis: {
    status: "completed",
    thread_id: "THR-001",
    job_id: analysisApplicationId,
    role_title: "Graduate AI Engineer",
    fit_score: 82,
    requirements: [
      {
        requirement_id: "REQ-001",
        name: "Build production AI systems",
        category: "essential",
        importance_score: 5,
      },
    ],
    evidence_matches: [
      {
        requirement_id: "REQ-001",
        match_strength: "strong",
        explanation: "Delivered a production retrieval system.",
        gap: false,
      },
    ],
    cv_proposals: [
      {
        proposal_id: "CVP-001",
        section: "projects",
        current_text: null,
        proposed_text: "Built a production retrieval system.",
        confidence_score: 0.95,
        warnings: [],
      },
    ],
    reviewable_proposal_ids: [],
    blocked_proposal_ids: [],
    allowed_review_actions: [],
    review_status: null,
  },
} as const;

export const applicationAnalysis = {
  application: {
    id: analysisApplicationId,
    companyName: "Example Bank",
    roleTitle: "Graduate AI Engineer",
    status: "ready_to_apply",
    createdAt: "2026-09-20T10:00:00Z",
    updatedAt: "2026-09-20T10:30:00Z",
  },
  preparation: {
    id: "d7144177-fef8-4b46-a233-27714bd50a25",
    applicationId: analysisApplicationId,
    status: "completed",
    agentEngineJobId: analysisApplicationId,
    agentEngineThreadId: "THR-001",
    errorMessage: null,
    createdAt: "2026-09-20T10:05:00Z",
    updatedAt: "2026-09-20T10:30:00Z",
  },
  analysis: {
    status: "completed",
    threadId: "THR-001",
    jobId: analysisApplicationId,
    roleTitle: "Graduate AI Engineer",
    fitScore: 82,
    requirements: [
      {
        id: "REQ-001",
        name: "Build production AI systems",
        category: "essential",
        importanceScore: 5,
      },
    ],
    evidenceMatches: [
      {
        requirementId: "REQ-001",
        matchStrength: "strong",
        explanation: "Delivered a production retrieval system.",
        gap: false,
      },
    ],
    cvProposals: [
      {
        id: "CVP-001",
        section: "projects",
        currentText: null,
        proposedText: "Built a production retrieval system.",
        confidenceScore: 0.95,
        warnings: [],
      },
    ],
    reviewableProposalIds: [],
    blockedProposalIds: [],
    allowedReviewActions: [],
    reviewStatus: null,
  },
} as const;

export const module2PrepareApplicationResult = {
  ...module2ApplicationAnalysis,
  started_new_analysis: true,
} as const;

export const prepareApplicationResult = {
  ...applicationAnalysis,
  startedNewAnalysis: true,
} as const;

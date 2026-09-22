import { z } from "zod";

import {
  applicationIdSchema,
  applicationSummarySchema,
  module2ApplicationSummarySchema,
} from "@/features/applications/contracts";

export const prepareApplicationRequestSchema = z.object({
  jobDescription: z
    .string()
    .trim()
    .min(1, "Enter the job description.")
    .max(50_000, "Job description must be 50,000 characters or fewer."),
});

const applicationPreparationStatusSchema = z.enum([
  "pending",
  "starting",
  "awaiting_review",
  "completed",
  "failed",
  "outcome_unknown",
]);

const applicationAnalysisStatusSchema = z.enum([
  "awaiting_review",
  "completed",
]);

export const applicationReviewActionSchema = z.enum([
  "approve",
  "edit",
  "reject",
  "regenerate",
]);

const requirementSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.enum(["essential", "desirable"]),
  importanceScore: z.number().int().min(1).max(5),
});

const evidenceMatchSchema = z.object({
  requirementId: z.string().trim().min(1),
  matchStrength: z.enum(["strong", "partial", "related", "none"]),
  explanation: z.string().trim().min(1),
  gap: z.boolean(),
});

const cvProposalSchema = z.object({
  id: z.string().trim().min(1),
  section: z.enum([
    "profile",
    "skills",
    "experience",
    "projects",
    "education",
    "certifications",
  ]),
  currentText: z.string().nullable(),
  proposedText: z.string().trim().min(1),
  confidenceScore: z.number().min(0).max(1),
  warnings: z.array(z.string()),
});

export const applicationPreparationSchema = z.object({
  id: z.string().uuid(),
  applicationId: applicationIdSchema,
  status: applicationPreparationStatusSchema,
  agentEngineJobId: z.string().trim().min(1),
  agentEngineThreadId: z.string().trim().min(1).nullable(),
  errorMessage: z.string().trim().min(1).nullable(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const agentEngineAnalysisSchema = z.object({
  status: applicationAnalysisStatusSchema,
  threadId: z.string().trim().min(1),
  jobId: z.string().trim().min(1),
  roleTitle: z.string().trim().min(1).nullable(),
  fitScore: z.number().min(0).max(100),
  requirements: z.array(requirementSchema),
  evidenceMatches: z.array(evidenceMatchSchema),
  cvProposals: z.array(cvProposalSchema),
  reviewableProposalIds: z.array(z.string()),
  blockedProposalIds: z.array(z.string()),
  allowedReviewActions: z.array(applicationReviewActionSchema),
  reviewStatus: z.string().nullable(),
});

export const applicationAnalysisSchema = z.object({
  application: applicationSummarySchema,
  preparation: applicationPreparationSchema,
  analysis: agentEngineAnalysisSchema,
});

export const prepareApplicationResultSchema = z.object({
  application: applicationSummarySchema,
  preparation: applicationPreparationSchema,
  analysis: agentEngineAnalysisSchema.nullable(),
  startedNewAnalysis: z.boolean(),
});

export const module2ApplicationPreparationSchema = z
  .object({
    preparation_id: z.string().uuid(),
    application_id: applicationIdSchema,
    status: applicationPreparationStatusSchema,
    agent_engine_job_id: z.string().trim().min(1),
    agent_engine_thread_id: z.string().trim().min(1).nullable(),
    error_message: z.string().trim().min(1).nullable(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .transform((preparation) =>
    applicationPreparationSchema.parse({
      id: preparation.preparation_id,
      applicationId: preparation.application_id,
      status: preparation.status,
      agentEngineJobId: preparation.agent_engine_job_id,
      agentEngineThreadId: preparation.agent_engine_thread_id,
      errorMessage: preparation.error_message,
      createdAt: preparation.created_at,
      updatedAt: preparation.updated_at,
    }),
  );

export const module2AgentEngineAnalysisSchema = z
  .object({
    status: applicationAnalysisStatusSchema,
    thread_id: z.string().trim().min(1),
    job_id: z.string().trim().min(1),
    role_title: z.string().trim().min(1).nullable(),
    fit_score: z.number().min(0).max(100),
    requirements: z.array(
      z.object({
        requirement_id: z.string().trim().min(1),
        name: z.string().trim().min(1),
        category: z.enum(["essential", "desirable"]),
        importance_score: z.number().int().min(1).max(5),
      }),
    ),
    evidence_matches: z.array(
      z.object({
        requirement_id: z.string().trim().min(1),
        match_strength: z.enum(["strong", "partial", "related", "none"]),
        explanation: z.string().trim().min(1),
        gap: z.boolean(),
      }),
    ),
    cv_proposals: z.array(
      z.object({
        proposal_id: z.string().trim().min(1),
        section: z.enum([
          "profile",
          "skills",
          "experience",
          "projects",
          "education",
          "certifications",
        ]),
        current_text: z.string().nullable(),
        proposed_text: z.string().trim().min(1),
        confidence_score: z.number().min(0).max(1),
        warnings: z.array(z.string()),
      }),
    ),
    reviewable_proposal_ids: z.array(z.string()),
    blocked_proposal_ids: z.array(z.string()),
    allowed_review_actions: z.array(applicationReviewActionSchema),
    review_status: z.string().nullable(),
  })
  .transform((analysis) =>
    agentEngineAnalysisSchema.parse({
      status: analysis.status,
      threadId: analysis.thread_id,
      jobId: analysis.job_id,
      roleTitle: analysis.role_title,
      fitScore: analysis.fit_score,
      requirements: analysis.requirements.map((requirement) => ({
        id: requirement.requirement_id,
        name: requirement.name,
        category: requirement.category,
        importanceScore: requirement.importance_score,
      })),
      evidenceMatches: analysis.evidence_matches.map((match) => ({
        requirementId: match.requirement_id,
        matchStrength: match.match_strength,
        explanation: match.explanation,
        gap: match.gap,
      })),
      cvProposals: analysis.cv_proposals.map((proposal) => ({
        id: proposal.proposal_id,
        section: proposal.section,
        currentText: proposal.current_text,
        proposedText: proposal.proposed_text,
        confidenceScore: proposal.confidence_score,
        warnings: proposal.warnings,
      })),
      reviewableProposalIds: analysis.reviewable_proposal_ids,
      blockedProposalIds: analysis.blocked_proposal_ids,
      allowedReviewActions: analysis.allowed_review_actions,
      reviewStatus: analysis.review_status,
    }),
  );

export const module2ApplicationAnalysisSchema = z
  .object({
    application: module2ApplicationSummarySchema,
    preparation: module2ApplicationPreparationSchema,
    analysis: module2AgentEngineAnalysisSchema,
  })
  .pipe(applicationAnalysisSchema);

export const module2PrepareApplicationResultSchema = z
  .object({
    application: module2ApplicationSummarySchema,
    preparation: module2ApplicationPreparationSchema,
    analysis: module2AgentEngineAnalysisSchema.nullable(),
    started_new_analysis: z.boolean(),
  })
  .transform((result) =>
    prepareApplicationResultSchema.parse({
      application: result.application,
      preparation: result.preparation,
      analysis: result.analysis,
      startedNewAnalysis: result.started_new_analysis,
    }),
  );

export type ApplicationAnalysis = z.infer<typeof applicationAnalysisSchema>;
export type PrepareApplicationRequest = z.infer<
  typeof prepareApplicationRequestSchema
>;
export type PrepareApplicationResult = z.infer<
  typeof prepareApplicationResultSchema
>;

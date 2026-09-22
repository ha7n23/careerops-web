import { z } from "zod";

import {
  agentEngineAnalysisSchema,
  applicationPreparationSchema,
  applicationReviewActionSchema,
  module2AgentEngineAnalysisSchema,
  module2ApplicationPreparationSchema,
} from "@/features/applications/analysis-contracts";
import {
  applicationIdSchema,
  applicationSummarySchema,
  module2ApplicationSummarySchema,
} from "@/features/applications/contracts";

const proposalIdSchema = z.string().trim().min(1);

export const REVIEW_EDIT_MAX_LENGTH = 1_500;
export const REVIEW_COMMENT_MAX_LENGTH = 1_000;

const applicationReviewEditSchema = z.object({
  proposalId: proposalIdSchema,
  editedText: z.string().trim().min(1).max(REVIEW_EDIT_MAX_LENGTH),
});

const applicationReviewSubmissionStatusSchema = z.enum([
  "pending",
  "submitting",
  "completed",
  "failed",
  "outcome_unknown",
]);

const applicationReviewOutcomeSchema = z.enum(["awaiting_review", "completed"]);

const applicationReviewSubmissionSchema = z.object({
  id: z.string().uuid(),
  preparationId: z.string().uuid(),
  applicationId: applicationIdSchema,
  threadId: z.string().trim().min(1),
  idempotencyKey: z.string().trim().min(1).max(128),
  action: applicationReviewActionSchema,
  approvedProposalIds: z.array(proposalIdSchema),
  rejectedProposalIds: z.array(proposalIdSchema),
  edits: z.array(applicationReviewEditSchema),
  reviewerComment: z.string().nullable(),
  status: applicationReviewSubmissionStatusSchema,
  outcome: applicationReviewOutcomeSchema.nullable(),
  errorMessage: z.string().trim().min(1).nullable(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const reviewApplicationRequestSchema = z.object({
  idempotencyKey: z.string().trim().min(1).max(128),
  action: applicationReviewActionSchema,
  approvedProposalIds: z.array(proposalIdSchema).default([]),
  rejectedProposalIds: z.array(proposalIdSchema).default([]),
  edits: z.array(applicationReviewEditSchema).default([]),
  reviewerComment: z
    .string()
    .trim()
    .max(REVIEW_COMMENT_MAX_LENGTH)
    .nullable()
    .default(null),
});

export const reviewApplicationResultSchema = z.object({
  application: applicationSummarySchema,
  preparation: applicationPreparationSchema,
  submission: applicationReviewSubmissionSchema,
  analysis: agentEngineAnalysisSchema.nullable(),
  startedNewReview: z.boolean(),
});

const module2ApplicationReviewSubmissionSchema = z
  .object({
    review_submission_id: z.string().uuid(),
    preparation_id: z.string().uuid(),
    application_id: applicationIdSchema,
    thread_id: z.string().trim().min(1),
    idempotency_key: z.string().trim().min(1).max(128),
    action: applicationReviewActionSchema,
    approved_proposal_ids: z.array(proposalIdSchema),
    rejected_proposal_ids: z.array(proposalIdSchema),
    edits: z.array(
      z.object({
        proposal_id: proposalIdSchema,
        edited_text: z.string().trim().min(1).max(REVIEW_EDIT_MAX_LENGTH),
      }),
    ),
    reviewer_comment: z.string().nullable(),
    status: applicationReviewSubmissionStatusSchema,
    outcome: applicationReviewOutcomeSchema.nullable(),
    error_message: z.string().trim().min(1).nullable(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .transform((submission) =>
    applicationReviewSubmissionSchema.parse({
      id: submission.review_submission_id,
      preparationId: submission.preparation_id,
      applicationId: submission.application_id,
      threadId: submission.thread_id,
      idempotencyKey: submission.idempotency_key,
      action: submission.action,
      approvedProposalIds: submission.approved_proposal_ids,
      rejectedProposalIds: submission.rejected_proposal_ids,
      edits: submission.edits.map((edit) => ({
        proposalId: edit.proposal_id,
        editedText: edit.edited_text,
      })),
      reviewerComment: submission.reviewer_comment,
      status: submission.status,
      outcome: submission.outcome,
      errorMessage: submission.error_message,
      createdAt: submission.created_at,
      updatedAt: submission.updated_at,
    }),
  );

export const module2ReviewApplicationResultSchema = z
  .object({
    application: module2ApplicationSummarySchema,
    preparation: module2ApplicationPreparationSchema,
    submission: module2ApplicationReviewSubmissionSchema,
    analysis: module2AgentEngineAnalysisSchema.nullable(),
    started_new_review: z.boolean(),
  })
  .transform((result) =>
    reviewApplicationResultSchema.parse({
      application: result.application,
      preparation: result.preparation,
      submission: result.submission,
      analysis: result.analysis,
      startedNewReview: result.started_new_review,
    }),
  );

export type ApplicationReviewAction = z.infer<
  typeof applicationReviewActionSchema
>;

export type ReviewApplicationRequest = z.infer<
  typeof reviewApplicationRequestSchema
>;

export type ReviewApplicationResult = z.infer<
  typeof reviewApplicationResultSchema
>;

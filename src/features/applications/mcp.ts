import { z } from "zod";

import {
  module2ApplicationListSchema,
  module2ApplicationSummarySchema,
  type ApplicationList,
  type ApplicationStatus,
  type ApplicationSummary,
  type CreateApplicationRequest,
} from "@/features/applications/contracts";

import {
  module2ApplicationAnalysisSchema,
  module2PrepareApplicationResultSchema,
  type ApplicationAnalysis,
  type PrepareApplicationRequest,
  type PrepareApplicationResult,
} from "@/features/applications/analysis-contracts";

import {
  module2ReviewApplicationResultSchema,
  type ReviewApplicationRequest,
  type ReviewApplicationResult,
} from "@/features/applications/review-contracts";

import {
  module2PendingActionsSchema,
  type PendingActions,
} from "@/features/applications/pending-actions-contracts";

type ToolCallRequest = {
  name: string;
  arguments?: Record<string, unknown>;
};

type ToolCallOptions = {
  timeout?: number;
};

const APPLICATION_WORKFLOW_TIMEOUT_MS = 660_000;

export class ApplicationAnalysisUnavailableError extends Error {
  constructor() {
    super("Module 2 has no available analysis for this application.");
    this.name = "ApplicationAnalysisUnavailableError";
  }
}

export type McpToolCaller = {
  callTool(
    request: ToolCallRequest,
    resultSchema?: undefined,
    options?: ToolCallOptions,
  ): Promise<unknown>;
};

const toolResultSchema = z.object({
  isError: z.boolean().optional(),
  structuredContent: z.unknown().optional(),
});

export async function listApplicationsFromMcp(
  client: McpToolCaller,
  status?: ApplicationStatus,
): Promise<ApplicationList> {
  const result = toolResultSchema.parse(
    await client.callTool({
      name: "list_applications",
      arguments: status === undefined ? {} : { status },
    }),
  );

  if (result.isError) {
    throw new Error("Module 2 could not list applications.");
  }

  if (result.structuredContent === undefined) {
    throw new Error("Module 2 returned no structured application data.");
  }

  return module2ApplicationListSchema.parse(result.structuredContent);
}

export async function getApplicationFromMcp(
  client: McpToolCaller,
  applicationId: string,
): Promise<ApplicationSummary> {
  const result = toolResultSchema.parse(
    await client.callTool({
      name: "get_application",
      arguments: { application_id: applicationId },
    }),
  );

  if (result.isError) {
    throw new Error("Module 2 could not get the application.");
  }

  if (result.structuredContent === undefined) {
    throw new Error("Module 2 returned no structured application data.");
  }

  return module2ApplicationSummarySchema.parse(result.structuredContent);
}

export async function createApplicationFromMcp(
  client: McpToolCaller,
  input: CreateApplicationRequest,
): Promise<ApplicationSummary> {
  const result = toolResultSchema.parse(
    await client.callTool({
      name: "create_application",
      arguments: {
        company_name: input.companyName,
        role_title: input.roleTitle,
        idempotency_key: input.idempotencyKey,
      },
    }),
  );

  if (result.isError) {
    throw new Error("Module 2 could not create the application.");
  }

  if (result.structuredContent === undefined) {
    throw new Error("Module 2 returned no structured application data.");
  }

  return module2ApplicationSummarySchema.parse(result.structuredContent);
}

export async function getApplicationAnalysisFromMcp(
  client: McpToolCaller,
  applicationId: string,
): Promise<ApplicationAnalysis> {
  const result = toolResultSchema.parse(
    await client.callTool({
      name: "get_application_analysis",
      arguments: { application_id: applicationId },
    }),
  );

  if (result.isError) {
    throw new ApplicationAnalysisUnavailableError();
  }

  if (result.structuredContent === undefined) {
    throw new Error("Module 2 returned no structured analysis data.");
  }

  return module2ApplicationAnalysisSchema.parse(result.structuredContent);
}

export async function prepareApplicationFromMcp(
  client: McpToolCaller,
  applicationId: string,
  input: PrepareApplicationRequest,
): Promise<PrepareApplicationResult> {
  const result = toolResultSchema.parse(
    await client.callTool(
      {
        name: "prepare_application",
        arguments: {
          application_id: applicationId,
          job_description: input.jobDescription,
        },
      },
      undefined,
      {
        timeout: APPLICATION_WORKFLOW_TIMEOUT_MS,
      },
    ),
  );

  if (result.isError) {
    throw new Error("Module 2 could not prepare the application.");
  }

  if (result.structuredContent === undefined) {
    throw new Error("Module 2 returned no structured preparation data.");
  }

  return module2PrepareApplicationResultSchema.parse(result.structuredContent);
}

export async function reviewApplicationFromMcp(
  client: McpToolCaller,
  applicationId: string,
  input: ReviewApplicationRequest,
): Promise<ReviewApplicationResult> {
  const result = toolResultSchema.parse(
    await client.callTool(
      {
        name: "review_application",
        arguments: {
          application_id: applicationId,
          idempotency_key: input.idempotencyKey,
          action: input.action,
          approved_proposal_ids: input.approvedProposalIds,
          rejected_proposal_ids: input.rejectedProposalIds,
          edits: input.edits.map((edit) => ({
            proposal_id: edit.proposalId,
            edited_text: edit.editedText,
          })),
          reviewer_comment: input.reviewerComment,
        },
      },
      undefined,
      {
        timeout: APPLICATION_WORKFLOW_TIMEOUT_MS,
      },
    ),
  );

  if (result.isError) {
    throw new Error("Module 2 could not review the application.");
  }

  if (result.structuredContent === undefined) {
    throw new Error("Module 2 returned no structured review data.");
  }

  return module2ReviewApplicationResultSchema.parse(result.structuredContent);
}

export async function getPendingActionsFromMcp(
  client: McpToolCaller,
): Promise<PendingActions> {
  const result = toolResultSchema.parse(
    await client.callTool({
      name: "get_pending_actions",
      arguments: {},
    }),
  );

  if (result.isError) {
    throw new Error("Module 2 could not get pending actions.");
  }

  if (result.structuredContent === undefined) {
    throw new Error("Module 2 returned no structured pending action data.");
  }

  return module2PendingActionsSchema.parse(result.structuredContent);
}

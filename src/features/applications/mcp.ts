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
  type ApplicationAnalysis,
} from "@/features/applications/analysis-contracts";

type ToolCallRequest = {
  name: string;
  arguments?: Record<string, unknown>;
};

export class ApplicationAnalysisUnavailableError extends Error {
  constructor() {
    super("Module 2 has no available analysis for this application.");
    this.name = "ApplicationAnalysisUnavailableError";
  }
}

export type McpToolCaller = {
  callTool(request: ToolCallRequest): Promise<unknown>;
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

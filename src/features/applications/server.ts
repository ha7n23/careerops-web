import "server-only";

import type {
  ApplicationList,
  ApplicationStatus,
  ApplicationSummary,
  CreateApplicationRequest,
} from "@/features/applications/contracts";
import type {
  ApplicationAnalysis,
  PrepareApplicationRequest,
  PrepareApplicationResult,
} from "@/features/applications/analysis-contracts";
import {
  createApplicationFromMcp,
  getApplicationAnalysisFromMcp,
  getApplicationFromMcp,
  listApplicationsFromMcp,
  prepareApplicationFromMcp,
} from "@/features/applications/mcp";
import { withCareerOpsMcpClient } from "@/integrations/mcp/client";

export async function listApplications(
  status?: ApplicationStatus,
): Promise<ApplicationList> {
  return withCareerOpsMcpClient((client) =>
    listApplicationsFromMcp(client, status),
  );
}

export async function getApplication(
  applicationId: string,
): Promise<ApplicationSummary> {
  return withCareerOpsMcpClient((client) =>
    getApplicationFromMcp(client, applicationId),
  );
}

export async function getApplicationAnalysis(
  applicationId: string,
): Promise<ApplicationAnalysis> {
  return withCareerOpsMcpClient((client) =>
    getApplicationAnalysisFromMcp(client, applicationId),
  );
}

export async function createApplication(
  input: CreateApplicationRequest,
): Promise<ApplicationSummary> {
  return withCareerOpsMcpClient((client) =>
    createApplicationFromMcp(client, input),
  );
}

export async function prepareApplication(
  applicationId: string,
  input: PrepareApplicationRequest,
): Promise<PrepareApplicationResult> {
  return withCareerOpsMcpClient((client) =>
    prepareApplicationFromMcp(client, applicationId, input),
  );
}

import "server-only";

import type {
  ApplicationList,
  ApplicationStatus,
  ApplicationSummary,
} from "@/features/applications/contracts";
import type { ApplicationAnalysis } from "@/features/applications/analysis-contracts";
import {
  getApplicationFromMcp,
  listApplicationsFromMcp,
  getApplicationAnalysisFromMcp,
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

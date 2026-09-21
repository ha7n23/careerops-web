import "server-only";

import type {
  ApplicationList,
  ApplicationStatus,
} from "@/features/applications/contracts";
import { listApplicationsFromMcp } from "@/features/applications/mcp";
import { withCareerOpsMcpClient } from "@/integrations/mcp/client";

export async function listApplications(
  status?: ApplicationStatus,
): Promise<ApplicationList> {
  return withCareerOpsMcpClient((client) =>
    listApplicationsFromMcp(client, status),
  );
}

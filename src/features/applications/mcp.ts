import { z } from "zod";

import {
  module2ApplicationListSchema,
  type ApplicationList,
  type ApplicationStatus,
} from "@/features/applications/contracts";

type ToolCallRequest = {
  name: string;
  arguments?: Record<string, unknown>;
};

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

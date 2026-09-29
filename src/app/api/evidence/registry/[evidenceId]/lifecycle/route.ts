import { z } from "zod";

import { setRegistryEvidenceLifecycle } from "@/features/evidence/server";
import {
  gatewayErrorResponse,
  privateNoStoreHeaders,
} from "@/integrations/careerops/route-errors";

const lifecycleRequestSchema = z.object({
  action: z.enum(["archive", "restore"]),
});

export async function POST(
  request: Request,
  context: RouteContext<"/api/evidence/registry/[evidenceId]/lifecycle">,
): Promise<Response> {
  const { evidenceId } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return invalidLifecycleResponse();
  }

  const parsedRequest = lifecycleRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return invalidLifecycleResponse();
  }

  try {
    const evidence = await setRegistryEvidenceLifecycle(
      evidenceId,
      parsedRequest.data.action,
    );
    return Response.json(evidence, { headers: privateNoStoreHeaders });
  } catch (error) {
    console.error("Failed to change CareerOps evidence lifecycle.", error);
    return gatewayErrorResponse(
      error,
      "The evidence lifecycle could not be changed.",
    );
  }
}

function invalidLifecycleResponse(): Response {
  return Response.json(
    {
      error: {
        code: "INVALID_EVIDENCE_LIFECYCLE",
        message: "Choose a supported evidence lifecycle action.",
      },
    },
    { status: 400, headers: privateNoStoreHeaders },
  );
}

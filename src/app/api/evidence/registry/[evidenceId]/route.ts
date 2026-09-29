import { evidenceRegistryEditSchema } from "@/features/evidence/contracts";
import {
  editRegistryEvidence,
  getRegistryEvidence,
} from "@/features/evidence/server";
import {
  gatewayErrorResponse,
  privateNoStoreHeaders,
} from "@/integrations/careerops/route-errors";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/evidence/registry/[evidenceId]">,
): Promise<Response> {
  const { evidenceId } = await context.params;

  try {
    const evidence = await getRegistryEvidence(evidenceId);
    return Response.json(evidence, { headers: privateNoStoreHeaders });
  } catch (error) {
    console.error("Failed to retrieve CareerOps evidence.", error);
    return gatewayErrorResponse(error, "The evidence record is unavailable.");
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/evidence/registry/[evidenceId]">,
): Promise<Response> {
  const { evidenceId } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return invalidEditResponse();
  }

  const parsedEdit = evidenceRegistryEditSchema.safeParse(body);

  if (!parsedEdit.success) {
    return invalidEditResponse();
  }

  try {
    const evidence = await editRegistryEvidence(evidenceId, parsedEdit.data);
    return Response.json(evidence, { headers: privateNoStoreHeaders });
  } catch (error) {
    console.error("Failed to edit CareerOps evidence.", error);
    return gatewayErrorResponse(
      error,
      "The evidence changes could not be saved.",
    );
  }
}

function invalidEditResponse(): Response {
  return Response.json(
    {
      error: {
        code: "INVALID_EVIDENCE_EDIT",
        message: "Enter valid grounded evidence before saving.",
      },
    },
    { status: 400, headers: privateNoStoreHeaders },
  );
}

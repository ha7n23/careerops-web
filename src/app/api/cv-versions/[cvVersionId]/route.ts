import { cvVersionIdSchema } from "@/features/final-cv/contracts";
import { getFinalCv } from "@/features/final-cv/server";
import {
  gatewayErrorResponse,
  privateNoStoreHeaders,
} from "@/integrations/careerops/route-errors";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/cv-versions/[cvVersionId]">,
): Promise<Response> {
  const { cvVersionId: value } = await context.params;
  const cvVersionId = cvVersionIdSchema.safeParse(value);

  if (!cvVersionId.success) {
    return invalidVersionResponse();
  }

  try {
    const version = await getFinalCv(cvVersionId.data);
    return Response.json(version, { headers: privateNoStoreHeaders });
  } catch (error) {
    console.error("Failed to retrieve the final CareerOps CV.", error);
    return gatewayErrorResponse(error, "The final CV could not be retrieved.");
  }
}

function invalidVersionResponse(): Response {
  return Response.json(
    {
      error: {
        code: "INVALID_CV_VERSION_ID",
        message: "The requested CV version is invalid.",
      },
    },
    { status: 400, headers: privateNoStoreHeaders },
  );
}

import {
  cvArtifactFormatSchema,
  cvVersionIdSchema,
} from "@/features/final-cv/contracts";
import { downloadFinalCvArtifact } from "@/features/final-cv/server";
import {
  gatewayErrorResponse,
  privateNoStoreHeaders,
} from "@/integrations/careerops/route-errors";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/cv-versions/[cvVersionId]/artifacts/[artifactFormat]">,
): Promise<Response> {
  const params = await context.params;
  const cvVersionId = cvVersionIdSchema.safeParse(params.cvVersionId);
  const artifactFormat = cvArtifactFormatSchema.safeParse(
    params.artifactFormat,
  );

  if (!cvVersionId.success || !artifactFormat.success) {
    return invalidArtifactResponse();
  }

  try {
    const artifact = await downloadFinalCvArtifact(
      cvVersionId.data,
      artifactFormat.data,
    );

    return new Response(artifact.data, {
      headers: {
        ...privateNoStoreHeaders,
        "Content-Type": artifact.mediaType,
        "Content-Disposition": `attachment; filename="careerops-cv-${cvVersionId.data}.${artifactFormat.data}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Failed to download the final CareerOps CV.", error);
    return gatewayErrorResponse(
      error,
      "The CV artifact could not be downloaded.",
    );
  }
}

function invalidArtifactResponse(): Response {
  return Response.json(
    {
      error: {
        code: "INVALID_CV_ARTIFACT",
        message: "Choose a valid final CV artifact.",
      },
    },
    { status: 400, headers: privateNoStoreHeaders },
  );
}

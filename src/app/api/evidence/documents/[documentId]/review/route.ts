import { startEvidenceReview } from "@/features/evidence/server";
import {
  gatewayErrorResponse,
  privateNoStoreHeaders,
} from "@/integrations/careerops/route-errors";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/evidence/documents/[documentId]/review">,
): Promise<Response> {
  const { documentId } = await context.params;

  if (documentId.trim().length === 0 || documentId.length > 128) {
    return Response.json(
      {
        error: {
          code: "INVALID_DOCUMENT_ID",
          message: "The requested evidence source ID is invalid.",
        },
      },
      { status: 400, headers: privateNoStoreHeaders },
    );
  }

  try {
    const review = await startEvidenceReview(documentId);
    return Response.json(review, { headers: privateNoStoreHeaders });
  } catch (error) {
    console.error("Failed to start a CareerOps evidence review.", error);
    return gatewayErrorResponse(
      error,
      "The evidence review could not be started.",
    );
  }
}

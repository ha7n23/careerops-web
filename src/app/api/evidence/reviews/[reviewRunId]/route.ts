import { getEvidenceReview } from "@/features/evidence/server";
import {
  gatewayErrorResponse,
  privateNoStoreHeaders,
} from "@/integrations/careerops/route-errors";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/evidence/reviews/[reviewRunId]">,
): Promise<Response> {
  const { reviewRunId } = await context.params;

  try {
    const review = await getEvidenceReview(reviewRunId);
    return Response.json(review, { headers: privateNoStoreHeaders });
  } catch (error) {
    console.error("Failed to recover a CareerOps evidence review.", error);
    return gatewayErrorResponse(
      error,
      "The evidence review could not be recovered.",
    );
  }
}

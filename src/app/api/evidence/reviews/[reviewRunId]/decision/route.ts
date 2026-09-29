import { evidenceReviewDecisionSchema } from "@/features/evidence/contracts";
import { submitEvidenceReview } from "@/features/evidence/server";
import {
  gatewayErrorResponse,
  privateNoStoreHeaders,
} from "@/integrations/careerops/route-errors";

export async function POST(
  request: Request,
  context: RouteContext<"/api/evidence/reviews/[reviewRunId]/decision">,
): Promise<Response> {
  const { reviewRunId } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return invalidDecisionResponse();
  }

  const parsedDecision = evidenceReviewDecisionSchema.safeParse(body);

  if (!parsedDecision.success) {
    return invalidDecisionResponse();
  }

  try {
    const review = await submitEvidenceReview(reviewRunId, parsedDecision.data);
    return Response.json(review, { headers: privateNoStoreHeaders });
  } catch (error) {
    console.error("Failed to submit a CareerOps evidence review.", error);
    return gatewayErrorResponse(
      error,
      "The evidence decision could not be saved.",
    );
  }
}

function invalidDecisionResponse(): Response {
  return Response.json(
    {
      error: {
        code: "INVALID_EVIDENCE_DECISION",
        message:
          "Review every proposal and resolve every reported overlap before submitting.",
      },
    },
    { status: 400, headers: privateNoStoreHeaders },
  );
}

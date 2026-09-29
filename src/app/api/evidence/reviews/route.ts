import { listEvidenceReviews } from "@/features/evidence/server";
import {
  gatewayErrorResponse,
  privateNoStoreHeaders,
} from "@/integrations/careerops/route-errors";

export async function GET(): Promise<Response> {
  try {
    const reviews = await listEvidenceReviews();
    return Response.json(reviews, { headers: privateNoStoreHeaders });
  } catch (error) {
    console.error("Failed to list CareerOps evidence reviews.", error);
    return gatewayErrorResponse(
      error,
      "Evidence reviews are temporarily unavailable.",
    );
  }
}

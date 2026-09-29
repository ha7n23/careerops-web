import { evidenceRegistryQuerySchema } from "@/features/evidence/contracts";
import { queryEvidenceRegistry } from "@/features/evidence/server";
import {
  gatewayErrorResponse,
  privateNoStoreHeaders,
} from "@/integrations/careerops/route-errors";

export async function GET(request: Request): Promise<Response> {
  const search = new URL(request.url).searchParams;
  const parsedQuery = evidenceRegistryQuerySchema.safeParse({
    query: search.get("q") ?? "",
    category: search.get("category"),
    lifecycleStatus: search.get("lifecycleStatus") ?? "active",
    offset: Number(search.get("offset") ?? 0),
    limit: Number(search.get("limit") ?? 6),
  });

  if (!parsedQuery.success) {
    return Response.json(
      {
        error: {
          code: "INVALID_EVIDENCE_QUERY",
          message: "Choose valid evidence filters and pagination values.",
        },
      },
      { status: 400, headers: privateNoStoreHeaders },
    );
  }

  try {
    const page = await queryEvidenceRegistry(parsedQuery.data);
    return Response.json(page, { headers: privateNoStoreHeaders });
  } catch (error) {
    console.error("Failed to query the CareerOps evidence registry.", error);
    return gatewayErrorResponse(
      error,
      "The Evidence Registry is temporarily unavailable.",
    );
  }
}

import { applicationIdSchema } from "@/features/applications/contracts";
import { ApplicationAnalysisUnavailableError } from "@/features/applications/mcp";
import { getApplicationAnalysis } from "@/features/applications/server";

const responseHeaders = {
  "Cache-Control": "private, no-store",
};

export async function GET(
  _request: Request,
  context: RouteContext<"/api/applications/[applicationId]/analysis">,
): Promise<Response> {
  const { applicationId: applicationIdValue } = await context.params;
  const parsedApplicationId = applicationIdSchema.safeParse(applicationIdValue);

  if (!parsedApplicationId.success) {
    return Response.json(
      {
        error: {
          code: "INVALID_APPLICATION_ID",
          message: "The requested application ID is invalid.",
        },
      },
      { status: 400, headers: responseHeaders },
    );
  }

  try {
    const analysis = await getApplicationAnalysis(parsedApplicationId.data);

    return Response.json(analysis, { headers: responseHeaders });
  } catch (error) {
    if (error instanceof ApplicationAnalysisUnavailableError) {
      return Response.json(
        {
          error: {
            code: "ANALYSIS_NOT_AVAILABLE",
            message:
              "This application does not have an available analysis yet.",
          },
        },
        { status: 404, headers: responseHeaders },
      );
    }

    console.error("Failed to get the CareerOps application analysis.", error);

    return Response.json(
      {
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "CareerOps services are temporarily unavailable.",
        },
      },
      { status: 502, headers: responseHeaders },
    );
  }
}

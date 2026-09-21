import { applicationIdSchema } from "@/features/applications/contracts";

import { getApplication } from "@/features/applications/server";

const responseHeaders = {
  "Cache-Control": "private, no-store",
};

export async function GET(
  _request: Request,
  context: RouteContext<"/api/applications/[applicationId]">,
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
    const application = await getApplication(parsedApplicationId.data);

    return Response.json(application, { headers: responseHeaders });
  } catch (error) {
    console.error("Failed to get the CareerOps application.", error);

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

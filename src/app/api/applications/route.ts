import {
  applicationStatusSchema,
  type ApplicationStatus,
} from "@/features/applications/contracts";
import { listApplications } from "@/features/applications/server";

const responseHeaders = {
  "Cache-Control": "private, no-store",
};

export async function GET(request: Request): Promise<Response> {
  const statusValue = new URL(request.url).searchParams.get("status");
  let status: ApplicationStatus | undefined;

  if (statusValue !== null) {
    const parsedStatus = applicationStatusSchema.safeParse(statusValue);

    if (!parsedStatus.success) {
      return Response.json(
        {
          error: {
            code: "INVALID_STATUS",
            message: "The requested application status is not supported.",
          },
        },
        { status: 400, headers: responseHeaders },
      );
    }

    status = parsedStatus.data;
  }

  try {
    const applications = await listApplications(status);

    return Response.json(applications, { headers: responseHeaders });
  } catch (error) {
    console.error("Failed to list CareerOps applications.", error);

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

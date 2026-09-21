import {
  applicationStatusSchema,
  createApplicationRequestSchema,
  type ApplicationStatus,
} from "@/features/applications/contracts";
import {
  createApplication,
  listApplications,
} from "@/features/applications/server";

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

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return invalidCreateApplicationResponse();
  }

  const parsedInput = createApplicationRequestSchema.safeParse(body);

  if (!parsedInput.success) {
    return invalidCreateApplicationResponse();
  }

  try {
    const application = await createApplication(parsedInput.data);

    return Response.json(application, {
      status: 201,
      headers: {
        ...responseHeaders,
        Location: `/api/applications/${application.id}`,
      },
    });
  } catch (error) {
    console.error("Failed to create a CareerOps application.", error);

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

function invalidCreateApplicationResponse(): Response {
  return Response.json(
    {
      error: {
        code: "INVALID_APPLICATION_INPUT",
        message: "Enter a valid company name and role title.",
      },
    },
    { status: 400, headers: responseHeaders },
  );
}

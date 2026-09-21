import { prepareApplicationRequestSchema } from "@/features/applications/analysis-contracts";
import { applicationIdSchema } from "@/features/applications/contracts";
import { prepareApplication } from "@/features/applications/server";

const responseHeaders = {
  "Cache-Control": "private, no-store",
};

type PrepareApplicationContext = {
  params: Promise<{ applicationId: string }>;
};

export async function POST(
  request: Request,
  context: PrepareApplicationContext,
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

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return invalidPreparationInputResponse();
  }

  const parsedInput = prepareApplicationRequestSchema.safeParse(body);

  if (!parsedInput.success) {
    return invalidPreparationInputResponse();
  }

  try {
    const result = await prepareApplication(
      parsedApplicationId.data,
      parsedInput.data,
    );

    return Response.json(result, { headers: responseHeaders });
  } catch (error) {
    console.error("Failed to prepare the CareerOps application.", error);

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

function invalidPreparationInputResponse(): Response {
  return Response.json(
    {
      error: {
        code: "INVALID_PREPARATION_INPUT",
        message: "Enter a valid job description.",
      },
    },
    { status: 400, headers: responseHeaders },
  );
}

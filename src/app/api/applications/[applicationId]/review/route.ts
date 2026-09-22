import { applicationIdSchema } from "@/features/applications/contracts";
import { reviewApplicationRequestSchema } from "@/features/applications/review-contracts";
import { reviewApplication } from "@/features/applications/server";

const responseHeaders = {
  "Cache-Control": "private, no-store",
};

type ReviewApplicationContext = {
  params: Promise<{ applicationId: string }>;
};

export async function POST(
  request: Request,
  context: ReviewApplicationContext,
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
    return invalidReviewInputResponse();
  }

  const parsedInput = reviewApplicationRequestSchema.safeParse(body);

  if (!parsedInput.success) {
    return invalidReviewInputResponse();
  }

  try {
    const result = await reviewApplication(
      parsedApplicationId.data,
      parsedInput.data,
    );

    return Response.json(result, { headers: responseHeaders });
  } catch (error) {
    console.error("Failed to review the CareerOps application.", error);

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

function invalidReviewInputResponse(): Response {
  return Response.json(
    {
      error: {
        code: "INVALID_REVIEW_INPUT",
        message: "Enter a valid application review decision.",
      },
    },
    { status: 400, headers: responseHeaders },
  );
}

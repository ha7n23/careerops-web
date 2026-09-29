import { generateFinalCvRequestSchema } from "@/features/final-cv/contracts";
import { generateFinalCv } from "@/features/final-cv/server";
import {
  gatewayErrorResponse,
  privateNoStoreHeaders,
} from "@/integrations/careerops/route-errors";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return invalidGenerationResponse();
  }

  const parsedRequest = generateFinalCvRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return invalidGenerationResponse();
  }

  try {
    const version = await generateFinalCv(parsedRequest.data);
    return Response.json(version, {
      status: version.reusedExistingVersion ? 200 : 201,
      headers: privateNoStoreHeaders,
    });
  } catch (error) {
    console.error("Failed to generate the final CareerOps CV.", error);
    return gatewayErrorResponse(error, "The final CV could not be generated.");
  }
}

function invalidGenerationResponse(): Response {
  return Response.json(
    {
      error: {
        code: "INVALID_FINAL_CV_REQUEST",
        message: "Choose a valid source CV before generating the final CV.",
      },
    },
    { status: 400, headers: privateNoStoreHeaders },
  );
}

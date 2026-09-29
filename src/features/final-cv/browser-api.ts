import { z } from "zod";

import {
  cvVersionMetadataSchema,
  finalCvVersionSchema,
  type CvVersionMetadata,
  type FinalCvVersion,
  type GenerateFinalCvRequest,
} from "@/features/final-cv/contracts";

const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export class FinalCvApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "FinalCvApiError";
  }
}

export function generateFinalCv(
  input: GenerateFinalCvRequest,
): Promise<FinalCvVersion> {
  return requestFinalCvApi("/api/cv-versions", finalCvVersionSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function fetchFinalCv(
  cvVersionId: string,
  signal?: AbortSignal,
): Promise<CvVersionMetadata> {
  return requestFinalCvApi(
    `/api/cv-versions/${encodeURIComponent(cvVersionId)}`,
    cvVersionMetadataSchema,
    { signal },
  );
}

async function requestFinalCvApi<Result>(
  url: string,
  schema: z.ZodType<Result>,
  options: RequestInit,
): Promise<Result> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const response = await fetch(url, { ...options, headers });
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new FinalCvApiError(
      "CareerOps returned an invalid response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(body);

    throw new FinalCvApiError(
      parsedError.success
        ? parsedError.data.error.message
        : "The final CV request could not be completed.",
      response.status,
      parsedError.success ? parsedError.data.error.code : "REQUEST_FAILED",
    );
  }

  const parsedResult = schema.safeParse(body);

  if (!parsedResult.success) {
    throw new FinalCvApiError(
      "CareerOps returned an invalid response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  return parsedResult.data;
}

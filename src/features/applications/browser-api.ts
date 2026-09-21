import { z } from "zod";

import {
  applicationAnalysisSchema,
  type ApplicationAnalysis,
} from "@/features/applications/analysis-contracts";

import {
  applicationListSchema,
  applicationSummarySchema,
  type ApplicationList,
  type ApplicationStatus,
  type ApplicationSummary,
} from "@/features/applications/contracts";

const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export class ApplicationsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ApplicationsApiError";
  }
}

export async function fetchApplications(
  status?: ApplicationStatus,
  signal?: AbortSignal,
): Promise<ApplicationList> {
  const searchParams = new URLSearchParams();

  if (status !== undefined) {
    searchParams.set("status", status);
  }

  const query = searchParams.toString();

  return requestCareerOpsApi(
    `/api/applications${query === "" ? "" : `?${query}`}`,
    applicationListSchema,
    signal,
  );
}

export async function fetchApplication(
  applicationId: string,
  signal?: AbortSignal,
): Promise<ApplicationSummary> {
  return requestCareerOpsApi(
    `/api/applications/${encodeURIComponent(applicationId)}`,
    applicationSummarySchema,
    signal,
  );
}

export async function fetchApplicationAnalysis(
  applicationId: string,
  signal?: AbortSignal,
): Promise<ApplicationAnalysis> {
  return requestCareerOpsApi(
    `/api/applications/${encodeURIComponent(applicationId)}/analysis`,
    applicationAnalysisSchema,
    signal,
  );
}

async function requestCareerOpsApi<Result>(
  url: string,
  schema: z.ZodType<Result>,
  signal?: AbortSignal,
): Promise<Result> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new ApplicationsApiError(
      "CareerOps returned an invalid response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(body);

    throw new ApplicationsApiError(
      parsedError.success
        ? parsedError.data.error.message
        : "Unable to load applications.",
      response.status,
      parsedError.success ? parsedError.data.error.code : "REQUEST_FAILED",
    );
  }

  const parsedResult = schema.safeParse(body);

  if (!parsedResult.success) {
    throw new ApplicationsApiError(
      "CareerOps returned an invalid response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  return parsedResult.data;
}

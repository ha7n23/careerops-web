import { z } from "zod";

import {
  applicationAnalysisSchema,
  prepareApplicationResultSchema,
  type ApplicationAnalysis,
  type PrepareApplicationRequest,
  type PrepareApplicationResult,
} from "@/features/applications/analysis-contracts";

import {
  applicationListSchema,
  applicationSummarySchema,
  type ApplicationList,
  type ApplicationStatus,
  type ApplicationSummary,
  type CreateApplicationRequest,
} from "@/features/applications/contracts";

import {
  reviewApplicationResultSchema,
  type ReviewApplicationRequest,
  type ReviewApplicationResult,
} from "@/features/applications/review-contracts";

import {
  pendingActionsSchema,
  type PendingActions,
} from "@/features/applications/pending-actions-contracts";

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

export async function fetchPendingActions(
  signal?: AbortSignal,
): Promise<PendingActions> {
  return requestCareerOpsApi(
    "/api/actions/pending",
    pendingActionsSchema,
    signal,
  );
}

export async function createApplication(
  input: CreateApplicationRequest,
): Promise<ApplicationSummary> {
  return requestCareerOpsApi(
    "/api/applications",
    applicationSummarySchema,
    undefined,
    { method: "POST", body: input },
  );
}

export async function prepareApplication(
  applicationId: string,
  input: PrepareApplicationRequest,
): Promise<PrepareApplicationResult> {
  return requestCareerOpsApi(
    `/api/applications/${encodeURIComponent(applicationId)}/prepare`,
    prepareApplicationResultSchema,
    undefined,
    { method: "POST", body: input },
  );
}

export async function reviewApplication(
  applicationId: string,
  input: ReviewApplicationRequest,
): Promise<ReviewApplicationResult> {
  return requestCareerOpsApi(
    `/api/applications/${encodeURIComponent(applicationId)}/review`,
    reviewApplicationResultSchema,
    undefined,
    { method: "POST", body: input },
  );
}

type ApiRequestOptions = {
  method: "POST";
  body: unknown;
};

async function requestCareerOpsApi<Result>(
  url: string,
  schema: z.ZodType<Result>,
  signal?: AbortSignal,
  options?: ApiRequestOptions,
): Promise<Result> {
  const response = await fetch(
    url,
    options === undefined
      ? {
          headers: { Accept: "application/json" },
          signal,
        }
      : {
          method: options.method,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(options.body),
          signal,
        },
  );

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

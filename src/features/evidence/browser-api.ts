import { z } from "zod";

import {
  evidenceDocumentHistorySchema,
  evidenceDocumentSchema,
  evidenceReviewHistorySchema,
  evidenceReviewSchema,
  evidenceRegistryPageSchema,
  registryEvidenceSchema,
  type CreateTextEvidenceRequest,
  type EvidenceDocument,
  type EvidenceDocumentHistory,
  type EvidenceReview,
  type EvidenceReviewDecision,
  type EvidenceReviewHistory,
  type EvidenceRegistryEdit,
  type EvidenceRegistryPage,
  type EvidenceRegistryQuery,
  type RegistryEvidence,
} from "@/features/evidence/contracts";

const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export class EvidenceApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "EvidenceApiError";
  }
}

export function fetchEvidenceDocuments(
  signal?: AbortSignal,
): Promise<EvidenceDocumentHistory> {
  return requestEvidenceApi(
    "/api/evidence/documents",
    evidenceDocumentHistorySchema,
    { signal },
  );
}

export function fetchEvidenceReviews(
  signal?: AbortSignal,
): Promise<EvidenceReviewHistory> {
  return requestEvidenceApi(
    "/api/evidence/reviews",
    evidenceReviewHistorySchema,
    { signal },
  );
}

export function fetchEvidenceReview(
  reviewRunId: string,
  signal?: AbortSignal,
): Promise<EvidenceReview> {
  return requestEvidenceApi(
    `/api/evidence/reviews/${encodeURIComponent(reviewRunId)}`,
    evidenceReviewSchema,
    { signal },
  );
}

export function createTextEvidence(
  input: CreateTextEvidenceRequest,
): Promise<EvidenceDocument> {
  return requestEvidenceApi("/api/evidence/documents", evidenceDocumentSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function uploadEvidence(file: File): Promise<EvidenceDocument> {
  const formData = new FormData();
  formData.set("file", file, file.name);

  return requestEvidenceApi("/api/evidence/documents", evidenceDocumentSchema, {
    method: "POST",
    body: formData,
  });
}

export function startEvidenceReview(
  documentId: string,
): Promise<EvidenceReview> {
  return requestEvidenceApi(
    `/api/evidence/documents/${encodeURIComponent(documentId)}/review`,
    evidenceReviewSchema,
    { method: "POST" },
  );
}

export function submitEvidenceDecision(
  reviewRunId: string,
  decision: EvidenceReviewDecision,
): Promise<EvidenceReview> {
  return requestEvidenceApi(
    `/api/evidence/reviews/${encodeURIComponent(reviewRunId)}/decision`,
    evidenceReviewSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(decision),
    },
  );
}

export function fetchEvidenceRegistry(
  query: EvidenceRegistryQuery,
  signal?: AbortSignal,
): Promise<EvidenceRegistryPage> {
  const search = new URLSearchParams({
    lifecycleStatus: query.lifecycleStatus,
    offset: String(query.offset),
    limit: String(query.limit),
  });

  if (query.query !== "") {
    search.set("q", query.query);
  }

  if (query.category !== null) {
    search.set("category", query.category);
  }

  return requestEvidenceApi(
    `/api/evidence/registry?${search.toString()}`,
    evidenceRegistryPageSchema,
    { signal },
  );
}

export function fetchRegistryEvidence(
  evidenceId: string,
  signal?: AbortSignal,
): Promise<RegistryEvidence> {
  return requestEvidenceApi(
    `/api/evidence/registry/${encodeURIComponent(evidenceId)}`,
    registryEvidenceSchema,
    { signal },
  );
}

export function updateRegistryEvidence(
  evidenceId: string,
  edit: EvidenceRegistryEdit,
): Promise<RegistryEvidence> {
  return requestEvidenceApi(
    `/api/evidence/registry/${encodeURIComponent(evidenceId)}`,
    registryEvidenceSchema,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edit),
    },
  );
}

export function changeRegistryEvidenceLifecycle(
  evidenceId: string,
  action: "archive" | "restore",
): Promise<RegistryEvidence> {
  return requestEvidenceApi(
    `/api/evidence/registry/${encodeURIComponent(evidenceId)}/lifecycle`,
    registryEvidenceSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    },
  );
}

async function requestEvidenceApi<Result>(
  url: string,
  schema: z.ZodType<Result>,
  options: RequestInit,
): Promise<Result> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new EvidenceApiError(
      "CareerOps returned an invalid response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(body);

    throw new EvidenceApiError(
      parsedError.success
        ? parsedError.data.error.message
        : "The evidence request could not be completed.",
      response.status,
      parsedError.success ? parsedError.data.error.code : "REQUEST_FAILED",
    );
  }

  const parsedResult = schema.safeParse(body);

  if (!parsedResult.success) {
    throw new EvidenceApiError(
      "CareerOps returned evidence data that did not match its contract.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  return parsedResult.data;
}

import { z } from "zod";

const errorResponseSchema = z.object({
  detail: z.string().min(1).optional(),
});

const errorCodesByStatus = {
  401: "AUTH_REQUIRED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "WORKFLOW_CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  422: "INVALID_REQUEST",
  502: "INVALID_UPSTREAM_RESPONSE",
  503: "SERVICE_UNAVAILABLE",
} as const;

export type CareerOpsGatewayErrorCode =
  | (typeof errorCodesByStatus)[keyof typeof errorCodesByStatus]
  | "INVALID_RESPONSE"
  | "NETWORK_ERROR"
  | "UNEXPECTED_ERROR";

type FetchImplementation = typeof fetch;

type GatewayClientOptions = {
  accessToken: string;
  baseUrl: string;
  fetchImplementation?: FetchImplementation;
};

type GatewayRequestOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
};

export class CareerOpsGatewayError extends Error {
  readonly code: CareerOpsGatewayErrorCode;
  readonly retryable: boolean;
  readonly status: number | null;

  constructor({
    code,
    message,
    status,
  }: {
    code: CareerOpsGatewayErrorCode;
    message: string;
    status: number | null;
  }) {
    super(message);
    this.name = "CareerOpsGatewayError";
    this.code = code;
    this.status = status;
    this.retryable = status === null || status === 502 || status === 503;
  }
}

export class CareerOpsGatewayClient {
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly fetchImplementation: FetchImplementation;

  constructor({
    accessToken,
    baseUrl,
    fetchImplementation = fetch,
  }: GatewayClientOptions) {
    if (accessToken.trim().length === 0) {
      throw new Error("A Module 2 API access token is required.");
    }

    this.accessToken = accessToken;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.fetchImplementation = fetchImplementation;
  }

  async requestJson<Result>(
    path: string,
    resultSchema: z.ZodType<Result, z.ZodTypeDef, unknown>,
    options: GatewayRequestOptions = {},
  ): Promise<Result> {
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");

    const response = await this.request(path, {
      ...options,
      headers,
    });

    let body: unknown;

    try {
      body = await response.json();
    } catch {
      throw new CareerOpsGatewayError({
        code: "INVALID_RESPONSE",
        message: "CareerOps returned a response that could not be read.",
        status: 502,
      });
    }

    const parsedBody = resultSchema.safeParse(body);

    if (!parsedBody.success) {
      throw new CareerOpsGatewayError({
        code: "INVALID_RESPONSE",
        message: "CareerOps returned data that did not match its contract.",
        status: 502,
      });
    }

    return parsedBody.data;
  }

  async request(path: string, options: GatewayRequestOptions = {}) {
    if (!path.startsWith("/")) {
      throw new Error("CareerOps gateway paths must start with '/'.");
    }

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${this.accessToken}`);

    try {
      const response = await this.fetchImplementation(
        `${this.baseUrl}${path}`,
        {
          ...options,
          cache: "no-store",
          headers,
        },
      );

      if (!response.ok) {
        throw await createResponseError(response);
      }

      return response;
    } catch (error) {
      if (error instanceof CareerOpsGatewayError) {
        throw error;
      }

      throw new CareerOpsGatewayError({
        code: "NETWORK_ERROR",
        message: "CareerOps services could not be reached.",
        status: null,
      });
    }
  }
}

async function createResponseError(
  response: Response,
): Promise<CareerOpsGatewayError> {
  let detail: string | undefined;

  try {
    const parsedBody = errorResponseSchema.safeParse(await response.json());
    detail = parsedBody.success ? parsedBody.data.detail : undefined;
  } catch {
    detail = undefined;
  }

  const code =
    errorCodesByStatus[response.status as keyof typeof errorCodesByStatus] ??
    "UNEXPECTED_ERROR";

  return new CareerOpsGatewayError({
    code,
    message: detail ?? defaultMessageForStatus(response.status),
    status: response.status,
  });
}

function defaultMessageForStatus(status: number): string {
  if (status === 401) {
    return "Your CareerOps session is no longer valid.";
  }

  if (status === 403) {
    return "Your CareerOps session cannot perform this action.";
  }

  if (status === 404) {
    return "The requested CareerOps resource was not found.";
  }

  if (status === 409) {
    return "This workflow changed. Refresh it before trying again.";
  }

  if (status === 413) {
    return "The selected evidence file is too large.";
  }

  if (status === 422) {
    return "CareerOps could not accept the submitted information.";
  }

  if (status === 502 || status === 503) {
    return "CareerOps services are temporarily unavailable.";
  }

  return "CareerOps could not complete the request.";
}

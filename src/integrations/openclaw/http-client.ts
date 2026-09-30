import { z } from "zod";

const completionSchema = z.object({
  id: z.string().min(1),
  choices: z
    .array(
      z.object({
        message: z.object({
          role: z.literal("assistant"),
          content: z.string().trim().min(1),
        }),
      }),
    )
    .min(1),
});

type FetchImplementation = typeof fetch;

type OpenClawClientOptions = {
  accessToken: string;
  baseUrl: string;
  fetchImplementation?: FetchImplementation;
  model: string;
  timeoutMs: number;
};

export type OpenClawErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_RESPONSE"
  | "NETWORK_ERROR"
  | "RATE_LIMITED"
  | "REQUEST_REJECTED"
  | "SERVICE_UNAVAILABLE"
  | "TIMEOUT";

export class OpenClawError extends Error {
  readonly code: OpenClawErrorCode;
  readonly retryable: boolean;
  readonly status: number;

  constructor({
    code,
    message,
    retryable,
    status,
  }: {
    code: OpenClawErrorCode;
    message: string;
    retryable: boolean;
    status: number;
  }) {
    super(message);
    this.name = "OpenClawError";
    this.code = code;
    this.retryable = retryable;
    this.status = status;
  }
}

export class OpenClawClient {
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly fetchImplementation: FetchImplementation;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor({
    accessToken,
    baseUrl,
    fetchImplementation = fetch,
    model,
    timeoutMs,
  }: OpenClawClientOptions) {
    if (accessToken.trim().length === 0) {
      throw new Error("An OpenClaw gateway token is required.");
    }

    this.accessToken = accessToken;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.fetchImplementation = fetchImplementation;
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  async sendMessage({
    conversationId,
    message,
  }: {
    conversationId: string;
    message: string;
  }): Promise<{ content: string; id: string }> {
    let response: Response;

    try {
      response = await this.fetchImplementation(
        `${this.baseUrl}/v1/chat/completions`,
        {
          method: "POST",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            user: `careerops-web:${conversationId}`,
            messages: [{ role: "user", content: message }],
            stream: false,
          }),
          signal: AbortSignal.timeout(this.timeoutMs),
        },
      );
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new OpenClawError({
          code: "TIMEOUT",
          message: "The assistant took too long to respond.",
          retryable: true,
          status: 504,
        });
      }

      throw new OpenClawError({
        code: "NETWORK_ERROR",
        message: "The assistant service could not be reached.",
        retryable: true,
        status: 503,
      });
    }

    if (!response.ok) {
      throw errorForStatus(response.status);
    }

    let body: unknown;

    try {
      body = await response.json();
    } catch {
      throw invalidResponseError();
    }

    const parsedBody = completionSchema.safeParse(body);

    if (!parsedBody.success) {
      throw invalidResponseError();
    }

    return {
      id: parsedBody.data.id,
      content: parsedBody.data.choices[0].message.content,
    };
  }
}

function invalidResponseError(): OpenClawError {
  return new OpenClawError({
    code: "INVALID_RESPONSE",
    message: "The assistant returned an invalid response.",
    retryable: true,
    status: 502,
  });
}

function errorForStatus(status: number): OpenClawError {
  if (status === 401 || status === 403) {
    return new OpenClawError({
      code: "AUTH_REQUIRED",
      message: "The assistant connection is not authorized.",
      retryable: false,
      status,
    });
  }

  if (status === 429) {
    return new OpenClawError({
      code: "RATE_LIMITED",
      message: "The free assistant model is busy. Try again shortly.",
      retryable: true,
      status,
    });
  }

  if (status >= 500) {
    return new OpenClawError({
      code: "SERVICE_UNAVAILABLE",
      message: "The assistant is temporarily unavailable.",
      retryable: true,
      status: 503,
    });
  }

  return new OpenClawError({
    code: "REQUEST_REJECTED",
    message: "The assistant could not process that request.",
    retryable: false,
    status: 400,
  });
}

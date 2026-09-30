import { z } from "zod";

import {
  assistantMessageResponseSchema,
  type AssistantMessageResponse,
} from "@/features/assistant/contracts";

const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean(),
  }),
});

export class AssistantApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "AssistantApiError";
  }
}

export async function sendAssistantMessage(
  message: string,
): Promise<AssistantMessageResponse> {
  const response = await fetch("/api/assistant/messages", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  return parseResponse(response);
}

export async function resetAssistantSession(): Promise<void> {
  const response = await fetch("/api/assistant/session", {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new AssistantApiError(
      "A new assistant conversation could not be started.",
      response.status,
      "RESET_FAILED",
      true,
    );
  }
}

async function parseResponse(
  response: Response,
): Promise<AssistantMessageResponse> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new AssistantApiError(
      "The assistant returned an invalid response.",
      response.status,
      "INVALID_RESPONSE",
      true,
    );
  }

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(body);

    throw new AssistantApiError(
      parsedError.success
        ? parsedError.data.error.message
        : "The assistant request could not be completed.",
      response.status,
      parsedError.success ? parsedError.data.error.code : "REQUEST_FAILED",
      parsedError.success ? parsedError.data.error.retryable : true,
    );
  }

  const parsedResult = assistantMessageResponseSchema.safeParse(body);

  if (!parsedResult.success) {
    throw new AssistantApiError(
      "The assistant returned an invalid response.",
      response.status,
      "INVALID_RESPONSE",
      true,
    );
  }

  return parsedResult.data;
}

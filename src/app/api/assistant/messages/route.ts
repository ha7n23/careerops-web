import { randomUUID } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";

import { assistantMessageRequestSchema } from "@/features/assistant/contracts";
import { ASSISTANT_SESSION_COOKIE } from "@/features/assistant/session";
import { sendOpenClawAssistantMessage } from "@/features/assistant/server";
import { OpenClawError } from "@/integrations/openclaw/http-client";

const privateNoStoreHeaders = {
  "Cache-Control": "private, no-store",
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return invalidRequestResponse();
  }

  const parsedRequest = assistantMessageRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return invalidRequestResponse();
  }

  const existingConversationId = request.cookies.get(
    ASSISTANT_SESSION_COOKIE,
  )?.value;
  const conversationId = isConversationId(existingConversationId)
    ? existingConversationId
    : randomUUID();

  try {
    const completion = await sendOpenClawAssistantMessage({
      conversationId,
      message: parsedRequest.data.message,
    });
    const response = NextResponse.json(
      {
        message: {
          id: completion.id,
          role: "assistant",
          content: completion.content,
        },
      },
      { headers: privateNoStoreHeaders },
    );

    setConversationCookie(response, conversationId);
    return response;
  } catch (error) {
    console.error("Failed to complete a CareerOps assistant turn.", error);
    const response = assistantErrorResponse(error);
    setConversationCookie(response, conversationId);
    return response;
  }
}

function assistantErrorResponse(error: unknown): NextResponse {
  if (error instanceof OpenClawError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          retryable: error.retryable,
        },
      },
      { status: error.status, headers: privateNoStoreHeaders },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "SERVICE_UNAVAILABLE",
        message:
          "The assistant is not configured or is temporarily unavailable.",
        retryable: true,
      },
    },
    { status: 503, headers: privateNoStoreHeaders },
  );
}

function invalidRequestResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "INVALID_ASSISTANT_MESSAGE",
        message: "Enter a message between 1 and 4,000 characters.",
        retryable: false,
      },
    },
    { status: 400, headers: privateNoStoreHeaders },
  );
}

function isConversationId(value: string | undefined): value is string {
  return value !== undefined && /^[0-9a-f-]{36}$/i.test(value);
}

function setConversationCookie(
  response: NextResponse,
  conversationId: string,
): void {
  response.cookies.set(ASSISTANT_SESSION_COOKIE, conversationId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OpenClawError } from "@/integrations/openclaw/http-client";

const { sendMessageMock } = vi.hoisted(() => ({
  sendMessageMock: vi.fn(),
}));

vi.mock("@/features/assistant/server", () => ({
  sendOpenClawAssistantMessage: sendMessageMock,
}));

import { POST } from "@/app/api/assistant/messages/route";
import { ASSISTANT_SESSION_COOKIE } from "@/features/assistant/session";

describe("POST /api/assistant/messages", () => {
  beforeEach(() => {
    sendMessageMock.mockReset();
  });

  it("uses an opaque server cookie to preserve the OpenClaw conversation", async () => {
    sendMessageMock.mockResolvedValue({
      id: "chatcmpl-001",
      content: "You have one pending review.",
    });
    const conversationId = "2f7e3dfa-bdd3-42bb-874d-33cdf6bfa3e8";
    const response = await POST(
      new NextRequest("http://localhost/api/assistant/messages", {
        method: "POST",
        headers: {
          Cookie: `${ASSISTANT_SESSION_COOKIE}=${conversationId}`,
        },
        body: JSON.stringify({ message: "What needs my attention?" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      message: {
        id: "chatcmpl-001",
        role: "assistant",
        content: "You have one pending review.",
      },
    });
    expect(sendMessageMock).toHaveBeenCalledWith({
      conversationId,
      message: "What needs my attention?",
    });
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("rejects invalid input before OpenClaw is called", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/assistant/messages", {
        method: "POST",
        body: JSON.stringify({ message: "   " }),
      }),
    );

    expect(response.status).toBe(400);
    expect(sendMessageMock).not.toHaveBeenCalled();
  });

  it("returns a browser-safe OpenClaw failure", async () => {
    sendMessageMock.mockRejectedValue(
      new OpenClawError({
        code: "RATE_LIMITED",
        message: "The free assistant model is busy. Try again shortly.",
        retryable: true,
        status: 429,
      }),
    );
    const response = await POST(
      new NextRequest("http://localhost/api/assistant/messages", {
        method: "POST",
        body: JSON.stringify({ message: "Show my evidence" }),
      }),
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: {
        code: "RATE_LIMITED",
        message: "The free assistant model is busy. Try again shortly.",
        retryable: true,
      },
    });
    expect(response.headers.get("set-cookie")).toContain(
      ASSISTANT_SESSION_COOKIE,
    );
  });
});

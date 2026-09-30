import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AssistantApiError,
  resetAssistantSession,
  sendAssistantMessage,
} from "@/features/assistant/browser-api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("assistant browser API", () => {
  it("sends messages only through the internal BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        message: {
          id: "chatcmpl-001",
          role: "assistant",
          content: "Your evidence is ready.",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendAssistantMessage("Show my evidence")).resolves.toEqual({
      message: {
        id: "chatcmpl-001",
        role: "assistant",
        content: "Your evidence is ready.",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/assistant/messages", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Show my evidence" }),
    });
  });

  it("preserves a safe retryable assistant error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: {
              code: "RATE_LIMITED",
              message: "The free assistant model is busy. Try again shortly.",
              retryable: true,
            },
          },
          { status: 429 },
        ),
      ),
    );

    await expect(
      sendAssistantMessage("Show my evidence"),
    ).rejects.toMatchObject({
      name: "AssistantApiError",
      code: "RATE_LIMITED",
      retryable: true,
      status: 429,
    } satisfies Partial<AssistantApiError>);
  });

  it("resets the server-side conversation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ status: "reset" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(resetAssistantSession()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/assistant/session", {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
  });
});

import { describe, expect, it, vi } from "vitest";

import {
  OpenClawClient,
  OpenClawError,
} from "@/integrations/openclaw/http-client";

function createClient(fetchImplementation: typeof fetch) {
  return new OpenClawClient({
    accessToken: "gateway-secret",
    baseUrl: "http://127.0.0.1:18789/",
    fetchImplementation,
    model: "openclaw/default",
    timeoutMs: 30_000,
  });
}

describe("OpenClawClient", () => {
  it("sends a server-authenticated, stateful assistant turn", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        id: "chatcmpl-001",
        choices: [
          {
            message: {
              role: "assistant",
              content: "You have two pending actions.",
            },
          },
        ],
      }),
    );

    await expect(
      createClient(fetchMock).sendMessage({
        conversationId: "2f7e3dfa-bdd3-42bb-874d-33cdf6bfa3e8",
        message: "What needs my attention?",
      }),
    ).resolves.toEqual({
      id: "chatcmpl-001",
      content: "You have two pending actions.",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://127.0.0.1:18789/v1/chat/completions");
    expect(options.cache).toBe("no-store");
    expect(new Headers(options.headers).get("Authorization")).toBe(
      "Bearer gateway-secret",
    );
    expect(JSON.parse(String(options.body))).toEqual({
      model: "openclaw/default",
      user: "careerops-web:2f7e3dfa-bdd3-42bb-874d-33cdf6bfa3e8",
      messages: [{ role: "user", content: "What needs my attention?" }],
      stream: false,
    });
  });

  it("maps authorization failures without exposing upstream details", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { error: { message: "secret internal reason" } },
          { status: 401 },
        ),
      );

    await expect(
      createClient(fetchMock).sendMessage({
        conversationId: "2f7e3dfa-bdd3-42bb-874d-33cdf6bfa3e8",
        message: "Hello",
      }),
    ).rejects.toMatchObject({
      name: "OpenClawError",
      code: "AUTH_REQUIRED",
      message: "The assistant connection is not authorized.",
      retryable: false,
      status: 401,
    } satisfies Partial<OpenClawError>);
  });

  it("rejects a successful response that violates the contract", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ id: "chatcmpl-001", choices: [] }));

    await expect(
      createClient(fetchMock).sendMessage({
        conversationId: "2f7e3dfa-bdd3-42bb-874d-33cdf6bfa3e8",
        message: "Hello",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      status: 502,
    } satisfies Partial<OpenClawError>);
  });
});

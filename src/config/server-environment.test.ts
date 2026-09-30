import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "@/config/server-environment";

describe("parseServerEnvironment", () => {
  it("uses the local Module 2 endpoint by default", () => {
    expect(parseServerEnvironment({})).toEqual({
      apiAccessToken: undefined,
      apiUrl: "http://127.0.0.1:8001",
      mcpAccessToken: undefined,
      mcpUrl: "http://127.0.0.1:8001/mcp",
      openClawAssistantModel: "openclaw/default",
      openClawGatewayToken: undefined,
      openClawGatewayUrl: "http://127.0.0.1:18789",
      openClawRequestTimeoutMs: 120_000,
    });
  });

  it("accepts configured Module 2 endpoints and access tokens", () => {
    expect(
      parseServerEnvironment({
        CAREEROPS_API_ACCESS_TOKEN: "test-api-token",
        CAREEROPS_API_URL: "https://gateway.example.com",
        CAREEROPS_MCP_ACCESS_TOKEN: "test-access-token",
        CAREEROPS_MCP_URL: "https://mcp.example.com/mcp",
        OPENCLAW_ASSISTANT_MODEL: "openclaw/careerops",
        OPENCLAW_GATEWAY_TOKEN: "test-openclaw-token",
        OPENCLAW_GATEWAY_URL: "https://assistant.example.com",
        OPENCLAW_REQUEST_TIMEOUT_MS: "45000",
      }),
    ).toEqual({
      apiAccessToken: "test-api-token",
      apiUrl: "https://gateway.example.com",
      mcpAccessToken: "test-access-token",
      mcpUrl: "https://mcp.example.com/mcp",
      openClawAssistantModel: "openclaw/careerops",
      openClawGatewayToken: "test-openclaw-token",
      openClawGatewayUrl: "https://assistant.example.com",
      openClawRequestTimeoutMs: 45_000,
    });
  });

  it("rejects an invalid MCP endpoint", () => {
    expect(() =>
      parseServerEnvironment({
        CAREEROPS_MCP_URL: "not-a-url",
      }),
    ).toThrow("Invalid server environment configuration");
  });

  it("rejects an invalid REST gateway endpoint", () => {
    expect(() =>
      parseServerEnvironment({
        CAREEROPS_API_URL: "/api/v1",
      }),
    ).toThrow("Invalid server environment configuration");
  });

  it("rejects an invalid OpenClaw timeout", () => {
    expect(() =>
      parseServerEnvironment({
        OPENCLAW_REQUEST_TIMEOUT_MS: "500",
      }),
    ).toThrow("Invalid server environment configuration");
  });
});

import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "@/config/server-environment";

describe("parseServerEnvironment", () => {
  it("uses the local Module 2 endpoint by default", () => {
    expect(parseServerEnvironment({})).toEqual({
      apiAccessToken: undefined,
      apiUrl: "http://127.0.0.1:8001",
      mcpAccessToken: undefined,
      mcpUrl: "http://127.0.0.1:8001/mcp",
    });
  });

  it("accepts configured Module 2 endpoints and access tokens", () => {
    expect(
      parseServerEnvironment({
        CAREEROPS_API_ACCESS_TOKEN: "test-api-token",
        CAREEROPS_API_URL: "https://gateway.example.com",
        CAREEROPS_MCP_ACCESS_TOKEN: "test-access-token",
        CAREEROPS_MCP_URL: "https://mcp.example.com/mcp",
      }),
    ).toEqual({
      apiAccessToken: "test-api-token",
      apiUrl: "https://gateway.example.com",
      mcpAccessToken: "test-access-token",
      mcpUrl: "https://mcp.example.com/mcp",
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
});

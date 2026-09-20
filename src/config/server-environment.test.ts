import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "@/config/server-environment";

describe("parseServerEnvironment", () => {
  it("uses the local Module 2 endpoint by default", () => {
    expect(parseServerEnvironment({})).toEqual({
      mcpAccessToken: undefined,
      mcpUrl: "http://127.0.0.1:8001/mcp",
    });
  });

  it("accepts a configured MCP endpoint and access token", () => {
    expect(
      parseServerEnvironment({
        CAREEROPS_MCP_ACCESS_TOKEN: "test-access-token",
        CAREEROPS_MCP_URL: "https://mcp.example.com/mcp",
      }),
    ).toEqual({
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
});

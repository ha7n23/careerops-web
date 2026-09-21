import "server-only";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { serverEnvironment } from "@/config/server";

type McpOperation<Result> = (client: Client) => Promise<Result>;

export async function withCareerOpsMcpClient<Result>(
  operation: McpOperation<Result>,
): Promise<Result> {
  const client = new Client({
    name: "careerops-web",
    version: "0.1.0",
  });

  const requestInit: RequestInit | undefined =
    serverEnvironment.mcpAccessToken === undefined
      ? undefined
      : {
          headers: {
            Authorization: `Bearer ${serverEnvironment.mcpAccessToken}`,
          },
        };

  const transport = new StreamableHTTPClientTransport(
    new URL(serverEnvironment.mcpUrl),
    { requestInit },
  );

  try {
    await client.connect(transport);
    return await operation(client);
  } finally {
    await client.close();
  }
}

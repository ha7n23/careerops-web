import { z } from "zod";

const optionalSecret = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const serverEnvironmentSchema = z.object({
  CAREEROPS_API_ACCESS_TOKEN: optionalSecret,
  CAREEROPS_API_URL: z.string().url().default("http://127.0.0.1:8001"),
  CAREEROPS_MCP_URL: z.string().url().default("http://127.0.0.1:8001/mcp"),
  CAREEROPS_MCP_ACCESS_TOKEN: optionalSecret,
  OPENCLAW_ASSISTANT_MODEL: z.string().min(1).default("openclaw/default"),
  OPENCLAW_GATEWAY_TOKEN: optionalSecret,
  OPENCLAW_GATEWAY_URL: z.string().url().default("http://127.0.0.1:18789"),
  OPENCLAW_REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(300_000)
    .default(120_000),
});

export type ServerEnvironment = {
  apiAccessToken?: string;
  apiUrl: string;
  mcpAccessToken?: string;
  mcpUrl: string;
  openClawAssistantModel: string;
  openClawGatewayToken?: string;
  openClawGatewayUrl: string;
  openClawRequestTimeoutMs: number;
};

type EnvironmentValues = Readonly<Record<string, string | undefined>>;

export function parseServerEnvironment(
  environment: EnvironmentValues,
): ServerEnvironment {
  const result = serverEnvironmentSchema.safeParse(environment);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid server environment configuration: ${details}`);
  }

  return {
    apiAccessToken: result.data.CAREEROPS_API_ACCESS_TOKEN,
    apiUrl: result.data.CAREEROPS_API_URL,
    mcpAccessToken: result.data.CAREEROPS_MCP_ACCESS_TOKEN,
    mcpUrl: result.data.CAREEROPS_MCP_URL,
    openClawAssistantModel: result.data.OPENCLAW_ASSISTANT_MODEL,
    openClawGatewayToken: result.data.OPENCLAW_GATEWAY_TOKEN,
    openClawGatewayUrl: result.data.OPENCLAW_GATEWAY_URL,
    openClawRequestTimeoutMs: result.data.OPENCLAW_REQUEST_TIMEOUT_MS,
  };
}

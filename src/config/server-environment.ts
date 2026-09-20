import { z } from "zod";

const optionalSecret = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const serverEnvironmentSchema = z.object({
  CAREEROPS_MCP_URL: z.string().url().default("http://127.0.0.1:8001/mcp"),
  CAREEROPS_MCP_ACCESS_TOKEN: optionalSecret,
});

export type ServerEnvironment = {
  mcpAccessToken?: string;
  mcpUrl: string;
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
    mcpAccessToken: result.data.CAREEROPS_MCP_ACCESS_TOKEN,
    mcpUrl: result.data.CAREEROPS_MCP_URL,
  };
}

import "server-only";

import { serverEnvironment } from "@/config/server";
import { OpenClawClient } from "@/integrations/openclaw/http-client";

export function createOpenClawClient(): OpenClawClient {
  const accessToken = serverEnvironment.openClawGatewayToken;

  if (accessToken === undefined) {
    throw new Error(
      "OPENCLAW_GATEWAY_TOKEN is required for the CareerOps assistant.",
    );
  }

  return new OpenClawClient({
    accessToken,
    baseUrl: serverEnvironment.openClawGatewayUrl,
    model: serverEnvironment.openClawAssistantModel,
    timeoutMs: serverEnvironment.openClawRequestTimeoutMs,
  });
}

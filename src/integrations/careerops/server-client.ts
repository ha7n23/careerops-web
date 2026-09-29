import "server-only";

import { serverEnvironment } from "@/config/server";
import { CareerOpsGatewayClient } from "@/integrations/careerops/http-client";

export function createCareerOpsGatewayClient(): CareerOpsGatewayClient {
  const accessToken = serverEnvironment.apiAccessToken;

  if (accessToken === undefined) {
    throw new Error(
      "CAREEROPS_API_ACCESS_TOKEN is required for Module 2 REST workflows.",
    );
  }

  return new CareerOpsGatewayClient({
    accessToken,
    baseUrl: serverEnvironment.apiUrl,
  });
}

import {
  CareerOpsGatewayError,
  type CareerOpsGatewayErrorCode,
} from "@/integrations/careerops/http-client";

export const privateNoStoreHeaders = {
  "Cache-Control": "private, no-store",
};

export function gatewayErrorResponse(
  error: unknown,
  fallbackMessage: string,
): Response {
  if (error instanceof CareerOpsGatewayError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      {
        status: browserStatus(error.status, error.code),
        headers: privateNoStoreHeaders,
      },
    );
  }

  return Response.json(
    {
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: fallbackMessage,
      },
    },
    { status: 503, headers: privateNoStoreHeaders },
  );
}

function browserStatus(
  status: number | null,
  code: CareerOpsGatewayErrorCode,
): number {
  if (status === null || code === "NETWORK_ERROR") {
    return 503;
  }

  if (code === "INVALID_RESPONSE") {
    return 502;
  }

  return status;
}

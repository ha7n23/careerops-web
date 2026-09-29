import { z } from "zod";
import { describe, expect, it, vi } from "vitest";

import {
  CareerOpsGatewayClient,
  CareerOpsGatewayError,
} from "@/integrations/careerops/http-client";

const resultSchema = z.object({ status: z.literal("ready") });

describe("CareerOpsGatewayClient", () => {
  it("keeps the bearer credential server-side and validates JSON responses", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ status: "ready" }));
    const client = createClient(fetchImplementation);

    await expect(client.requestJson("/ready", resultSchema)).resolves.toEqual({
      status: "ready",
    });

    expect(fetchImplementation).toHaveBeenCalledOnce();
    const [url, request] = fetchImplementation.mock.calls[0];
    const headers = new Headers(request?.headers);

    expect(url).toBe("http://127.0.0.1:8001/ready");
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer test-token");
    expect(request?.cache).toBe("no-store");
  });

  it("maps frozen Module 2 errors to stable frontend errors", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json(
          { detail: "The workflow is no longer awaiting review." },
          { status: 409 },
        ),
      );
    const client = createClient(fetchImplementation);

    const request = client.requestJson("/api/v1/job-analysis", resultSchema);

    await expect(request).rejects.toMatchObject({
      code: "WORKFLOW_CONFLICT",
      message: "The workflow is no longer awaiting review.",
      retryable: false,
      status: 409,
    });
  });

  it("rejects successful responses that violate the expected contract", async () => {
    const client = createClient(
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json({ status: "unexpected" })),
    );

    await expect(
      client.requestJson("/ready", resultSchema),
    ).rejects.toBeInstanceOf(CareerOpsGatewayError);
  });

  it("marks connection failures as retryable without exposing internals", async () => {
    const client = createClient(
      vi.fn<typeof fetch>().mockRejectedValue(new Error("socket details")),
    );

    await expect(
      client.requestJson("/ready", resultSchema),
    ).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      message: "CareerOps services could not be reached.",
      retryable: true,
      status: null,
    });
  });
});

function createClient(fetchImplementation: typeof fetch) {
  return new CareerOpsGatewayClient({
    accessToken: "test-token",
    baseUrl: "http://127.0.0.1:8001/",
    fetchImplementation,
  });
}

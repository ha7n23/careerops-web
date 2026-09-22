import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  analysisApplicationId,
  reviewApplicationResult,
} from "@/test/application-analysis-fixtures";

const { reviewApplicationMock } = vi.hoisted(() => ({
  reviewApplicationMock: vi.fn(),
}));

vi.mock("@/features/applications/server", () => ({
  reviewApplication: reviewApplicationMock,
}));

import { POST } from "@/app/api/applications/[applicationId]/review/route";

function createContext(applicationId: string) {
  return {
    params: Promise.resolve({ applicationId }),
  };
}

describe("POST /api/applications/[applicationId]/review", () => {
  beforeEach(() => {
    reviewApplicationMock.mockReset();
  });

  it("submits a validated application review", async () => {
    reviewApplicationMock.mockResolvedValue(reviewApplicationResult);

    const response = await POST(
      new Request(
        `http://localhost/api/applications/${analysisApplicationId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idempotencyKey: " review-001 ",
            action: "approve",
            approvedProposalIds: ["CVP-001"],
          }),
        },
      ),
      createContext(analysisApplicationId),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");

    await expect(response.json()).resolves.toEqual(reviewApplicationResult);

    expect(reviewApplicationMock).toHaveBeenCalledWith(analysisApplicationId, {
      idempotencyKey: "review-001",
      action: "approve",
      approvedProposalIds: ["CVP-001"],
      rejectedProposalIds: [],
      edits: [],
      reviewerComment: null,
    });
  });

  it("rejects an invalid application ID", async () => {
    const response = await POST(
      new Request("http://localhost/api/applications/not-a-uuid/review", {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey: "review-001",
          action: "approve",
          approvedProposalIds: ["CVP-001"],
        }),
      }),
      createContext("not-a-uuid"),
    );

    expect(response.status).toBe(400);
    expect(reviewApplicationMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid review decision", async () => {
    const response = await POST(
      new Request(
        `http://localhost/api/applications/${analysisApplicationId}/review`,
        {
          method: "POST",
          body: JSON.stringify({
            idempotencyKey: "",
            action: "approve",
          }),
        },
      ),
      createContext(analysisApplicationId),
    );

    expect(response.status).toBe(400);

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_REVIEW_INPUT",
        message: "Enter a valid application review decision.",
      },
    });

    expect(reviewApplicationMock).not.toHaveBeenCalled();
  });

  it("returns a safe error when CareerOps review fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    reviewApplicationMock.mockRejectedValue(
      new Error("Sensitive upstream failure details"),
    );

    try {
      const response = await POST(
        new Request(
          `http://localhost/api/applications/${analysisApplicationId}/review`,
          {
            method: "POST",
            body: JSON.stringify({
              idempotencyKey: "review-001",
              action: "approve",
              approvedProposalIds: ["CVP-001"],
            }),
          },
        ),
        createContext(analysisApplicationId),
      );

      expect(response.status).toBe(502);

      await expect(response.json()).resolves.toEqual({
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "CareerOps services are temporarily unavailable.",
        },
      });

      expect(consoleError).toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });
});

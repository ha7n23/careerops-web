import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  analysisApplicationId,
  prepareApplicationResult,
} from "@/test/application-analysis-fixtures";

const { prepareApplicationMock } = vi.hoisted(() => ({
  prepareApplicationMock: vi.fn(),
}));

vi.mock("@/features/applications/server", () => ({
  prepareApplication: prepareApplicationMock,
}));

import { POST } from "@/app/api/applications/[applicationId]/prepare/route";

function createContext(applicationId: string) {
  return {
    params: Promise.resolve({ applicationId }),
  };
}

describe("POST /api/applications/[applicationId]/prepare", () => {
  beforeEach(() => {
    prepareApplicationMock.mockReset();
  });

  it("prepares an application using a validated job description", async () => {
    prepareApplicationMock.mockResolvedValue(prepareApplicationResult);

    const response = await POST(
      new Request(
        `http://localhost/api/applications/${analysisApplicationId}/prepare`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobDescription: " Strong Python skills are essential. ",
          }),
        },
      ),
      createContext(analysisApplicationId),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual(prepareApplicationResult);
    expect(prepareApplicationMock).toHaveBeenCalledWith(analysisApplicationId, {
      jobDescription: "Strong Python skills are essential.",
    });
  });

  it("rejects an invalid application ID before calling Module 2", async () => {
    const response = await POST(
      new Request("http://localhost/api/applications/not-a-uuid/prepare", {
        method: "POST",
        body: JSON.stringify({
          jobDescription: "Strong Python skills are essential.",
        }),
      }),
      createContext("not-a-uuid"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_APPLICATION_ID",
        message: "The requested application ID is invalid.",
      },
    });
    expect(prepareApplicationMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid job description before calling Module 2", async () => {
    const response = await POST(
      new Request(
        `http://localhost/api/applications/${analysisApplicationId}/prepare`,
        {
          method: "POST",
          body: JSON.stringify({ jobDescription: "   " }),
        },
      ),
      createContext(analysisApplicationId),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_PREPARATION_INPUT",
        message: "Enter a valid job description.",
      },
    });
    expect(prepareApplicationMock).not.toHaveBeenCalled();
  });

  it("returns a safe error when CareerOps preparation fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    prepareApplicationMock.mockRejectedValue(
      new Error("Sensitive upstream failure details"),
    );

    try {
      const response = await POST(
        new Request(
          `http://localhost/api/applications/${analysisApplicationId}/prepare`,
          {
            method: "POST",
            body: JSON.stringify({
              jobDescription: "Strong Python skills are essential.",
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

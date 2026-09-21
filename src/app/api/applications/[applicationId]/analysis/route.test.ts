import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApplicationAnalysisUnavailableError } from "@/features/applications/mcp";
import {
  analysisApplicationId,
  applicationAnalysis,
} from "@/test/application-analysis-fixtures";

const { getApplicationAnalysisMock } = vi.hoisted(() => ({
  getApplicationAnalysisMock: vi.fn(),
}));

vi.mock("@/features/applications/server", () => ({
  getApplicationAnalysis: getApplicationAnalysisMock,
}));

import { GET } from "@/app/api/applications/[applicationId]/analysis/route";

function routeContext(applicationId: string) {
  return {
    params: Promise.resolve({ applicationId }),
  };
}

describe("GET /api/applications/[applicationId]/analysis", () => {
  beforeEach(() => {
    getApplicationAnalysisMock.mockReset();
  });

  it("returns persisted application analysis", async () => {
    getApplicationAnalysisMock.mockResolvedValue(applicationAnalysis);

    const response = await GET(
      new Request(
        `http://localhost/api/applications/${analysisApplicationId}/analysis`,
      ),
      routeContext(analysisApplicationId),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual(applicationAnalysis);
    expect(getApplicationAnalysisMock).toHaveBeenCalledWith(
      analysisApplicationId,
    );
  });

  it("returns a normal response when analysis is unavailable", async () => {
    getApplicationAnalysisMock.mockRejectedValue(
      new ApplicationAnalysisUnavailableError(),
    );

    const response = await GET(
      new Request(
        `http://localhost/api/applications/${analysisApplicationId}/analysis`,
      ),
      routeContext(analysisApplicationId),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "ANALYSIS_NOT_AVAILABLE",
        message: "This application does not have an available analysis yet.",
      },
    });
  });
});

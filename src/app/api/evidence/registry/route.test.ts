import { beforeEach, describe, expect, it, vi } from "vitest";

import { evidenceRegistryPage } from "@/test/evidence-fixtures";

const { queryEvidenceRegistryMock } = vi.hoisted(() => ({
  queryEvidenceRegistryMock: vi.fn(),
}));

vi.mock("@/features/evidence/server", () => ({
  queryEvidenceRegistry: queryEvidenceRegistryMock,
}));

import { GET } from "@/app/api/evidence/registry/route";

describe("GET /api/evidence/registry", () => {
  beforeEach(() => {
    queryEvidenceRegistryMock.mockReset();
  });

  it("forwards validated search, filters, and pagination", async () => {
    queryEvidenceRegistryMock.mockResolvedValue(evidenceRegistryPage);

    const response = await GET(
      new Request(
        "http://localhost/api/evidence/registry?q=FastAPI&category=project&lifecycleStatus=active&offset=6&limit=6",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(queryEvidenceRegistryMock).toHaveBeenCalledWith({
      query: "FastAPI",
      category: "project",
      lifecycleStatus: "active",
      offset: 6,
      limit: 6,
    });
  });

  it("rejects invalid lifecycle filters before calling Module 2", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/evidence/registry?lifecycleStatus=deleted",
      ),
    );

    expect(response.status).toBe(400);
    expect(queryEvidenceRegistryMock).not.toHaveBeenCalled();
  });
});

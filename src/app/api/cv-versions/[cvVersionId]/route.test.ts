import { beforeEach, describe, expect, it, vi } from "vitest";

import { finalCvMetadata } from "@/test/final-cv-fixtures";

const { getFinalCvMock } = vi.hoisted(() => ({
  getFinalCvMock: vi.fn(),
}));

vi.mock("@/features/final-cv/server", () => ({
  getFinalCv: getFinalCvMock,
}));

import { GET } from "@/app/api/cv-versions/[cvVersionId]/route";

describe("GET /api/cv-versions/[cvVersionId]", () => {
  beforeEach(() => {
    getFinalCvMock.mockReset();
  });

  it("retrieves safe final CV metadata", async () => {
    getFinalCvMock.mockResolvedValue(finalCvMetadata);

    const response = await GET(
      new Request("http://localhost/api/cv-versions/CVV-001"),
      { params: Promise.resolve({ cvVersionId: "CVV-001" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(getFinalCvMock).toHaveBeenCalledWith("CVV-001");
  });

  it("rejects unsafe version identifiers", async () => {
    const response = await GET(
      new Request("http://localhost/api/cv-versions/invalid"),
      { params: Promise.resolve({ cvVersionId: "../invalid" }) },
    );

    expect(response.status).toBe(400);
    expect(getFinalCvMock).not.toHaveBeenCalled();
  });
});
